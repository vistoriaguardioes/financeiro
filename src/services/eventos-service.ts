
import { EventoFinanceiro, FiltroEvento } from "@/types";
import { v4 as uuidv4 } from "uuid";

// Dados mock para desenvolvimento
const mockEventos: EventoFinanceiro[] = [
  {
    id: uuidv4(),
    fornecedor: "Auto Peças Brasil",
    placaVeiculo: "ABC1234",
    valor: 450.75,
    dataEvento: "2023-11-15T10:30:00Z",
    motivoEvento: "Manutenção preventiva",
    dataPagamento: "2023-11-20T00:00:00Z",
    notaFiscalUrl: "https://example.com/nfe1.pdf",
    boletoUrl: "https://example.com/boleto1.pdf",
    createdAt: "2023-11-15T10:30:00Z",
    updatedAt: "2023-11-15T10:30:00Z",
  },
  {
    id: uuidv4(),
    fornecedor: "Distribuidora de Combustíveis SA",
    placaVeiculo: "DEF5678",
    valor: 1250.00,
    dataEvento: "2023-11-16T08:45:00Z",
    motivoEvento: "Abastecimento",
    dataPagamento: "2023-11-25T00:00:00Z",
    notaFiscalUrl: undefined,
    boletoUrl: "https://example.com/boleto2.pdf",
    createdAt: "2023-11-16T08:45:00Z",
    updatedAt: "2023-11-16T08:45:00Z",
  },
  {
    id: uuidv4(),
    fornecedor: "Pneus & Cia",
    placaVeiculo: "GHI9012",
    valor: 2100.50,
    dataEvento: "2023-11-17T14:20:00Z",
    motivoEvento: "Troca de pneus",
    dataPagamento: "2023-11-30T00:00:00Z",
    notaFiscalUrl: "https://example.com/nfe3.pdf",
    boletoUrl: undefined,
    createdAt: "2023-11-17T14:20:00Z",
    updatedAt: "2023-11-17T14:20:00Z",
  },
  {
    id: uuidv4(),
    fornecedor: "Seguradora Nacional",
    placaVeiculo: "JKL3456",
    valor: 3500.00,
    dataEvento: "2023-12-01T09:00:00Z",
    motivoEvento: "Renovação de seguro",
    dataPagamento: "2023-12-10T00:00:00Z",
    notaFiscalUrl: "https://example.com/nfe4.pdf",
    boletoUrl: "https://example.com/boleto4.pdf",
    createdAt: "2023-12-01T09:00:00Z",
    updatedAt: "2023-12-01T09:00:00Z",
  },
  {
    id: uuidv4(),
    fornecedor: "Oficina Mecânica Express",
    placaVeiculo: "MNO7890",
    valor: 780.25,
    dataEvento: "2023-12-05T11:15:00Z",
    motivoEvento: "Reparo no sistema de freios",
    dataPagamento: "2023-12-15T00:00:00Z",
    notaFiscalUrl: undefined,
    boletoUrl: undefined,
    createdAt: "2023-12-05T11:15:00Z",
    updatedAt: "2023-12-05T11:15:00Z",
  },
];

// Armazenar eventos em memória (simulando um banco de dados)
let eventosDb = [...mockEventos];

// Classe para gerenciar operações com eventos financeiros
export class EventosService {
  // Obter todos os eventos
  static async getAll(): Promise<EventoFinanceiro[]> {
    // Simular um delay de rede
    await new Promise(resolve => setTimeout(resolve, 500));
    return [...eventosDb].sort((a, b) => 
      new Date(b.dataEvento).getTime() - new Date(a.dataEvento).getTime()
    );
  }

  // Obter um evento por ID
  static async getById(id: string): Promise<EventoFinanceiro | undefined> {
    // Simular um delay de rede
    await new Promise(resolve => setTimeout(resolve, 300));
    return eventosDb.find(evento => evento.id === id);
  }

  // Criar um novo evento
  static async create(evento: Omit<EventoFinanceiro, "id" | "createdAt" | "updatedAt">): Promise<EventoFinanceiro> {
    // Simular um delay de rede
    await new Promise(resolve => setTimeout(resolve, 700));
    
    const now = new Date().toISOString();
    const novoEvento: EventoFinanceiro = {
      id: uuidv4(),
      ...evento,
      createdAt: now,
      updatedAt: now,
    };
    
    eventosDb.push(novoEvento);
    return novoEvento;
  }

  // Atualizar um evento existente
  static async update(id: string, updates: Partial<EventoFinanceiro>): Promise<EventoFinanceiro | undefined> {
    // Simular um delay de rede
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const index = eventosDb.findIndex(evento => evento.id === id);
    if (index === -1) return undefined;
    
    const updatedEvento = {
      ...eventosDb[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    eventosDb[index] = updatedEvento;
    return updatedEvento;
  }

  // Excluir um evento
  static async delete(id: string): Promise<boolean> {
    // Simular um delay de rede
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const initialLength = eventosDb.length;
    eventosDb = eventosDb.filter(evento => evento.id !== id);
    
    return eventosDb.length < initialLength;
  }

  // Filtrar eventos
  static async filtrar(filtro: FiltroEvento): Promise<EventoFinanceiro[]> {
    // Simular um delay de rede
    await new Promise(resolve => setTimeout(resolve, 500));
    
    let resultado = [...eventosDb];
    
    if (filtro.dataInicio) {
      const dataInicio = new Date(filtro.dataInicio);
      resultado = resultado.filter(evento => new Date(evento.dataEvento) >= dataInicio);
    }
    
    if (filtro.dataFim) {
      const dataFim = new Date(filtro.dataFim);
      dataFim.setHours(23, 59, 59, 999); // Fim do dia
      resultado = resultado.filter(evento => new Date(evento.dataEvento) <= dataFim);
    }
    
    if (filtro.fornecedor) {
      resultado = resultado.filter(evento => evento.fornecedor === filtro.fornecedor);
    }
    
    if (filtro.placaVeiculo) {
      resultado = resultado.filter(evento => evento.placaVeiculo === filtro.placaVeiculo);
    }
    
    if (filtro.motivoEvento) {
      resultado = resultado.filter(evento => evento.motivoEvento.includes(filtro.motivoEvento || ""));
    }
    
    return resultado.sort((a, b) => 
      new Date(b.dataEvento).getTime() - new Date(a.dataEvento).getTime()
    );
  }

  // Exportar para CSV
  static async exportarCSV(eventos: EventoFinanceiro[]): Promise<string> {
    // Simular um delay de rede
    await new Promise(resolve => setTimeout(resolve, 800));
    
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
    // Simular um delay de rede
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const fornecedores = [...new Set(eventosDb.map(e => e.fornecedor))];
    const placasVeiculo = [...new Set(eventosDb.map(e => e.placaVeiculo))];
    const motivosEvento = [...new Set(eventosDb.map(e => e.motivoEvento))];
    
    return {
      fornecedores,
      placasVeiculo,
      motivosEvento,
    };
  }
}
