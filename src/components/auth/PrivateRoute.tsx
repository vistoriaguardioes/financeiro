
import { Navigate } from "react-router-dom";

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute = ({ children }: PrivateRouteProps) => {
  const isAuthenticated = localStorage.getItem("guardAuthenticated") === "true";
  const authTimestamp = Number(localStorage.getItem("authTimestamp") || "0");
  
  // Verificar se o token expirou (8 horas)
  const TOKEN_EXPIRY_TIME = 8 * 60 * 60 * 1000; // 8 horas em milissegundos
  const isExpired = Date.now() - authTimestamp > TOKEN_EXPIRY_TIME;
  
  // Se não estiver autenticado ou o token expirou, redirecionar para o login
  if (!isAuthenticated || isExpired) {
    // Limpar o localStorage se o token expirou
    if (isExpired && isAuthenticated) {
      localStorage.removeItem("guardAuthenticated");
      localStorage.removeItem("authTimestamp");
    }
    
    return <Navigate to="/login" replace />;
  }
  
  // Se estiver autenticado e o token ainda é válido, renderizar o conteúdo
  return <>{children}</>;
};

export default PrivateRoute;
