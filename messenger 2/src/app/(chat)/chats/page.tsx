'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import { subscribeToConversations, createConversation } from '@/lib/firebase/conversations';
import { Conversation } from '@/types';
import { formatDate } from '@/lib/utils';
import { MessageCircle, Plus, Users } from 'lucide-react';

export default function ChatListPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newChatName, setNewChatName] = useState('');

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToConversations(user.uid, (convs) => {
      setConversations(convs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleCreateGroup = async () => {
    if (!user || !newChatName.trim()) return;

    await createConversation(
      newChatName,
      'group',
      [user.uid],
      { [user.uid]: user.displayName || 'User' },
      { [user.uid]: user.photoURL },
      user.uid
    );

    setNewChatName('');
    setShowCreateModal(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">대화</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" />
          새 대화
        </button>
      </div>

      {conversations.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>대화가 없습니다</p>
          <p className="text-sm">새 대화를 시작해보세요</p>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map((conv) => (
            <Link
              key={conv.id}
              href={`/chats/${conv.id}`}
              className="flex items-center gap-3 p-4 bg-card rounded-lg border border-border hover:bg-accent transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                {conv.type === 'group' ? (
                  <Users className="w-6 h-6 text-primary" />
                ) : (
                  <img
                    src={Object.values(conv.participantPhotos)[0] || '/default-avatar.png'}
                    alt=""
                    className="w-12 h-12 rounded-full object-cover"
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium truncate">
                    {conv.type === 'group' ? conv.name : Object.values(conv.participantNames)[0]}
                  </h3>
                  {conv.lastMessage && (
                    <span className="text-xs text-muted-foreground">
                      {formatDate(conv.lastMessage.createdAt)}
                    </span>
                  )}
                </div>
                {conv.lastMessage && (
                  <p className="text-sm text-muted-foreground truncate">
                    {conv.lastMessage.text}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-background p-6 rounded-lg w-full max-w-md border border-border">
            <h2 className="text-xl font-bold mb-4">새 그룹 만들기</h2>
            <input
              type="text"
              value={newChatName}
              onChange={(e) => setNewChatName(e.target.value)}
              placeholder="그룹 이름"
              className="w-full px-3 py-2 bg-secondary rounded-md border border-input mb-4"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-muted-foreground hover:text-foreground"
              >
                취소
              </button>
              <button
                onClick={handleCreateGroup}
                disabled={!newChatName.trim()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
              >
                만들기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
