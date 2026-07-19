import { Bell, Menu, ChevronDown } from 'lucide-react';
import { useAppStore } from '@/shared/store';
import { useUsers, useNotifications } from '@/shared/api/queries';
import type { Role } from '@/entities/types';
import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';

const ROLES: Role[] = [
  'Applicant', 'FSC Owner', 'HSE Officer', 'Contractor', 'Admin',
];

export function TopNav() {
  const { currentRole, currentUser, setRole, toggleSidebar } = useAppStore();
  const { data: users } = useUsers();
  const { data: notifications } = useNotifications(currentUser?.id, currentRole);
  const unreadCount = notifications?.filter((n) => !n.read).length ?? 0;
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (users && !currentUser) {
      const applicant = users.find((u) => u.role === 'Applicant');
      if (applicant) setRole('Applicant', applicant);
    }
  }, [users, currentUser, setRole]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleRoleChange(role: Role) {
    const user = users?.find((u) => u.role === role) ?? null;
    setRole(role, user);
    setDropdownOpen(false);
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-nnpc-green-dark flex items-center justify-between px-4 shadow-md">
      <div className="flex items-center gap-3">
        <button onClick={toggleSidebar} className="text-white hover:text-nnpc-green-light p-1 cursor-pointer">
          <Menu size={20} />
        </button>
        <span className="text-white font-bold text-lg tracking-tight">SmartPTW</span>
        <span className="text-nnpc-green-light text-xs hidden sm:inline">· NNPC Limited</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm px-3 py-1.5 rounded-md transition-colors cursor-pointer"
          >
            <span className="hidden sm:inline">{currentUser?.name ?? currentRole}</span>
            <span className="text-nnpc-gold text-xs font-medium">{currentRole}</span>
            <ChevronDown size={14} />
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-1 w-64 bg-white rounded-lg shadow-lg border border-border py-1 z-50">
              <div className="px-3 py-2 text-xs text-muted-foreground font-medium border-b border-border">
                Switch Role (Demo)
              </div>
              {ROLES.map((role) => {
                const user = users?.find((u) => u.role === role);
                return (
                  <button
                    key={role}
                    onClick={() => handleRoleChange(role)}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-accent flex items-center justify-between cursor-pointer ${
                      currentRole === role ? 'bg-accent font-medium' : ''
                    }`}
                  >
                    <span>{role}</span>
                    {user && <span className="text-xs text-muted-foreground">{user.name}</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <Link to="/notifications" className="relative text-white hover:text-nnpc-green-light p-1">
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-nnpc-red text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
