'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { subscribeToMessages, sendMessage, markMessageAsRead } from '@/lib/firebase/messages';
import { subscribeToConversations } from '@/lib/firebase/conversations';
import { updateLastMessage } from '@/lib/firebase/conversations';
import { uploadMessageFile, isValidFileType } from '@/lib/firebase/storage';
import type { Message, Conversation, Attachment } from '@/types/index';
import { formatDate, formatFileSize } from '@/lib/utils';
import { Send, Paperclip, ArrowLeft, Image, File, X, Upload, MessageCircle } from 'lucide-react';
import Link from 'next/link';

export default function ChatPage() {
  const params = useParams();
  const chatId = params.chatId as string;
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user || !chatId) return;

    const unsubMessages = subscribeToMessages(chatId, (msgs) => {
      setMessages(msgs);
      setLoading(false);
      
      msgs.forEach((msg) => {
        if (msg.senderId !== user.uid) {
          markMessageAsRead(msg.id, chatId, user.uid);
        }
      });
    });

    const unsubConv = subscribeToConversations(user.uid, (convs) => {
      const conv = convs.find((c) => c.id === chatId);
      if (conv) setConversation(conv);
    });

    return () => {
      unsubMessages();
      unsubConv();
    };
  }, [user, chatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!user || !newMessage.trim()) return;

    await sendMessage(
      chatId,
      user.uid,
      user.displayName || 'User',
      user.photoURL,
      newMessage.trim()
    );

    await updateLastMessage(chatId, {
      text: newMessage.trim(),
      senderId: user.uid,
    });

    setNewMessage('');
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!isValidFileType(file)) {
      alert('지원하지 않는 파일 형식입니다.');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const result = await uploadMessageFile(
        file,
        chatId,
        user.uid,
        (progress) => setUploadProgress(progress.progress)
      );

      const fileType = file.type.startsWith('image/') ? 'image' : 'file';
      
      await sendMessage(
        chatId,
        user.uid,
        user.displayName || 'User',
        user.photoURL,
        file.name,
        fileType,
        [{
          id: Date.now().toString(),
          name: result.name,
          url: result.url,
          type: result.type,
          size: result.size,
        }]
      );

      await updateLastMessage(chatId, {
        text: file.type.startsWith('image/') ? '이미지' : `파일: ${file.name}`,
        senderId: user.uid,
      });
    } catch (error) {
      console.error('Upload failed:', error);
      alert('파일 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const renderAttachment = (attachment: Attachment) => {
    if (!attachment) return null;
    
    if (attachment.type.startsWith('image/')) {
      return (
        <a 
          href={attachment.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="block mt-2"
        >
          <img 
            src={attachment.url} 
            alt={attachment.name}
            className="max-w-full rounded-md max-h-48 object-cover"
          />
        </a>
      );
    }

    return (
      <a 
        href={attachment.url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="flex items-center gap-2 mt-2 p-2 bg-background/10 rounded-md hover:bg-background/20"
      >
        <File className="w-4 h-4" />
        <span className="text-sm truncate">{attachment.name}</span>
        <span className="text-xs opacity-70">({formatFileSize(attachment.size)})</span>
      </a>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      <div className="flex items-center gap-3 p-4 border-b border-border bg-card">
        <Link
          href="/chats"
          className="p-2 hover:bg-secondary rounded-md transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="font-semibold">{conversation?.name || '채팅'}</h2>
          <p className="text-xs text-muted-foreground">
            {conversation?.type === 'group' 
              ? `${conversation.participants.length}명` 
              : '온라인'}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>메시지가 없습니다</p>
            <p className="text-sm">첫 메시지를 보내보세요</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.senderId === user?.uid;
            return (
              <div
                key={msg.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] px-4 py-2 rounded-lg ${
                    isOwn
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground'
                  }`}
                >
                  {!isOwn && (
                    <p className="text-xs font-medium mb-1 opacity-70">
                      {msg.senderName}
                    </p>
                  )}
                  <p className="break-words">{msg.text}</p>
                  {msg.attachments && msg.attachments.length > 0 && 
                    msg.attachments.map((att) => renderAttachment(att))
                  }
                  <div
                    className={`text-xs mt-1 ${
                      isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
                    }`}
                  >
                    {formatDate(msg.createdAt)}
                    {isOwn && msg.readBy.length > 1 && ' ✓'}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-border bg-card">
        {uploading && (
          <div className="mb-2">
            <div className="flex items-center justify-between text-sm mb-1">
              <span>업로드 중...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="h-1 bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="p-2 hover:bg-secondary rounded-md transition-colors disabled:opacity-50"
          >
            <Paperclip className="w-5 h-5 text-muted-foreground" />
          </button>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="메시지 입력..."
            disabled={uploading}
            className="flex-1 px-4 py-2 bg-secondary rounded-full border-0 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || uploading}
            className="p-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
