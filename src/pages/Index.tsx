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
import { PieChart, Pie, Cell, Legend, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = ['#22c55e', '#fbbf24', '#3b82f6', '#ef4444', '#a855f7', '#f472b6', '#14b8a6', '#f59e42'];

const Dashboard = () => {
  const [eventos, setEventos] = useState<EventoFinanceiro[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSorted, setIsSorted] = useState(false);
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
  const valorTotalPago = eventos.filter(e => e.status === 'Pago').reduce((acc, evento) => acc + evento.valor, 0);
  const valorTotalPendente = eventos.filter(e => e.status === 'Pendente').reduce((acc, evento) => acc + evento.valor, 0);
  const eventosPagos = eventos.filter((evento) => evento.status === "Pago").length;
  const eventosPendentes = eventos.filter((evento) => evento.status === "Pendente").length;
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

  const handleSort = (field: string, direction: 'desc') => {
    setIsSorted(!isSorted);
    
    if (!isSorted) {
      // Ordena do mais recente para o mais antigo
      const eventosOrdenados = [...eventos].sort((a, b) => {
        if (field === 'dataPagamento') {
          const dateA = new Date(a.dataPagamento).getTime();
          const dateB = new Date(b.dataPagamento).getTime();
          return dateB - dateA;
        }
        return 0;
      });
      setEventos(eventosOrdenados);
    } else {
      // Volta para a ordem original
      carregarEventos();
    }
  };

  // Agrupa valores por fornecedor
  const fornecedoresMap: { [fornecedor: string]: number } = {};
  eventos.forEach(evento => {
    if (!fornecedoresMap[evento.fornecedor]) {
      fornecedoresMap[evento.fornecedor] = 0;
    }
    fornecedoresMap[evento.fornecedor] += evento.valor;
  });
  const pieDataFornecedor = Object.entries(fornecedoresMap).map(([name, value]) => ({
    name,
    value
  }));

  return (
    <MainLayout>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Dashboard</h1>
        <Link to="/novo-evento">
          <Button className="rounded-full px-6 py-2 bg-gradient-to-r from-blue-500 to-green-400 text-white shadow-lg hover:from-blue-600 hover:to-green-500 transition-all">
            <Plus className="mr-2 h-5 w-5" /> Novo Evento
          </Button>
        </Link>
      </div>

      {/* Cards de valores pagos e pendentes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center justify-center">
          <span className="text-lg font-semibold text-gray-500 mb-2">Valor Pago</span>
          <span className="text-3xl font-bold text-green-500 mb-1">
            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valorTotalPago)}
          </span>
          <span className="text-xs text-gray-400">Soma dos eventos pagos</span>
        </div>
        <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center justify-center">
          <span className="text-lg font-semibold text-gray-500 mb-2">Valor Pendente</span>
          <span className="text-3xl font-bold text-yellow-500 mb-1">
            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valorTotalPendente)}
          </span>
          <span className="text-xs text-gray-400">Soma dos eventos pendentes</span>
        </div>
      </div>

      {/* Gráfico de pizza por fornecedor */}
      <div className="flex justify-center mb-10">
        <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-bold mb-6 text-center text-gray-700">Distribuição por Fornecedor</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieDataFornecedor}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
              >
                {pieDataFornecedor.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name, props) => [
                  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value as number),
                  props.payload.name
                ]}
              />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabela de eventos */}
      <Card className="mb-6 bg-white rounded-2xl shadow-xl">
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-700">Eventos Recentes</h2>
        </CardHeader>
        <CardContent>
          <EventosTable
            eventos={eventosRecentes}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onStatusChange={handleStatusChange}
            onSort={handleSort}
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