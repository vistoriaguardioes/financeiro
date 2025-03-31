
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { EventoForm } from "@/components/eventos/EventoForm";
import { EventoFinanceiro } from "@/types";
import { EventosService } from "@/services/eventos-service";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";

const EditarEvento = () => {
  const { id } = useParams<{ id: string }>();
  const [evento, setEvento] = useState<EventoFinanceiro | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const carregarEvento = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        const eventoData = await EventosService.getById(id);
        
        if (!eventoData) {
          toast({
            title: "Evento não encontrado",
            description: "O evento solicitado não existe ou foi removido",
            variant: "destructive",
          });
          navigate("/eventos");
          return;
        }
        
        setEvento(eventoData);
      } catch (error) {
        console.error("Erro ao carregar evento:", error);
        
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível buscar o evento financeiro",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    carregarEvento();
  }, [id, navigate, toast]);

  const handleSubmit = async (eventoData: Partial<EventoFinanceiro>) => {
    if (!id) return;
    
    try {
      setIsSaving(true);
      
      const eventoAtualizado = await EventosService.update(id, eventoData);
      
      if (eventoAtualizado) {
        toast({
          title: "Evento atualizado",
          description: "O evento financeiro foi atualizado com sucesso",
        });
        
        // Atualizar o estado
        setEvento(eventoAtualizado);
        
        // Esperar um pouco antes de redirecionar
        setTimeout(() => {
          navigate("/eventos");
        }, 1000);
      } else {
        throw new Error("Não foi possível atualizar o evento");
      }
    } catch (error) {
      console.error("Erro ao atualizar evento:", error);
      
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar o evento financeiro",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
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
        <h1 className="text-2xl font-bold">Editar Evento Financeiro</h1>
        <p className="text-muted-foreground">
          Modifique as informações do evento financeiro ou logístico.
        </p>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center my-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg border animate-fade-in">
          <EventoForm 
            eventoAtual={evento} 
            onSubmit={handleSubmit} 
            isLoading={isSaving} 
          />
        </div>
      )}
    </MainLayout>
  );
};

export default EditarEvento;
