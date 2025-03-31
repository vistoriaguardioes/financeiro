import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { StatusCard } from "@/components/dashboard/StatusCard";
import { OverviewChart } from "@/components/dashboard/OverviewChart";
import { EventosTable } from "@/components/eventos/EventosTable";
import { EventosService } from "@/services/eventos-service";
import { Button } from "@/components/ui/button";
import { BarChart3, Calendar, FilePlus, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EventoFinanceiro, StatusPagamento } from "@/types";

const Dashboard = () => {
  const [eventos, setEventos] = useState<EventoFinanceiro[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const carregarEventos = async () => {
    try {
      setIsLoading(true);
      const data = await EventosService.getAll();
      setEventos(data);
    } catch (error) {
      console.error("Erro ao carregar eventos:", error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível buscar os eventos financeiros",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    carregarEventos();
  }, []);

  // Cálculos para os cards de resumo
  const totalEventos = eventos.length;
  
  const valorTotal = eventos.reduce((acc, evento) => acc + evento.valor, 0);
  
  const eventosPagos = eventos.filter(
    (evento) => evento.status === "Pago"
  ).length;
  
  const eventosPendentes = eventos.filter(
    (evento) => evento.status === "Pendente"
  ).length;

  const eventosRecentes = eventos.slice(0, 5);

  const handleEdit = (evento: EventoFinanceiro) => {
    window.location.href = `/editar-evento/${evento.id}`;
  };

  const handleDelete = async (id: string) => {
    try {
      const success = await EventosService.delete(id);
      if (success) {
        setEventos((prev) => prev.filter((evento) => evento.id !== id));
        toast({
          title: "Evento excluído",
          description: "O evento foi removido com sucesso",
        });
      }
    } catch (error) {
      console.error("Erro ao excluir evento:", error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o evento",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (id: string, novoStatus: StatusPagamento) => {
    try {
      const eventoAtualizado = await EventosService.updateStatus(id, novoStatus);
      if (eventoAtualizado) {
        setEventos(eventos.map(evento => 
          evento.id === id ? { ...evento, status: novoStatus } : evento
        ));
      }
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
    }
  };

  return (
    <MainLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Link to="/novo-evento">
          <Button>
            <Plus className="mr-1 h-4 w-4" /> Novo Evento
          </Button>
        </Link>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatusCard
          title="Total de Eventos"
          value={totalEventos}
          icon={<Calendar className="h-5 w-5" />}
          description="Eventos financeiros registrados"
        />
        <StatusCard
          title="Valor Total"
          value={new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
          }).format(valorTotal)}
          icon={<BarChart3 className="h-5 w-5" />}
          description="Soma de todos os eventos"
        />
        <StatusCard
          title="Eventos Pagos"
          value={`${eventosPagos} de ${totalEventos}`}
          icon={<BarChart3 className="h-5 w-5" />}
          description="Eventos financeiros pagos"
        />
        <StatusCard
          title="Eventos Pendentes"
          value={`${eventosPendentes} de ${totalEventos}`}
          icon={<BarChart3 className="h-5 w-5" />}
          description="Eventos financeiros pendentes"
        />
      </div>

      {/* Gráfico de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <OverviewChart
          title="Resumo dos Eventos"
          data={eventosRecentes}
        />
      </div>

      {/* Tabela de eventos */}
      <Card className="mb-6">
        <CardHeader>
          <h2 className="text-xl font-semibold">Eventos Recentes</h2>
        </CardHeader>
        <CardContent>
          <EventosTable
            eventos={eventosRecentes}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onStatusChange={handleStatusChange}
          />
          {eventos.length > 5 && (
            <div className="mt-4 text-center">
              <Link to="/eventos">
                <Button variant="outline">Ver todos os eventos</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </MainLayout>
  );
};

export default Dashboard;