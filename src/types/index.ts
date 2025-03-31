
// Definindo os tipos para a aplicação

export interface EventoFinanceiro {
  id: string;
  fornecedor: string;
  placaVeiculo: string;
  valor: number;
  dataEvento: string;
  motivoEvento: string;
  dataPagamento: string;
  notaFiscalUrl?: string;
  boletoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FiltroEvento {
  dataInicio?: string;
  dataFim?: string;
  fornecedor?: string;
  placaVeiculo?: string;
  motivoEvento?: string;
}

export type StatusPagamento = 'Pendente' | 'Pago' | 'Atrasado' | 'Cancelado';

export interface ResumoFinanceiro {
  totalEventos: number;
  valorTotal: number;
  eventosPagos: number;
  eventosPendentes: number;
  eventosAtrasados: number;
}

export interface OpcaoSelect {
  label: string;
  value: string;
}

export type OrientacaoExportacao = 'retrato' | 'paisagem';

export interface ConfiguracaoRelatorio {
  titulo: string;
  dataInicio: string;
  dataFim: string;
  incluirAnexos: boolean;
  orientacao: OrientacaoExportacao;
}
