import { Outlet } from 'react-router-dom';
import { TopNav } from './TopNav';
import { Sidebar } from './Sidebar';
import { useAppStore } from '@/shared/store';

export function Layout() {
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <div className="flex">
        <Sidebar />
        <main className={`flex-1 min-w-0 transition-all duration-200 ${sidebarOpen ? 'ml-60' : 'ml-16'} mt-14 p-6`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
