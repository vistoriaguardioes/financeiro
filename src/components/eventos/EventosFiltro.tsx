
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Filter } from "lucide-react";
import { FiltroEvento } from "@/types";
import { cn } from "@/lib/utils";

interface EventosFiltroProps {
  onFilter: (filtro: FiltroEvento) => void;
  motivosEvento: string[];
  fornecedores: string[];
  placasVeiculo: string[];
}

export function EventosFiltro({
  onFilter,
  motivosEvento,
  fornecedores,
  placasVeiculo,
}: EventosFiltroProps) {
  const [filtro, setFiltro] = useState<FiltroEvento>({});

  const handleChange = (campo: keyof FiltroEvento, valor: string) => {
    setFiltro((prev) => ({ ...prev, [campo]: valor }));
  };

  const handleDateChange = (
    campo: "dataInicio" | "dataFim",
    valor: Date | undefined
  ) => {
    if (valor) {
      setFiltro((prev) => ({ ...prev, [campo]: valor.toISOString() }));
    } else {
      const novoFiltro = { ...filtro };
      delete novoFiltro[campo];
      setFiltro(novoFiltro);
    }
  };

  const handleSubmit = () => {
    onFilter(filtro);
  };

  const handleReset = () => {
    setFiltro({});
    onFilter({});
  };

  return (
    <div className="bg-white p-4 rounded-lg border mb-6">
      <div className="flex items-center mb-4">
        <Filter className="h-5 w-5 mr-2" />
        <h2 className="text-lg font-medium">Filtros</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Data Início */}
        <div>
          <label className="block text-sm font-medium mb-1">Data Início</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !filtro.dataInicio && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filtro.dataInicio ? (
                  format(new Date(filtro.dataInicio), "dd/MM/yyyy", {
                    locale: ptBR,
                  })
                ) : (
                  <span>Selecione</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={filtro.dataInicio ? new Date(filtro.dataInicio) : undefined}
                onSelect={(date) => handleDateChange("dataInicio", date)}
                initialFocus
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Data Fim */}
        <div>
          <label className="block text-sm font-medium mb-1">Data Fim</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !filtro.dataFim && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filtro.dataFim ? (
                  format(new Date(filtro.dataFim), "dd/MM/yyyy", {
                    locale: ptBR,
                  })
                ) : (
                  <span>Selecione</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={filtro.dataFim ? new Date(filtro.dataFim) : undefined}
                onSelect={(date) => handleDateChange("dataFim", date)}
                initialFocus
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Fornecedor */}
        <div>
          <label className="block text-sm font-medium mb-1">Fornecedor</label>
          <Select
            value={filtro.fornecedor}
            onValueChange={(value) => handleChange("fornecedor", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {fornecedores.map((fornecedor) => (
                  <SelectItem key={fornecedor} value={fornecedor}>
                    {fornecedor}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {/* Placa do Veículo */}
        <div>
          <label className="block text-sm font-medium mb-1">Placa</label>
          <Select
            value={filtro.placaVeiculo}
            onValueChange={(value) => handleChange("placaVeiculo", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {placasVeiculo.map((placa) => (
                  <SelectItem key={placa} value={placa}>
                    {placa}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {/* Motivo */}
        <div>
          <label className="block text-sm font-medium mb-1">Motivo</label>
          <Select
            value={filtro.motivoEvento}
            onValueChange={(value) => handleChange("motivoEvento", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {motivosEvento.map((motivo) => (
                  <SelectItem key={motivo} value={motivo}>
                    {motivo}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end mt-4 space-x-2">
        <Button variant="outline" onClick={handleReset}>
          Limpar
        </Button>
        <Button onClick={handleSubmit}>
          Aplicar Filtros
        </Button>
      </div>
    </div>
  );
}
