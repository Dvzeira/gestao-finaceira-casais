import { NavLink, Outlet } from 'react-router-dom';
import { BarChart3, LayoutDashboard, LogOut, Receipt, Target, Wallet } from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useMyCouple } from '@/features/couples/hooks/use-my-couple';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/incomes', label: 'Receitas', icon: Wallet },
  { to: '/expenses', label: 'Despesas', icon: Receipt },
  { to: '/goals', label: 'Metas', icon: Target },
  { to: '/reports', label: 'Relatórios', icon: BarChart3 },
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : '';
  return `${first}${last}`.toUpperCase();
}

// Layout principal das áreas autenticadas: sidebar fixa no desktop e
// barra de navegação inferior no mobile, com menu do usuário.
export function AppLayout() {
  const { logout, userId } = useAuth();
  const { data: couple } = useMyCouple();

  const currentMember = couple?.members.find((member) => member.userId === userId);
  const displayName = currentMember?.name ?? 'Minha conta';
  const displayEmail = currentMember?.email ?? '';

  return (
    <div className="min-h-svh bg-background md:flex">
      {/* Sidebar desktop */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex h-16 items-center gap-2 px-6">
          <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Wallet className="size-4" />
          </div>
          <span className="text-sm font-semibold">Gestão Financeira</span>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3 py-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  isActive && 'bg-sidebar-accent text-sidebar-accent-foreground',
                )
              }
            >
              <item.icon className="size-4 shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-sidebar-accent"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  {getInitials(displayName)}
                </div>
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium text-sidebar-foreground">{displayName}</span>
                  {displayEmail ? (
                    <span className="truncate text-xs text-sidebar-foreground/60">{displayEmail}</span>
                  ) : null}
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>{displayName}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={logout}>
                <LogOut className="size-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      <div className="flex min-h-svh flex-1 flex-col">
        {/* Topbar mobile */}
        <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4 md:hidden">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Wallet className="size-4" />
            </div>
            <span className="text-sm font-semibold text-foreground">Gestão Financeira</span>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground"
              >
                {getInitials(displayName)}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="truncate text-sm font-medium">{displayName}</span>
                  {displayEmail ? (
                    <span className="truncate text-xs text-muted-foreground">{displayEmail}</span>
                  ) : null}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={logout}>
                <LogOut className="size-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="flex-1 px-4 py-6 pb-20 md:px-8 md:py-8 md:pb-8">
          <div className="mx-auto w-full max-w-6xl">
            <Outlet />
          </div>
        </main>

        {/* Bottom nav mobile */}
        <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-card md:hidden">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex flex-1 flex-col items-center gap-1 py-2 text-xs font-medium text-muted-foreground transition-colors',
                  isActive && 'text-primary',
                )
              }
            >
              <item.icon className="size-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
