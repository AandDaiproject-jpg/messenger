'use client';

import { useAuth } from '@/components/providers/AuthProvider';
import { logout } from '@/lib/firebase/auth';
import { useRouter } from 'next/navigation';
import { MessageCircle, LogOut, Settings } from 'lucide-react';
import { ProtectedRoute } from '@/components/providers/ProtectedRoute';

function ChatLayoutContent({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="h-14 bg-card border-b border-border flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-6 h-6 text-primary" />
          <span className="font-semibold text-lg">Messenger</span>
        </div>
        <div className="flex items-center gap-3">
          {user?.photoURL && (
            <img
              src={user.photoURL}
              alt={user.displayName || 'User'}
              className="w-8 h-8 rounded-full"
            />
          )}
          <button
            onClick={handleLogout}
            className="p-2 hover:bg-secondary rounded-md transition-colors"
            title="로그아웃"
          >
            <LogOut className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <ChatLayoutContent>{children}</ChatLayoutContent>
    </ProtectedRoute>
  );
}
