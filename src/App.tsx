
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";

// Pages
import Dashboard from "./pages/Index";
import NotFound from "./pages/NotFound";
import Eventos from "./pages/Eventos";
import NovoEvento from "./pages/NovoEvento";
import EditarEvento from "./pages/EditarEvento";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/eventos" element={<Eventos />} />
          <Route path="/novo-evento" element={<NovoEvento />} />
          <Route path="/editar-evento/:id" element={<EditarEvento />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
