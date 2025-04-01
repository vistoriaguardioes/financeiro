import { EventoFinanceiro, FiltroEvento, StatusPagamento } from "@/types";
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
      .maybeSingle();
    
    if (error) {
      console.error("Erro ao buscar evento por ID:", error);
      throw new Error(error.message);
    }
    
    if (!data) return undefined;
    
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
      boleto_url: evento.boletoUrl,
      status: evento.status || 'Pendente'
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
    if (updates.status !== undefined) snakeCaseUpdates.status = updates.status;
    
    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .update(snakeCaseUpdates)
      .eq('id', id)
      .select('*')
      .maybeSingle();
    
    if (error) {
      console.error("Erro ao atualizar evento:", error);
      throw new Error(error.message);
    }
    
    if (!data) return undefined;
    
    // Mapear do formato snake_case para camelCase
    return this.mapFromSupabase([data])[0];
  }

  // Atualizar apenas o status de um evento
  static async updateStatus(id: string, status: StatusPagamento): Promise<EventoFinanceiro | undefined> {
    return this.update(id, { status });
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

  // Exportar eventos para CSV
  static async exportarCSV(eventos: EventoFinanceiro[]): Promise<string> {
    // Definir cabeçalhos CSV
    const headers = [
      'ID',
      'Fornecedor',
      'Placa',
      'Valor',
      'Data do Evento',
      'Motivo',
      'Data Pagamento',
      'Status',
    ].join(',');
    
    // Formatar os dados de cada evento
    const formatarEvento = (evento: EventoFinanceiro) => {
      const dataEvento = new Date(evento.dataEvento).toLocaleDateString('pt-BR');
      const dataPagamento = new Date(evento.dataPagamento).toLocaleDateString('pt-BR');
      const valor = evento.valor.toString().replace('.', ',');
      const status = evento.status || (evento.notaFiscalUrl ? 'Pago' : 'Pendente');
      
      return [
        evento.id,
        `"${evento.fornecedor}"`,
        evento.placaVeiculo,
        valor,
        dataEvento,
        `"${evento.motivoEvento}"`,
        dataPagamento,
        status,
      ].join(',');
    };
    
    // Construir o conteúdo CSV
    const rows = eventos.map(formatarEvento);
    return [headers, ...rows].join('\n');
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
    
    const fornecedores = [...new Set((data || []).map(e => e.fornecedor))];
    const placasVeiculo = [...new Set((data || []).map(e => e.placa_veiculo))];
    const motivosEvento = [...new Set((data || []).map(e => e.motivo_evento))];
    
    return {
      fornecedores,
      placasVeiculo,
      motivosEvento,
    };
  }

  // Upload de arquivo para o Storage do Supabase
  static async uploadArquivo(file: File, tipo: 'nfe' | 'boleto', eventoId: string): Promise<string | null> {
    if (!file) return null;
    
    // Se não temos o ID do evento, geramos um temporário
    const idParaArquivo = eventoId || uuidv4();
    
    // Formatando o nome do arquivo: tipo_eventoId_timestamp.extensao
    const fileExt = file.name.split('.').pop();
    const fileName = `${tipo}_${idParaArquivo}_${Date.now()}.${fileExt}`;
    const filePath = `${idParaArquivo}/${fileName}`;
    
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
      status: item.status as StatusPagamento || undefined,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));
  }

  // Buscar eventos por placa
  static async buscarPorPlaca(placa: string): Promise<EventoFinanceiro[]> {
    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .select('*')
      .eq('placa_veiculo', placa.toUpperCase())
      .order('data_evento', { ascending: false });
    
    if (error) {
      console.error("Erro ao buscar eventos por placa:", error);
      throw new Error(error.message);
    }
    
    return this.mapFromSupabase(data || []);
  }
}
