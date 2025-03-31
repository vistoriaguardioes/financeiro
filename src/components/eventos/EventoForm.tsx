
import { useEffect, useState } from "react";
import { EventoFinanceiro } from "@/types";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Download, FileText, Upload } from "lucide-react";

// Schema de validação do formulário
const eventoSchema = z.object({
  fornecedor: z.string().min(1, "Fornecedor é obrigatório"),
  placaVeiculo: z.string().min(7, "Placa do veículo inválida"),
  valor: z.string().min(1, "Valor é obrigatório"),
  dataEvento: z.date(),
  motivoEvento: z.string().min(1, "Motivo do evento é obrigatório"),
  dataPagamento: z.date(),
});

interface EventoFormProps {
  eventoAtual?: EventoFinanceiro;
  onSubmit: (evento: Partial<EventoFinanceiro>) => void;
  isLoading?: boolean;
}

export function EventoForm({ eventoAtual, onSubmit, isLoading }: EventoFormProps) {
  const { toast } = useToast();
  const [anexoNFe, setAnexoNFe] = useState<File | null>(null);
  const [anexoBoleto, setAnexoBoleto] = useState<File | null>(null);

  const form = useForm<z.infer<typeof eventoSchema>>({
    resolver: zodResolver(eventoSchema),
    defaultValues: {
      fornecedor: "",
      placaVeiculo: "",
      valor: "",
      dataEvento: new Date(),
      motivoEvento: "",
      dataPagamento: new Date(),
    },
  });

  // Atualiza o formulário quando recebe um evento para editar
  useEffect(() => {
    if (eventoAtual) {
      form.reset({
        fornecedor: eventoAtual.fornecedor,
        placaVeiculo: eventoAtual.placaVeiculo,
        valor: eventoAtual.valor.toString(),
        dataEvento: new Date(eventoAtual.dataEvento),
        motivoEvento: eventoAtual.motivoEvento,
        dataPagamento: new Date(eventoAtual.dataPagamento),
      });
    }
  }, [eventoAtual, form]);

  const handleFormSubmit = (data: z.infer<typeof eventoSchema>) => {
    // Prepara os dados para envio
    const eventoData: Partial<EventoFinanceiro> = {
      ...eventoAtual,
      fornecedor: data.fornecedor,
      placaVeiculo: data.placaVeiculo,
      valor: parseFloat(data.valor.replace(",", ".")),
      dataEvento: data.dataEvento.toISOString(),
      motivoEvento: data.motivoEvento,
      dataPagamento: data.dataPagamento.toISOString(),
    };

    // Simula o upload de arquivos
    // Em uma implementação real, aqui seria feito o upload para o Supabase Storage
    if (anexoNFe) {
      toast({
        title: "Upload de NFe",
        description: "Anexando nota fiscal...",
      });
      // eventoData.notaFiscalUrl = "url_simulada_nfe";
    }

    if (anexoBoleto) {
      toast({
        title: "Upload de Boleto",
        description: "Anexando boleto...",
      });
      // eventoData.boletoUrl = "url_simulada_boleto";
    }

    onSubmit(eventoData);
  };

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    tipo: "nfe" | "boleto"
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      if (tipo === "nfe") {
        setAnexoNFe(file);
        toast({
          title: "Nota Fiscal Selecionada",
          description: `${file.name} (${(file.size / 1024).toFixed(2)} KB)`,
        });
      } else {
        setAnexoBoleto(file);
        toast({
          title: "Boleto Selecionado",
          description: `${file.name} (${(file.size / 1024).toFixed(2)} KB)`,
        });
      }
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Fornecedor */}
          <FormField
            control={form.control}
            name="fornecedor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fornecedor</FormLabel>
                <FormControl>
                  <Input placeholder="Nome do fornecedor" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Placa do Veículo */}
          <FormField
            control={form.control}
            name="placaVeiculo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Placa do Veículo</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="ABC1234" 
                    {...field} 
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase();
                      field.onChange(value);
                    }} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Valor */}
          <FormField
            control={form.control}
            name="valor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor (R$)</FormLabel>
                <FormControl>
                  <Input 
                    type="text"
                    placeholder="0,00"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Data do Evento */}
          <FormField
            control={form.control}
            name="dataEvento"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data do Evento</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "dd/MM/yyyy", { locale: ptBR })
                        ) : (
                          <span>Selecione uma data</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Motivo do Evento */}
          <FormField
            control={form.control}
            name="motivoEvento"
            render={({ field }) => (
              <FormItem className="col-span-1 md:col-span-2">
                <FormLabel>Motivo do Evento</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Descreva o motivo do evento"
                    className="min-h-[80px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Data de Pagamento */}
          <FormField
            control={form.control}
            name="dataPagamento"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data de Pagamento</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "dd/MM/yyyy", { locale: ptBR })
                        ) : (
                          <span>Selecione uma data</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Anexos */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Anexos</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nota Fiscal */}
            <div className="space-y-2">
              <FormLabel htmlFor="nfe">Nota Fiscal Eletrônica (NFe)</FormLabel>
              <div className="flex items-center space-x-2">
                <Input
                  id="nfe"
                  type="file"
                  className="hidden"
                  onChange={(e) => handleFileChange(e, "nfe")}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => document.getElementById("nfe")?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {anexoNFe ? "Alterar NFe" : "Anexar NFe"}
                </Button>
                {anexoNFe && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setAnexoNFe(null)}
                  >
                    Remover
                  </Button>
                )}
              </div>
              {anexoNFe && (
                <p className="text-sm text-muted-foreground">
                  {anexoNFe.name} ({(anexoNFe.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>

            {/* Boleto */}
            <div className="space-y-2">
              <FormLabel htmlFor="boleto">Boleto de Pagamento</FormLabel>
              <div className="flex items-center space-x-2">
                <Input
                  id="boleto"
                  type="file"
                  className="hidden"
                  onChange={(e) => handleFileChange(e, "boleto")}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => document.getElementById("boleto")?.click()}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {anexoBoleto ? "Alterar Boleto" : "Anexar Boleto"}
                </Button>
                {anexoBoleto && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setAnexoBoleto(null)}
                  >
                    Remover
                  </Button>
                )}
              </div>
              {anexoBoleto && (
                <p className="text-sm text-muted-foreground">
                  {anexoBoleto.name} ({(anexoBoleto.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Botões */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              form.reset();
              setAnexoNFe(null);
              setAnexoBoleto(null);
            }}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {eventoAtual ? "Atualizar Evento" : "Cadastrar Evento"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
