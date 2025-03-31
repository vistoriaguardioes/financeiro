
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Shield } from "lucide-react";

const Login = () => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Verificar a senha
    if (password === "GuardAdm") {
      // Armazenar no localStorage que o usuário está autenticado
      localStorage.setItem("guardAuthenticated", "true");
      localStorage.setItem("authTimestamp", Date.now().toString());
      
      toast({
        title: "Login bem-sucedido",
        description: "Bem-vindo ao sistema Guardiões Financeiro",
      });
      
      navigate("/");
    } else {
      setError("Senha incorreta");
      toast({
        title: "Erro de autenticação",
        description: "A senha fornecida está incorreta",
        variant: "destructive",
      });
    }
    
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-lg">
        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="flex items-center justify-center w-16 h-16 bg-guardioes-green rounded-full">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Guardiões Financeiro</h1>
          <p className="text-gray-600">Faça login para acessar o sistema</p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Senha
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite sua senha"
              className="w-full"
              required
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
          
          <div>
            <Button 
              type="submit" 
              className="w-full bg-guardioes-green hover:bg-guardioes-green/90"
              disabled={loading}
            >
              {loading ? "Autenticando..." : "Entrar"}
            </Button>
          </div>
        </form>
        
        <div className="mt-6 text-center text-sm text-gray-600">
          © 2025 Guardiões Proteção Veicular
        </div>
      </div>
    </div>
  );
};

export default Login;
