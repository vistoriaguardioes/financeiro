
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";

// Auth
import PrivateRoute from "./components/auth/PrivateRoute";

// Pages
import Login from "./pages/Login";
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
          {/* Rota pública de login */}
          <Route path="/login" element={<Login />} />
          
          {/* Rotas protegidas */}
          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/eventos" element={<PrivateRoute><Eventos /></PrivateRoute>} />
          <Route path="/novo-evento" element={<PrivateRoute><NovoEvento /></PrivateRoute>} />
          <Route path="/editar-evento/:id" element={<PrivateRoute><EditarEvento /></PrivateRoute>} />
          
          {/* Rota 404 */}
          <Route path="*" element={<PrivateRoute><NotFound /></PrivateRoute>} />
        </Routes>
      </TooltipProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
