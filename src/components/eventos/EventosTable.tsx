
import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Download, FileText, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { EventoFinanceiro, StatusPagamento } from "@/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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

interface EventosTableProps {
  eventos: EventoFinanceiro[];
  onEdit: (evento: EventoFinanceiro) => void;
  onDelete: (id: string) => void;
}

export function EventosTable({ eventos, onEdit, onDelete }: EventosTableProps) {
  const { toast } = useToast();

  const formataMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  const determinaStatus = (evento: EventoFinanceiro): StatusPagamento => {
    const dataAtual = new Date();
    const dataPagamento = new Date(evento.dataPagamento);
    
    if (dataPagamento < dataAtual && !evento.notaFiscalUrl) {
      return "Atrasado";
    }
    
    if (evento.notaFiscalUrl) {
      return "Pago";
    }
    
    return "Pendente";
  };

  const getBadgeVariant = (status: StatusPagamento) => {
    switch (status) {
      case "Pago":
        return "default" as const;
      case "Pendente":
        return "warning" as const;
      case "Atrasado":
        return "destructive" as const;
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
            <TableHead>Data Pagamento</TableHead>
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
                      {status}
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
