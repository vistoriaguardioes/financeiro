import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Check, Download, FileText, MoreVertical, Pencil, Trash2, ArrowUpDown, Upload } from "lucide-react";
import { EventoFinanceiro, StatusPagamento } from "@/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuSub,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { EventosService } from "@/services/eventos-service";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Input,
} from "@/components/ui/input";
import {
  Loader2,
} from "lucide-react";
import { supabase } from '../../integrations/supabase/client';

interface EventosTableProps {
  eventos: EventoFinanceiro[];
  onEdit: (evento: EventoFinanceiro) => void;
  onDelete: (id: string) => void;
  onStatusChange?: (id: string, novoStatus: StatusPagamento) => void;
  onSort?: (field: string, direction: 'asc' | 'desc') => void;
  onEventoUpdated?: (evento: EventoFinanceiro) => void;
}

export function EventosTable({ 
  eventos, 
  onEdit, 
  onDelete, 
  onStatusChange,
  onSort,
  onEventoUpdated
}: EventosTableProps) {
  const { toast } = useToast();
  const [atualizandoStatus, setAtualizandoStatus] = useState<string | null>(null);
  const [isSorted, setIsSorted] = useState(false);
  const [uploadingComprovanteId, setUploadingComprovanteId] = useState<string | null>(null);
  const [comprovanteFile, setComprovanteFile] = useState<File | null>(null);
  const [dataPagamentoComprovante, setDataPagamentoComprovante] = useState<string>('');

  const handleSort = () => {
    setIsSorted(!isSorted);
    if (onSort) {
      onSort('dataPagamento', isSorted ? 'desc' : 'desc');
    }
  };

  const formataMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  const determinaStatus = (evento: EventoFinanceiro): StatusPagamento => {
    // Se o status está explicitamente definido, usamos ele
    if (evento.status) {
      return evento.status;
    }
    
    // Caso contrário, determinamos com base na nota fiscal
    return evento.notaFiscalUrl ? "Pago" : "Pendente";
  };

  const getBadgeVariant = (status: StatusPagamento) => {
    switch (status) {
      case "Pago":
        return "default" as const;
      case "Pendente":
        return "secondary" as const;
      case "Cancelado":
        return "outline" as const;
      default:
        return "secondary" as const;
    }
  };

  const handleDownload = (url: string | undefined, tipo: string) => {
    if (!url) {
      toast({
        title: "Documento não disponível",
        description: `O ${tipo} não foi anexado a este evento.`,
        variant: "destructive",
      });
      return;
    }
    
    // Abrir a URL em uma nova aba
    window.open(url, '_blank');
    
    toast({
      title: "Download iniciado",
      description: `O ${tipo} foi aberto em uma nova aba.`,
    });
  };

  const handleStatusChange = async (eventoId: string, novoStatus: StatusPagamento) => {
    try {
      setAtualizandoStatus(eventoId);
      
      // Atualizar o status no banco de dados
      const eventoAtualizado = await EventosService.updateStatus(eventoId, novoStatus);
      
      if (!eventoAtualizado) {
        throw new Error('Evento não encontrado após atualização');
      }
      
      // Atualizar o evento na lista local
      const eventosAtualizados = eventos.map(evento => 
        evento.id === eventoId 
          ? { ...evento, status: novoStatus }
          : evento
      );
      
      // Notificar o componente pai para atualizar a lista
      if (onStatusChange) {
        onStatusChange(eventoId, novoStatus);
      }
      
      toast({
        title: "Status atualizado",
        description: `O status do evento foi alterado para ${novoStatus}`,
      });
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast({
        title: "Erro ao atualizar status",
        description: error instanceof Error ? error.message : "Não foi possível atualizar o status do evento",
        variant: "destructive",
      });
    } finally {
      setAtualizandoStatus(null);
    }
  };

  const handleComprovanteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setComprovanteFile(files[0]);
  };

  const handleAdicionarComprovante = async (eventoId: string) => {
    if (!comprovanteFile || !dataPagamentoComprovante) {
      toast({
        title: "Erro",
        description: "Selecione um arquivo e uma data de pagamento",
        variant: "destructive",
      });
      return;
    }
    try {
      setUploadingComprovanteId(eventoId);
      const fileName = `${Date.now()}-${comprovanteFile.name}`;
      const filePath = `comprovantes/${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from('documentos')
        .upload(filePath, comprovanteFile, {
          cacheControl: '3600',
          upsert: false,
          contentType: comprovanteFile.type || 'application/pdf'
        });
      if (uploadError) {
        toast({
          title: "Erro",
          description: `Não foi possível fazer o upload do comprovante: ${uploadError.message}`,
          variant: "destructive",
        });
        return;
      }
      const { data: { publicUrl } } = supabase.storage
        .from('documentos')
        .getPublicUrl(filePath);
      // Atualizar o evento no banco (adicionando comprovante)
      const { error: updateError } = await supabase
        .from('eventos_financeiros')
        .update({
          comprovantes: [{ nome: comprovanteFile.name, url: publicUrl, dataPagamento: dataPagamentoComprovante }]
        })
        .eq('id', eventoId);
      if (updateError) {
        toast({
          title: "Erro",
          description: "Não foi possível adicionar o comprovante ao evento",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Sucesso",
        description: "Comprovante adicionado com sucesso",
      });
      setComprovanteFile(null);
      setDataPagamentoComprovante('');
      setUploadingComprovanteId(null);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao processar o comprovante",
        variant: "destructive",
      });
    } finally {
      setUploadingComprovanteId(null);
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader className="guardioes-table-header">
          <TableRow>
            <TableHead className="w-[100px]">ID</TableHead>
            <TableHead>Fornecedor</TableHead>
            <TableHead>Placa</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Data Evento</TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSort}
                className="flex items-center gap-1 hover:bg-accent"
              >
                Data Pagamento
                <ArrowUpDown className="h-4 w-4" />
                {isSorted && (
                  <span className="text-xs">
                    ↓
                  </span>
                )}
              </Button>
            </TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Documentos</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {eventos.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="h-24 text-center">
                Nenhum evento financeiro encontrado.
              </TableCell>
            </TableRow>
          ) : (
            eventos.map((evento) => {
              const status = determinaStatus(evento);
              const isUpdating = atualizandoStatus === evento.id;
              
              return (
                <TableRow key={evento.id}>
                  <TableCell className="guardioes-table-cell font-medium">
                    {evento.id.substring(0, 8)}
                  </TableCell>
                  <TableCell className="guardioes-table-cell">
                    {evento.fornecedor}
                  </TableCell>
                  <TableCell className="guardioes-table-cell">
                    {evento.placaVeiculo}
                  </TableCell>
                  <TableCell className="guardioes-table-cell">
                    {formataMoeda(evento.valor)}
                  </TableCell>
                  <TableCell className="guardioes-table-cell">
                    {format(new Date(evento.dataEvento), "dd/MM/yyyy", {
                      locale: ptBR,
                    })}
                  </TableCell>
                  <TableCell className="guardioes-table-cell">
                    {format(new Date(evento.dataPagamento), "dd/MM/yyyy", {
                      locale: ptBR,
                    })}
                  </TableCell>
                  <TableCell className="guardioes-table-cell">
                    <Badge variant={getBadgeVariant(status)}>
                      {isUpdating ? "Atualizando..." : status}
                    </Badge>
                  </TableCell>
                  <TableCell className="guardioes-table-cell">
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(evento.notaFiscalUrl, "NFe")}
                        title="Nota Fiscal"
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        NFe
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(evento.boletoUrl, "Boleto")}
                        title="Boleto"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Boleto
                      </Button>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Upload className="h-4 w-4 mr-1" />
                            CP
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                          <div className="space-y-2">
                            <Input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={handleComprovanteChange}
                              className="cursor-pointer"
                            />
                            <Input
                              type="date"
                              value={dataPagamentoComprovante}
                              onChange={e => setDataPagamentoComprovante(e.target.value)}
                              className="w-full"
                            />
                            <Button
                              onClick={() => handleAdicionarComprovante(evento.id)}
                              disabled={!comprovanteFile || !dataPagamentoComprovante || uploadingComprovanteId === evento.id}
                              className="w-full"
                            >
                              {uploadingComprovanteId === evento.id ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Enviando...
                                </>
                              ) : (
                                "Adicionar Comprovante"
                              )}
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </TableCell>
                  <TableCell className="guardioes-table-cell text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">Abrir menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(evento)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        
                        <DropdownMenuSeparator />
                        
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>
                            <Check className="mr-2 h-4 w-4" />
                            Alterar Status
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                            <DropdownMenuItem 
                              onClick={() => handleStatusChange(evento.id, "Pendente")}
                              disabled={status === "Pendente" || isUpdating}
                            >
                              <Badge variant="secondary" className="mr-2">Pendente</Badge>
                              Marcar como Pendente
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleStatusChange(evento.id, "Pago")}
                              disabled={status === "Pago" || isUpdating}
                            >
                              <Badge variant="default" className="mr-2">Pago</Badge>
                              Marcar como Pago
                            </DropdownMenuItem>
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                        
                        <DropdownMenuSeparator />
                        
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => onDelete(evento.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
