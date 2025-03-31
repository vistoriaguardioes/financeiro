
import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { EventoForm } from "@/components/eventos/EventoForm";
import { EventoFinanceiro } from "@/types";
import { EventosService } from "@/services/eventos-service";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const NovoEvento = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (eventoData: Partial<EventoFinanceiro>) => {
    try {
      setIsLoading(true);
      
      // Remover o ID para garantir que um novo seja gerado
      const { id, ...eventoSemId } = eventoData;
      
      await EventosService.create(eventoSemId as Omit<EventoFinanceiro, "id" | "createdAt" | "updatedAt">);
      
      toast({
        title: "Evento cadastrado",
        description: "O evento financeiro foi registrado com sucesso",
      });
      
      // Redirecionar para a lista de eventos
      navigate("/eventos");
      
    } catch (error) {
      console.error("Erro ao cadastrar evento:", error);
      
      toast({
        title: "Erro ao cadastrar",
        description: "Não foi possível registrar o evento financeiro",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="mb-2"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Voltar
        </Button>
        <h1 className="text-2xl font-bold">Novo Evento Financeiro</h1>
        <p className="text-muted-foreground">
          Preencha o formulário abaixo para registrar um novo evento financeiro ou logístico.
        </p>
      </div>
      
      <div className="bg-white p-6 rounded-lg border animate-fade-in">
        <EventoForm onSubmit={handleSubmit} isLoading={isLoading} />
      </div>
    </MainLayout>
  );
};

export default NovoEvento;
