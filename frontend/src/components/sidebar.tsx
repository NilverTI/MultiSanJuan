'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/auth-provider';
import {
  LayoutDashboard, ShoppingCart, Users, FileText, LogOut,
  Store, Sun, Moon, ChevronLeft, ChevronRight,
  ChevronDown, LayoutGrid, Archive, UserCheck, PieChart
} from 'lucide-react';
import { useTheme } from '@/providers/theme-provider';
import { useState, memo, useMemo, useCallback } from 'react';

type SubNavItem = Omit<NavItem, 'icon' | 'subItems'>;

interface NavItem {
  label: string;
  href?: string;
  icon: React.ReactNode;
  permissions?: string[];
  subItems?: SubNavItem[];
}

const navItems: NavItem[] = [
  { label: 'DASHBOARD', href: '/', icon: <LayoutDashboard size={20} />, permissions: ['reportes.ver'] },
  {
    label: 'Tienda / POS',
    icon: <ShoppingCart size={20} />,
    subItems: [
      { label: 'Punto de Venta', href: '/sales/pos', permissions: ['ventas.crear'] }
    ]
  },
  {
    label: 'Gestión de Ventas',
    icon: <FileText size={20} />,
    subItems: [
      { label: 'Historial de Ventas', href: '/sales', permissions: ['ventas.ver'] },
      { label: 'Caja Registradora', href: '/cash-register', permissions: ['caja.ver'] },
      { label: 'Cotizaciones', href: '/quotes', permissions: ['cotizaciones.ver'] },
      { label: 'Notas de Venta', href: '/sale-notes', permissions: ['notas_venta.ver'] },
    ]
  },
  {
    label: 'Productos/Servicios',
    icon: <LayoutGrid size={20} />,
    subItems: [
      { label: 'Productos', href: '/products', permissions: ['productos.ver'] },
      { label: 'Categorías', href: '/categories', permissions: ['productos.ver'] },
      { label: 'Marcas', href: '/brands', permissions: ['productos.ver'] },
      { label: 'Promociones', href: '/promotions', permissions: ['promociones.ver'] },
    ]
  },
  {
    label: 'Clientes',
    icon: <UserCheck size={20} />,
    subItems: [
      { label: 'Clientes', href: '/customers', permissions: ['clientes.ver'] }
    ]
  },
  {
    label: 'Inventario',
    icon: <Archive size={20} />,
    subItems: [
      { label: 'Inventario', href: '/inventory', permissions: ['inventario.ver'] }
    ]
  },
  {
    label: 'Usuarios ',
    icon: <Users size={20} />,
    subItems: [
      { label: 'Usuarios', href: '/users', permissions: ['usuarios.ver'] },
      { label: 'Roles y Permisos', href: '/roles', permissions: ['roles.ver', 'roles.crear', 'roles.editar', 'roles.eliminar'] },
      { label: 'Auditoría', href: '/audit', permissions: ['auditoria.ver'] },
      { label: 'Configuración', href: '/settings', permissions: ['configuracion.ver'] },
    ]
  },
  { label: 'Reportes', href: '/reports', icon: <PieChart size={20} />, permissions: ['reportes.ver'] },
];

