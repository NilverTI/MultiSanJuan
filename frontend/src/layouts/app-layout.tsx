'use client';

import { Sidebar } from '@/components/sidebar';
import { usePathname } from 'next/navigation';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPOS = pathname === '/sales/pos';

  return (
    <div className="app-shell flex min-h-screen bg-background">
      <Sidebar />
      <main className={`app-main flex-1 min-h-screen transition-all duration-300 ${isPOS ? 'ml-64' : 'ml-64'}`}>
        {children}
      </main>
    </div>
  );
}
