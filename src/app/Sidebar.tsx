import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, FileText, FilePlus, ClipboardCheck, ClipboardList,
  Shield, Activity, BarChart3, ScrollText,
} from 'lucide-react';
import { useAppStore } from '@/shared/store';
import type { Role } from '@/entities/types';

interface NavItem {
  label: string;
  to: string;
  icon: React.ElementType;
  roles?: Role[];
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', to: '/', icon: LayoutDashboard },
  { label: 'JSAs', to: '/jsas', icon: ClipboardList },
  { label: 'Start JSA', to: '/jsas/create', icon: FilePlus, roles: ['Applicant'] },
  { label: 'All Permits', to: '/permits', icon: FileText },
  { label: 'My Reviews', to: '/reviews', icon: ClipboardCheck, roles: ['FSC Owner', 'HSE Officer'] },
  { label: 'My Acceptance', to: '/acceptance', icon: ClipboardCheck, roles: ['Contractor'] },
  { label: 'Monitoring', to: '/monitoring', icon: Shield },
  { label: 'Active Permits', to: '/active', icon: Activity },
  { label: 'Audit Trail', to: '/audit', icon: ScrollText, roles: ['Admin', 'FSC Owner', 'HSE Officer'] },
  { label: 'Analytics', to: '/analytics', icon: BarChart3, roles: ['Admin', 'FSC Owner', 'HSE Officer'] },
];

export function Sidebar() {
  const { currentRole, sidebarOpen } = useAppStore();

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(currentRole),
  );

  return (
    <aside
      className={`fixed top-14 left-0 bottom-0 z-40 bg-white border-r border-border transition-all duration-200 ${
        sidebarOpen ? 'w-60' : 'w-16'
      }`}
    >
      <nav className="flex flex-col gap-1 p-2 mt-2">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/' || item.to === '/jsas'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-nnpc-green-light text-nnpc-green-dark font-medium'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`
            }
          >
            <item.icon size={18} className="shrink-0" />
            {sidebarOpen && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
