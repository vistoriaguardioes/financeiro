
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  BarChart3,
  Calendar,
  FilePlus,
  FileText,
  HelpCircle,
  Home,
  Settings,
  Truck,
  Users,
  LogOut
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  // Função para fazer logout
  const handleLogout = () => {
    localStorage.removeItem("guardAuthenticated");
    localStorage.removeItem("authTimestamp");
    navigate("/login");
  };

  // Menu items
  const menuItems = [
    {
      title: "Dashboard",
      url: "/",
      icon: Home,
    },
    {
      title: "Novo Evento",
      url: "/novo-evento",
      icon: FilePlus,
    },
    {
      title: "Eventos Financeiros",
      url: "/eventos",
      icon: Calendar,
    },
    {
      title: "Veículos",
      url: "/veiculos",
      icon: Truck,
    },
    {
      title: "Fornecedores",
      url: "/fornecedores",
      icon: Users,
    },
    {
      title: "Relatórios",
      url: "/relatorios",
      icon: BarChart3,
    },
    {
      title: "Documentos",
      url: "/documentos",
      icon: FileText,
    },
  ];

  const settingsItems = [
    {
      title: "Configurações",
      url: "/configuracoes",
      icon: Settings,
    },
    {
      title: "Suporte",
      url: "/suporte",
      icon: HelpCircle,
    },
    {
      title: "Sair",
      url: "#",
      icon: LogOut,
      onClick: handleLogout
    }
  ];

  return (
    <Sidebar>
      <SidebarHeader className="flex items-center justify-center py-6">
        {!collapsed ? (
          <div className="text-xl font-semibold text-white">
            Guardiões <span className="text-guardioes-green">Financeiro</span>
          </div>
        ) : (
          <div className="text-xl font-bold text-white">GF</div>
        )}
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild data-active={isActive}>
                      <Link to={item.url}>
                        <item.icon size={18} />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-4">
          <SidebarGroupLabel>Sistema</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      data-active={isActive}
                      onClick={item.onClick}
                    >
                      {item.url === "#" ? (
                        <button className="flex w-full items-center">
                          <item.icon size={18} />
                          <span>{item.title}</span>
                        </button>
                      ) : (
                        <Link to={item.url}>
                          <item.icon size={18} />
                          <span>{item.title}</span>
                        </Link>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        {!collapsed && (
          <div className="text-xs text-sidebar-foreground/70 text-center">
            © 2025 Guardiões Proteção Veicular
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
