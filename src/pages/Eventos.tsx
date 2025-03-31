
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { EventosTable } from "@/components/eventos/EventosTable";
import { EventosFiltro } from "@/components/eventos/EventosFiltro";
import { EventoFinanceiro, FiltroEvento } from "@/types";
import { EventosService } from "@/services/eventos-service";
import { useToast } from "@/hooks/use-toast";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Download, FileDown, Loader2, Plus } from "lucide-react";

const Eventos = () => {
  const [eventos, setEventos] = useState<EventoFinanceiro[]>([]);
  const [eventosFiltrados, setEventosFiltrados] = useState<EventoFinanceiro[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [eventoParaExcluir, setEventoParaExcluir] = useState<string | null>(null);
  const [exportandoCSV, setExportandoCSV] = useState(false);
  const [opcoesFiltro, setOpcoesFiltro] = useState({
    fornecedores: [] as string[],
    placasVeiculo: [] as string[],
    motivosEvento: [] as string[],
  });
  
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const carregarDados = async () => {
      try {
        setIsLoading(true);
        const [eventosData, opcoesFiltroData] = await Promise.all([
          EventosService.getAll(),
          EventosService.getOpcoesParaFiltros()
        ]);
        
        setEventos(eventosData);
        setEventosFiltrados(eventosData);
        setOpcoesFiltro(opcoesFiltroData);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível buscar os eventos financeiros",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    carregarDados();
  }, [toast]);

  const handleFiltrar = async (filtro: FiltroEvento) => {
    try {
      setIsLoading(true);
      const resultadoFiltrado = await EventosService.filtrar(filtro);
      setEventosFiltrados(resultadoFiltrado);
    } catch (error) {
      console.error("Erro ao filtrar eventos:", error);
      toast({
        title: "Erro ao aplicar filtros",
        description: "Não foi possível filtrar os eventos",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (evento: EventoFinanceiro) => {
    navigate(`/editar-evento/${evento.id}`);
  };

  const handleDelete = (id: string) => {
    setEventoParaExcluir(id);
    setOpenDeleteDialog(true);
  };

  const confirmarExclusao = async () => {
    if (!eventoParaExcluir) return;
    
    try {
      const success = await EventosService.delete(eventoParaExcluir);
      
      if (success) {
        setEventos((prev) => prev.filter((e) => e.id !== eventoParaExcluir));
        setEventosFiltrados((prev) => prev.filter((e) => e.id !== eventoParaExcluir));
        
        toast({
          title: "Evento excluído",
          description: "O evento foi removido com sucesso",
        });
      } else {
        throw new Error("Falha ao excluir o evento");
      }
    } catch (error) {
      console.error("Erro ao excluir evento:", error);
      
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o evento",
        variant: "destructive",
      });
    } finally {
      setOpenDeleteDialog(false);
      setEventoParaExcluir(null);
    }
  };

  const exportarCSV = async () => {
    try {
      setExportandoCSV(true);
      const csvContent = await EventosService.exportarCSV(eventosFiltrados);
      
      // Criar um Blob e link para download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      // Nome do arquivo com data atual
      const dataAtual = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
      link.download = `eventos-financeiros-${dataAtual}.csv`;
      
      link.href = url;
      link.click();
      
      toast({
        title: "Exportação concluída",
        description: "Os dados foram exportados com sucesso",
      });
    } catch (error) {
      console.error("Erro ao exportar para CSV:", error);
      
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar os dados",
        variant: "destructive",
      });
    } finally {
      setExportandoCSV(false);
    }
  };

  return (
    <MainLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Eventos Financeiros</h1>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={exportarCSV}
            disabled={eventosFiltrados.length === 0 || exportandoCSV}
          >
            {exportandoCSV ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="mr-2 h-4 w-4" />
            )}
            Exportar CSV
          </Button>
          
          <Link to="/novo-evento">
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Novo Evento
            </Button>
          </Link>
        </div>
      </div>

      <EventosFiltro
        onFilter={handleFiltrar}
        fornecedores={opcoesFiltro.fornecedores}
        placasVeiculo={opcoesFiltro.placasVeiculo}
        motivosEvento={opcoesFiltro.motivosEvento}
      />

      {isLoading ? (
        <div className="flex justify-center my-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <EventosTable
          eventos={eventosFiltrados}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}
      
      <AlertDialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este evento financeiro?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarExclusao} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
};

export default Eventos;
