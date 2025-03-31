
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
} from "lucide-react";

export function AppSidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

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
  ];

  return (
    <Sidebar
      defaultCollapsed={collapsed}
      onCollapsedChange={(collapsed) => setCollapsed(collapsed)}
    >
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
                  <SidebarMenuItem key={item.title} active={isActive}>
                    <SidebarMenuButton asChild>
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
                  <SidebarMenuItem key={item.title} active={isActive}>
                    <SidebarMenuButton asChild>
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
      </SidebarContent>
      <SidebarFooter className="p-4">
        {!collapsed && (
          <div className="text-xs text-sidebar-foreground/70 text-center">
            © 2023 Guardiões Proteção Veicular
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
