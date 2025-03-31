
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ResponsiveContainer, 
  BarChart, 
  CartesianGrid, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend,
  Bar,
  LineChart,
  Line
} from "recharts";
import { ptBR } from "date-fns/locale";
import { format, parseISO } from "date-fns";
import { EventoFinanceiro } from "@/types";

interface OverviewChartProps {
  data: EventoFinanceiro[];
  type?: "bar" | "line";
  title?: string;
  className?: string;
}

export function OverviewChart({
  data,
  type = "bar",
  title = "Visão Geral",
  className,
}: OverviewChartProps) {
  // Formatar os dados para o gráfico
  const chartData = useMemo(() => {
    // Agrupar eventos por data
    const groupedByDate = data.reduce<Record<string, { total: number, count: number }>>(
      (acc, evento) => {
        // Usar apenas a data (sem a hora)
        const date = format(new Date(evento.dataEvento), "yyyy-MM-dd");
        
        if (!acc[date]) {
          acc[date] = { total: 0, count: 0 };
        }
        
        acc[date].total += evento.valor;
        acc[date].count += 1;
        
        return acc;
      },
      {}
    );

    // Converter para o formato do gráfico
    return Object.entries(groupedByDate)
      .map(([date, { total, count }]) => ({
        date,
        valor: parseFloat(total.toFixed(2)),
        quantidade: count,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [data]);

  // Formatar valores no tooltip
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Componente de tooltip customizado
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-md shadow border">
          <p className="font-medium">{format(parseISO(label), "dd/MM/yyyy", { locale: ptBR })}</p>
          <p className="text-guardioes-blue">
            Valor: {formatCurrency(payload[0].value)}
          </p>
          <p className="text-guardioes-green">
            Quantidade: {payload[1].value}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <ResponsiveContainer width="100%" height={350}>
          {type === "bar" ? (
            <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => format(parseISO(value), "dd/MM", { locale: ptBR })}
              />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="valor" name="Valor (R$)" fill="#0F3460" />
              <Bar dataKey="quantidade" name="Quantidade" fill="#16C79A" />
            </BarChart>
          ) : (
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => format(parseISO(value), "dd/MM", { locale: ptBR })}
              />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line type="monotone" dataKey="valor" name="Valor (R$)" stroke="#0F3460" strokeWidth={2} />
              <Line type="monotone" dataKey="quantidade" name="Quantidade" stroke="#16C79A" strokeWidth={2} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
