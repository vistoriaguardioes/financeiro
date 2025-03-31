
import { EventoFinanceiro, FiltroEvento } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";

// Classe para gerenciar operações com eventos financeiros
export class EventosService {
  private static readonly TABLE_NAME = "eventos_financeiros";
  private static readonly STORAGE_BUCKET = "documentos";
  
  // Obter todos os eventos
  static async getAll(): Promise<EventoFinanceiro[]> {
    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .select('*')
      .order('data_evento', { ascending: false });
    
    if (error) {
      console.error("Erro ao buscar eventos:", error);
      throw new Error(error.message);
    }
    
    // Mapear os dados do formato snake_case para camelCase
    return this.mapFromSupabase(data || []);
  }

  // Obter um evento por ID
  static async getById(id: string): Promise<EventoFinanceiro | undefined> {
    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // PGRST116 significa que nenhum registro foi encontrado
        return undefined;
      }
      console.error("Erro ao buscar evento por ID:", error);
      throw new Error(error.message);
    }
    
    // Mapear do formato snake_case para camelCase
    return this.mapFromSupabase([data])[0];
  }

  // Criar um novo evento
  static async create(evento: Omit<EventoFinanceiro, "id" | "createdAt" | "updatedAt">): Promise<EventoFinanceiro> {
    // Converter de camelCase para snake_case
    const snakeCaseEvento = {
      fornecedor: evento.fornecedor,
      placa_veiculo: evento.placaVeiculo,
      valor: evento.valor,
      data_evento: evento.dataEvento,
      motivo_evento: evento.motivoEvento,
      data_pagamento: evento.dataPagamento,
      nota_fiscal_url: evento.notaFiscalUrl,
      boleto_url: evento.boletoUrl
    };
    
    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .insert(snakeCaseEvento)
      .select('*')
      .single();
    
    if (error) {
      console.error("Erro ao criar evento:", error);
      throw new Error(error.message);
    }
    
    // Mapear do formato snake_case para camelCase
    return this.mapFromSupabase([data])[0];
  }

  // Atualizar um evento existente
  static async update(id: string, updates: Partial<EventoFinanceiro>): Promise<EventoFinanceiro | undefined> {
    // Converter de camelCase para snake_case
    const snakeCaseUpdates: Record<string, any> = {};
    
    if (updates.fornecedor !== undefined) snakeCaseUpdates.fornecedor = updates.fornecedor;
    if (updates.placaVeiculo !== undefined) snakeCaseUpdates.placa_veiculo = updates.placaVeiculo;
    if (updates.valor !== undefined) snakeCaseUpdates.valor = updates.valor;
    if (updates.dataEvento !== undefined) snakeCaseUpdates.data_evento = updates.dataEvento;
    if (updates.motivoEvento !== undefined) snakeCaseUpdates.motivo_evento = updates.motivoEvento;
    if (updates.dataPagamento !== undefined) snakeCaseUpdates.data_pagamento = updates.dataPagamento;
    if (updates.notaFiscalUrl !== undefined) snakeCaseUpdates.nota_fiscal_url = updates.notaFiscalUrl;
    if (updates.boletoUrl !== undefined) snakeCaseUpdates.boleto_url = updates.boletoUrl;
    
    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .update(snakeCaseUpdates)
      .eq('id', id)
      .select('*')
      .single();
    
    if (error) {
      console.error("Erro ao atualizar evento:", error);
      throw new Error(error.message);
    }
    
    // Mapear do formato snake_case para camelCase
    return this.mapFromSupabase([data])[0];
  }

  // Excluir um evento
  static async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from(this.TABLE_NAME)
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error("Erro ao excluir evento:", error);
      throw new Error(error.message);
    }
    
    return true;
  }

  // Filtrar eventos
  static async filtrar(filtro: FiltroEvento): Promise<EventoFinanceiro[]> {
    let query = supabase
      .from(this.TABLE_NAME)
      .select('*');
    
    if (filtro.dataInicio) {
      query = query.gte('data_evento', filtro.dataInicio);
    }
    
    if (filtro.dataFim) {
      // Adicionando 23:59:59 ao final do dia para incluir todo o dia
      const dataFimCompleta = new Date(filtro.dataFim);
      dataFimCompleta.setHours(23, 59, 59, 999);
      query = query.lte('data_evento', dataFimCompleta.toISOString());
    }
    
    if (filtro.fornecedor) {
      query = query.eq('fornecedor', filtro.fornecedor);
    }
    
    if (filtro.placaVeiculo) {
      query = query.eq('placa_veiculo', filtro.placaVeiculo);
    }
    
    if (filtro.motivoEvento) {
      query = query.ilike('motivo_evento', `%${filtro.motivoEvento}%`);
    }
    
    query = query.order('data_evento', { ascending: false });
    
    const { data, error } = await query;
    
    if (error) {
      console.error("Erro ao filtrar eventos:", error);
      throw new Error(error.message);
    }
    
    // Mapear do formato snake_case para camelCase
    return this.mapFromSupabase(data || []);
  }

  // Exportar para CSV
  static async exportarCSV(eventos: EventoFinanceiro[]): Promise<string> {
    const headers = [
      "ID",
      "Fornecedor",
      "Placa do Veículo",
      "Valor",
      "Data do Evento",
      "Motivo do Evento",
      "Data de Pagamento",
    ];
    
    const rows = eventos.map(evento => [
      evento.id,
      evento.fornecedor,
      evento.placaVeiculo,
      evento.valor.toString(),
      new Date(evento.dataEvento).toLocaleDateString("pt-BR"),
      evento.motivoEvento,
      new Date(evento.dataPagamento).toLocaleDateString("pt-BR"),
    ]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");
    
    return csvContent;
  }

  // Obter listas de valores para filtros
  static async getOpcoesParaFiltros() {
    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .select('fornecedor, placa_veiculo, motivo_evento');
    
    if (error) {
      console.error("Erro ao buscar opções para filtros:", error);
      throw new Error(error.message);
    }
    
    const fornecedores = [...new Set(data?.map(e => e.fornecedor) || [])];
    const placasVeiculo = [...new Set(data?.map(e => e.placa_veiculo) || [])];
    const motivosEvento = [...new Set(data?.map(e => e.motivo_evento) || [])];
    
    return {
      fornecedores,
      placasVeiculo,
      motivosEvento,
    };
  }

  // Upload de arquivo para o Storage do Supabase
  static async uploadArquivo(file: File, tipo: 'nfe' | 'boleto', eventoId: string): Promise<string | null> {
    if (!file) return null;
    
    // Formatando o nome do arquivo: tipo_eventoId_timestamp.extensao
    const fileExt = file.name.split('.').pop();
    const fileName = `${tipo}_${eventoId}_${Date.now()}.${fileExt}`;
    const filePath = `${eventoId}/${fileName}`;
    
    // Realizando o upload
    const { data, error } = await supabase
      .storage
      .from(this.STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });
    
    if (error) {
      console.error(`Erro ao fazer upload do ${tipo}:`, error);
      throw new Error(error.message);
    }
    
    // Retornando a URL pública do arquivo
    const { data: { publicUrl } } = supabase
      .storage
      .from(this.STORAGE_BUCKET)
      .getPublicUrl(filePath);
    
    return publicUrl;
  }

  // Função auxiliar para mapear dados do formato snake_case para camelCase
  private static mapFromSupabase(data: any[]): EventoFinanceiro[] {
    return data.map(item => ({
      id: item.id,
      fornecedor: item.fornecedor,
      placaVeiculo: item.placa_veiculo,
      valor: Number(item.valor), // Convertendo para número pois o Postgres retorna como string
      dataEvento: item.data_evento,
      motivoEvento: item.motivo_evento,
      dataPagamento: item.data_pagamento,
      notaFiscalUrl: item.nota_fiscal_url,
      boletoUrl: item.boleto_url,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));
  }
}