export const Sidebar = memo(function Sidebar() {
  const pathname = usePathname();
  const { user, logout, hasAnyPermission } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

  const toggleMenu = useCallback((label: string) => {
    setOpenMenus(prev => ({ ...prev, [label]: !prev[label] }));
  }, []);

  const hasPerm = useCallback((perms?: string[]) => {
    if (!perms || perms.length === 0) return true;
    return hasAnyPermission(perms);
  }, [hasAnyPermission]);

  const filteredNavItems = useMemo(() => {
    const result: Array<NavItem & { subItems?: SubNavItem[] }> = [];
    for (const item of navItems) {
      if (item.subItems) {
        const filteredSub = item.subItems.filter(sub => hasPerm(sub.permissions));
        if (filteredSub.length === 0) continue;
        result.push({ ...item, subItems: filteredSub });
      } else if (hasPerm(item.permissions)) {
        result.push(item);
      }
    }
    return result;
  }, [hasPerm]);

  const toggleCollapse = useCallback(() => setCollapsed(prev => !prev), []);

  return (
    <aside className={`fixed left-0 top-0 z-40 h-screen ${collapsed ? 'w-20' : 'w-64'} gradient-sidebar transition-all duration-300`}>
      <div className="flex flex-col h-full">
        <div className={`flex border-b border-[rgba(255,255,255,0.08)] transition-all duration-300 ${collapsed ? 'flex-col items-center py-4 gap-4' : 'flex-row items-center justify-between px-4 py-4'}`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#90CAF9] flex items-center justify-center shrink-0">
              <Store size={20} className="text-[#0B1B2B]" />
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <h1 className="text-sm font-bold text-[#F4F4F4] tracking-tight whitespace-nowrap">MULTI SAN JUAN</h1>
                <p className="text-[10px] text-[#8D8D8D] whitespace-nowrap">Sistema de Ventas</p>
              </div>
            )}
          </div>

          <button
            onClick={toggleCollapse}
            className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg hover:bg-[rgba(255,255,255,0.08)] text-[#8D8D8D] hover:text-[#F4F4F4] transition-colors shrink-0"
            title={collapsed ? "Expandir" : "Contraer"}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto scrollbar-thin px-2 py-4 space-y-1">
          {filteredNavItems.map((item) => {
            const hasSubItems = item.subItems && item.subItems.length > 0;
            const isExpanded = openMenus[item.label];
            const isActive = item.href ? (pathname === item.href || pathname.startsWith(item.href + '/')) : false;

            if (hasSubItems) {
              return (
                <div key={item.label} className="space-y-1">
                  <button
                    onClick={() => toggleMenu(item.label)}
                    className={cn('sidebar-item w-full justify-between', collapsed && 'justify-center px-2')}
                    title={collapsed ? item.label : undefined}
                  >
                    <div className="flex items-center gap-3">
                      {item.icon}
                      {!collapsed && <span>{item.label}</span>}
                    </div>
                    {!collapsed && (
                      <ChevronDown size={16} className={cn("transition-transform duration-200", isExpanded && "rotate-180")} />
                    )}
                  </button>
                  {isExpanded && !collapsed && (
                    <div className="pl-9 space-y-1">
                      {item.subItems!.map(subItem => {
                        const isSubActive = pathname === subItem.href || pathname.startsWith(subItem.href + '/');
                        return (
                          <Link
                            key={subItem.href}
                            href={subItem.href || '#'}
                            className={cn('sidebar-item py-2 text-sm', isSubActive && 'active')}
                          >
                            <span>{subItem.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.label}
                href={item.href || '#'}
                className={cn('sidebar-item', isActive && 'active', collapsed && 'justify-center px-2')}
                title={collapsed ? item.label : undefined}
              >
                {item.icon}
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-[rgba(255,255,255,0.08)] px-2 py-3 space-y-2">
          <button onClick={toggleTheme} className={cn('sidebar-item w-full', collapsed && 'justify-center px-2')} title={collapsed ? (theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro') : undefined}>
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            {!collapsed && <span>{theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}</span>}
          </button>

          {user && (
            <div className={cn('flex items-center gap-3 rounded-xl bg-[#1E1E1E] p-2.5 border border-[rgba(255,255,255,0.06)]', collapsed ? 'justify-center' : '')} title={collapsed ? `${user.firstName} ${user.lastName}` : undefined}>
              <div className="w-8 h-8 rounded-full bg-[#90CAF9] flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-white">
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </span>
              </div>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#F4F4F4] truncate">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-[10px] text-[#8D8D8D] truncate">{user.roles?.join(', ')}</p>
                </div>
              )}
            </div>
          )}

          <button onClick={logout} className={cn('sidebar-item w-full text-[#EF9A9A] hover:text-[#EF9A9A] hover:bg-[rgba(239,154,154,0.1)]', collapsed && 'justify-center px-2')} title={collapsed ? 'Cerrar Sesión' : undefined}>
            <LogOut size={20} />
            {!collapsed && <span>Cerrar Sesión</span>}
          </button>
        </div>
      </div>
    </aside>
  );
});
