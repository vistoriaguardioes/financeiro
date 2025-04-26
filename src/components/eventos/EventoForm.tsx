import { useEffect, useState } from "react";
import { EventoFinanceiro, StatusPagamento, ArquivoBoleto, ComprovantePagamento } from "@/types";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { CalendarIcon, Download, FileText, Loader2, Upload, Trash2 } from "lucide-react";
import { EventosService } from "@/services/eventos-service";
import { Badge } from "@/components/ui/badge";
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../integrations/supabase/client';
import { Label } from "@/components/ui/label";

const eventoSchema = z.object({
  fornecedor: z.string().min(1, "Fornecedor é obrigatório"),
  placaVeiculo: z.string().min(7, "Placa do veículo inválida"),
  valor: z.string().min(1, "Valor é obrigatório"),
  dataEvento: z.date(),
  motivoEvento: z.string().min(1, "Motivo do evento é obrigatório"),
  dataPagamento: z.date(),
  status: z.enum(["Pendente", "Pago"] as const),
  boletos: z.array(z.object({
    nome: z.string(),
    url: z.string(),
    dataVencimento: z.string()
  })).optional(),
  comprovantes: z.array(z.object({
    nome: z.string(),
    url: z.string(),
    dataPagamento: z.string()
  })).optional(),
});

interface EventoFormProps {
  eventoAtual?: EventoFinanceiro;
  onSubmit: (evento: Partial<EventoFinanceiro>) => void;
  isLoading?: boolean;
}

