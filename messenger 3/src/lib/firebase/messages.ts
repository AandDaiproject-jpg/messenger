import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  serverTimestamp,
  where,
  updateDoc,
  doc,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Message } from '@/types';

export function sendMessage(
  conversationId: string,
  senderId: string,
  senderName: string,
  senderPhotoURL: string | null,
  text: string,
  type: 'text' | 'image' | 'file' = 'text',
  attachments?: Message['attachments']
): Promise<string> {
  return addDoc(collection(db, 'conversations', conversationId, 'messages'), {
    conversationId,
    senderId,
    senderName,
    senderPhotoURL,
    text,
    type,
    attachments,
    createdAt: serverTimestamp(),
    readBy: [senderId],
  }).then((docRef) => docRef.id);
}

export function subscribeToMessages(
  conversationId: string,
  callback: (messages: Message[]) => void,
  messageLimit: number = 50
): () => void {
  const messagesRef = collection(db, 'conversations', conversationId, 'messages');
  const q = query(
    messagesRef,
    orderBy('createdAt', 'desc'),
    limit(messageLimit)
  );

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
      } as Message;
    });
    callback(messages);
  });
}

export function markMessageAsRead(messageId: string, conversationId: string, userId: string) {
  const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId);
  return updateDoc(messageRef, {
    readBy: arrayUnion(userId),
  });
}

export function getUnreadCount(messages: Message[], userId: string): number {
  return messages.filter(
    (msg) => msg.senderId !== userId && !msg.readBy.includes(userId)
  ).length;
}