export function EventoForm({ eventoAtual, onSubmit, isLoading }: EventoFormProps) {
  const { toast } = useToast();
  const [anexoNFe, setAnexoNFe] = useState<File | null>(null);
  const [anexosBoleto, setAnexosBoleto] = useState<File[]>([]);
  const [uploadingNFe, setUploadingNFe] = useState(false);
  const [uploadingBoleto, setUploadingBoleto] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [eventosPorPlaca, setEventosPorPlaca] = useState<EventoFinanceiro[]>([]);
  const [carregandoHistorico, setCarregandoHistorico] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();
  const [boletos, setBoletos] = useState<ArquivoBoleto[]>([]);
  const [boletoTemporario, setBoletoTemporario] = useState<{
    file: File | null;
    dataVencimento: string;
  }>({
    file: null,
    dataVencimento: ''
  });
  const [comprovantes, setComprovantes] = useState<ComprovantePagamento[]>([]);
  const [comprovanteTemporario, setComprovanteTemporario] = useState<{
    file: File | null;
    dataPagamento: string;
  }>({
    file: null,
    dataPagamento: ''
  });

  const form = useForm<z.infer<typeof eventoSchema>>({
    resolver: zodResolver(eventoSchema),
    defaultValues: {
      fornecedor: "",
      placaVeiculo: "",
      valor: "",
      dataEvento: new Date(),
      motivoEvento: "",
      dataPagamento: new Date(),
      status: "Pendente",
      boletos: [],
      comprovantes: [],
    },
  });

  useEffect(() => {
    if (eventoAtual) {
      form.reset({
        fornecedor: eventoAtual.fornecedor,
        placaVeiculo: eventoAtual.placaVeiculo,
        valor: eventoAtual.valor.toString(),
        dataEvento: new Date(eventoAtual.dataEvento),
        motivoEvento: eventoAtual.motivoEvento,
        dataPagamento: new Date(eventoAtual.dataPagamento),
        status: eventoAtual.status as "Pendente" | "Pago" || "Pendente",
        boletos: eventoAtual.boletos || [],
        comprovantes: eventoAtual.comprovantes || [],
      });
    }
  }, [eventoAtual, form]);

  useEffect(() => {
    if (id) {
      carregarEvento();
    }
  }, [id]);

  const carregarEvento = async () => {
    try {
      const eventos = await EventosService.listarEventos();
      const eventoEncontrado = eventos.find(e => e.id === id);
      if (eventoEncontrado) {
        form.reset(eventoEncontrado);
      }
    } catch (error) {
      console.error('Erro ao carregar evento:', error);
    }
  };

  const handleFormSubmit = async (data: z.infer<typeof eventoSchema>) => {
    if (submitting || isLoading) return;
    
    try {
      setSubmitting(true);
      
      const eventoData: Partial<EventoFinanceiro> = {
        ...eventoAtual,
        fornecedor: data.fornecedor,
        placaVeiculo: data.placaVeiculo.toUpperCase(),
        valor: parseFloat(data.valor.replace(",", ".")),
        dataEvento: data.dataEvento.toISOString(),
        motivoEvento: data.motivoEvento,
        dataPagamento: data.dataPagamento.toISOString(),
        status: data.status,
        boletoUrls: data.boletos?.map(b => b.url) || [],
        comprovanteUrls: data.comprovantes?.map(c => c.url) || [],
      };
      
      if (eventoAtual?.id) {
        eventoData.id = eventoAtual.id;
      }

      if (anexoNFe) {
        setUploadingNFe(true);
        try {
          const nfeUrl = await EventosService.uploadArquivo(anexoNFe, 'nfe', eventoAtual?.id || '');
          if (nfeUrl) {
            eventoData.notaFiscalUrl = nfeUrl;
            toast({
              title: "Nota fiscal enviada",
              description: "O arquivo foi anexado com sucesso",
            });
          }
        } catch (error) {
          console.error("Erro ao fazer upload da NFe:", error);
          toast({
            title: "Erro ao enviar NFe",
            description: "Não foi possível anexar a nota fiscal",
            variant: "destructive",
          });
        } finally {
          setUploadingNFe(false);
        }
      }

      if (anexosBoleto.length > 0) {
        setUploadingBoleto(true);
        try {
          const boletoUrls = await Promise.all(
            anexosBoleto.map(file => 
              EventosService.uploadArquivo(file, 'boleto', eventoAtual?.id || '')
            )
          );
          
          if (boletoUrls.length > 0) {
            eventoData.boletoUrl = boletoUrls[0]; // Mantém o primeiro boleto como principal
            eventoData.boletoUrls = boletoUrls; // Armazena todos os URLs dos boletos
            toast({
              title: "Boletos enviados",
              description: `${boletoUrls.length} boleto(s) anexado(s) com sucesso`,
            });
          }
        } catch (error) {
          console.error("Erro ao fazer upload dos boletos:", error);
          toast({
            title: "Erro ao enviar boletos",
            description: "Não foi possível anexar os boletos",
            variant: "destructive",
          });
        } finally {
          setUploadingBoleto(false);
        }
      }

      if (comprovantes.length > 0) {
        setUploadingBoleto(true);
        try {
          const comprovanteUrls = await Promise.all(
            comprovantes.map(c => 
              EventosService.uploadArquivo(c.file, 'comprovante', eventoAtual?.id || '')
            )
          );
          
          if (comprovanteUrls.length > 0) {
            eventoData.comprovanteUrl = comprovanteUrls[0];
            eventoData.comprovanteUrls = comprovanteUrls;
            toast({
              title: "Comprovantes de pagamento enviados",
              description: `${comprovanteUrls.length} comprovante(s) anexado(s) com sucesso`,
            });
          }
        } catch (error) {
          console.error("Erro ao fazer upload dos comprovantes:", error);
          toast({
            title: "Erro ao enviar comprovantes",
            description: "Não foi possível anexar os comprovantes",
            variant: "destructive",
          });
        } finally {
          setUploadingBoleto(false);
        }
      }

      onSubmit(eventoData);

    } catch (error) {
      console.error("Erro ao processar formulário:", error);
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao processar os dados",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    tipo: "nfe" | "boleto"
  ) => {
    const files = event.target.files;
    if (files) {
      if (tipo === "nfe") {
        setAnexoNFe(files[0]);
        toast({
          title: "Nota Fiscal Selecionada",
          description: `${files[0].name} (${(files[0].size / 1024).toFixed(2)} KB)`,
        });
      } else {
        const novosBoletos = Array.from(files);
        setAnexosBoleto(prev => [...prev, ...novosBoletos]);
        toast({
          title: "Boletos Selecionados",
          description: `${novosBoletos.length} boleto(s) adicionado(s)`,
        });
      }
    }
  };

  const removerBoleto = (index: number) => {
    setAnexosBoleto(prev => prev.filter((_, i) => i !== index));
  };

  // Função para buscar eventos por placa
  const buscarEventosPorPlaca = async (placa: string) => {
    if (placa.length < 7) {
      setEventosPorPlaca([]);
      return;
    }

    try {
      setCarregandoHistorico(true);
      const eventos = await EventosService.buscarPorPlaca(placa);
      setEventosPorPlaca(eventos);
    } catch (error) {
      console.error("Erro ao buscar eventos por placa:", error);
      toast({
        title: "Erro ao buscar histórico",
        description: "Não foi possível carregar o histórico da placa",
        variant: "destructive",
      });
    } finally {
      setCarregandoHistorico(false);
    }
  };

  const handleBoletoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const file = files[0];
    if (!file) return;

    setBoletoTemporario(prev => ({
      ...prev,
      file
    }));
  };

  const handleAdicionarBoleto = async () => {
    if (!boletoTemporario.file || !boletoTemporario.dataVencimento) {
      toast({
        title: "Erro",
        description: "Selecione um arquivo e uma data de vencimento",
        variant: "destructive",
      });
      return;
    }

    const file = boletoTemporario.file;
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    
    if (fileExt && ['pdf', 'jpg', 'jpeg', 'png'].includes(fileExt)) {
      try {
        console.log('Iniciando upload do arquivo:', file.name);
        const fileName = `${Date.now()}-${file.name}`;
        const filePath = `boletos/${fileName}`;

        // Primeiro, fazemos o upload do arquivo
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('documentos')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.type || 'application/pdf'
          });

        if (uploadError) {
          console.error('Erro detalhado do upload:', uploadError);
          toast({
            title: "Erro",
            description: `Não foi possível fazer o upload do boleto: ${uploadError.message}`,
            variant: "destructive",
          });
          return;
        }

        console.log('Upload concluído com sucesso:', uploadData);

        // Depois, obtemos a URL pública do arquivo
        const { data: { publicUrl } } = supabase.storage
          .from('documentos')
          .getPublicUrl(filePath);

        console.log('URL pública gerada:', publicUrl);

        const novoBoleto = {
          nome: file.name,
          url: publicUrl,
          dataVencimento: boletoTemporario.dataVencimento // Usar a data diretamente sem manipulação
        };

        setBoletos([...boletos, novoBoleto]);
        form.setValue('boletos', [...(form.getValues('boletos') || []), novoBoleto]);

        setBoletoTemporario({
          file: null,
          dataVencimento: ''
        });

        toast({
          title: "Sucesso",
          description: "Boleto adicionado com sucesso",
        });
      } catch (error) {
        console.error('Erro completo ao processar boleto:', error);
        toast({
          title: "Erro",
          description: "Ocorreu um erro ao processar o boleto. Por favor, tente novamente.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Erro",
        description: "Formato de arquivo não suportado. Use PDF, JPG ou PNG.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveBoleto = (index: number) => {
    form.reset(prev => ({
      ...prev,
      boletos: prev.boletos?.filter((_, i) => i !== index)
    }));
  };

  const handleComprovanteChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const file = files[0];
    if (!file) return;

    setComprovanteTemporario(prev => ({
      ...prev,
      file
    }));
  };

  const handleAdicionarComprovante = async () => {
    if (!comprovanteTemporario.file || !comprovanteTemporario.dataPagamento) {
      toast({
        title: "Erro",
        description: "Selecione um arquivo e uma data de pagamento",
        variant: "destructive",
      });
      return;
    }

    const file = comprovanteTemporario.file;
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    
    if (fileExt && ['pdf', 'jpg', 'jpeg', 'png'].includes(fileExt)) {
      try {
        console.log('Iniciando upload do comprovante:', file.name);
        const fileName = `${Date.now()}-${file.name}`;
        const filePath = `comprovantes/${fileName}`;

        // Primeiro, fazemos o upload do arquivo
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('documentos')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.type || 'application/pdf'
          });

        if (uploadError) {
          console.error('Erro detalhado do upload:', uploadError);
          toast({
            title: "Erro",
            description: `Não foi possível fazer o upload do comprovante: ${uploadError.message}`,
            variant: "destructive",
          });
          return;
        }

        console.log('Upload concluído com sucesso:', uploadData);

        // Depois, obtemos a URL pública do arquivo
        const { data: { publicUrl } } = supabase.storage
          .from('documentos')
          .getPublicUrl(filePath);

        console.log('URL pública gerada:', publicUrl);

        const novoComprovante = {
          nome: file.name,
          url: publicUrl,
          dataPagamento: comprovanteTemporario.dataPagamento
        };

        setComprovantes([...comprovantes, novoComprovante]);
        form.setValue('comprovantes', [...(form.getValues('comprovantes') || []), novoComprovante]);

        setComprovanteTemporario({
          file: null,
          dataPagamento: ''
        });

        toast({
          title: "Sucesso",
          description: "Comprovante adicionado com sucesso",
        });
      } catch (error) {
        console.error('Erro completo ao processar comprovante:', error);
        toast({
          title: "Erro",
          description: "Ocorreu um erro ao processar o comprovante. Por favor, tente novamente.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Erro",
        description: "Formato de arquivo não suportado. Use PDF, JPG ou PNG.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveComprovante = (index: number) => {
    form.reset(prev => ({
      ...prev,
      comprovantes: prev.comprovantes?.filter((_, i) => i !== index)
    }));
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      field.onChange(e);
                      buscarEventosPorPlaca(e.target.value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status do Pagamento</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Pendente">Pendente</SelectItem>
                    <SelectItem value="Pago">Pago</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

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
                          format(field.value, "PPP", { locale: ptBR })
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
                      locale={ptBR}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

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

        {/* Histórico de eventos por placa */}
        {eventosPorPlaca.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">Histórico de Eventos para esta Placa</h3>
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="space-y-4">
                {eventosPorPlaca.map((evento) => (
                  <div key={evento.id} className="flex items-start justify-between border-b pb-2 last:border-0">
                    <div>
                      <p className="font-medium">{evento.motivoEvento}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(evento.dataEvento).toLocaleDateString('pt-BR')} - 
                        R$ {evento.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <Badge variant={evento.status === 'Pago' ? 'default' : 'secondary'}>
                      {evento.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {carregandoHistorico && (
          <div className="flex items-center justify-center mt-4">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        )}

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Anexos</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  disabled={uploadingNFe}
                >
                  {uploadingNFe ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" />
                  )}
                  {anexoNFe ? "Alterar NFe" : "Anexar NFe"}
                </Button>
                {anexoNFe && !uploadingNFe && (
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
              {eventoAtual?.notaFiscalUrl && !anexoNFe && (
                <div className="flex items-center mt-2">
                  <FileText className="h-4 w-4 mr-2" />
                  <a 
                    href={eventoAtual.notaFiscalUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Nota fiscal anexada
                  </a>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <FormLabel>Boletos</FormLabel>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleBoletoChange}
                    className="cursor-pointer"
                  />
                  <Input
                    type="date"
                    value={boletoTemporario.dataVencimento}
                    onChange={(e) => setBoletoTemporario(prev => ({
                      ...prev,
                      dataVencimento: e.target.value
                    }))}
                    className="w-40"
                  />
                  <Button
                    type="button"
                    onClick={handleAdicionarBoleto}
                    disabled={!boletoTemporario.file || !boletoTemporario.dataVencimento}
                  >
                    Adicionar Boleto
                  </Button>
                </div>
                
                {/* Lista de boletos selecionados */}
                {boletos.length > 0 && (
                  <div className="space-y-2">
                    {boletos.map((boleto, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">{boleto.nome}</span>
                          <span className="text-xs text-gray-500">
                            (Vencimento: {boleto.dataVencimento.split('-').reverse().join('/')})
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const novosBoletos = [...boletos];
                            novosBoletos.splice(index, 1);
                            setBoletos(novosBoletos);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <FormDescription>
                Você pode adicionar múltiplos boletos. Formatos aceitos: PDF, JPG, PNG.
              </FormDescription>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Comprovantes de Pagamento</h3>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleComprovanteChange}
                className="cursor-pointer"
              />
              <Input
                type="date"
                value={comprovanteTemporario.dataPagamento}
                onChange={(e) => setComprovanteTemporario(prev => ({
                  ...prev,
                  dataPagamento: e.target.value
                }))}
                className="w-40"
              />
              <Button
                type="button"
                onClick={handleAdicionarComprovante}
                disabled={!comprovanteTemporario.file || !comprovanteTemporario.dataPagamento}
              >
                Adicionar Comprovante
              </Button>
            </div>
            
            {/* Lista de comprovantes selecionados */}
            {comprovantes.length > 0 && (
              <div className="space-y-2">
                {comprovantes.map((comprovante, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{comprovante.nome}</span>
                      <span className="text-xs text-gray-500">
                        (Data do Pagamento: {comprovante.dataPagamento.split('-').reverse().join('/')})
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const novosComprovantes = [...comprovantes];
                        novosComprovantes.splice(index, 1);
                        setComprovantes(novosComprovantes);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <FormDescription>
            Você pode adicionar múltiplos comprovantes de pagamento. Formatos aceitos: PDF, JPG, PNG.
          </FormDescription>
        </div>

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              form.reset();
              setAnexoNFe(null);
              setAnexosBoleto([]);
              setBoletos([]);
              setComprovantes([]);
            }}
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading || uploadingNFe || uploadingBoleto}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {eventoAtual ? "Atualizando..." : "Cadastrando..."}
              </>
            ) : (
              eventoAtual ? "Atualizar Evento" : "Cadastrar Evento"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
