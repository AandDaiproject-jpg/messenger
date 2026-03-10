import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Conversation } from '@/types';

export function createConversation(
  name: string,
  type: 'direct' | 'group',
  participants: string[],
  participantNames: Record<string, string>,
  participantPhotos: Record<string, string | null>,
  createdBy: string
): Promise<string> {
  return addDoc(collection(db, 'conversations'), {
    name,
    type,
    participants,
    participantNames,
    participantPhotos,
    lastMessage: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy,
  }).then((docRef) => docRef.id);
}

export function updateLastMessage(
  conversationId: string,
  lastMessage: { text: string; senderId: string }
) {
  const conversationRef = doc(db, 'conversations', conversationId);
  return updateDoc(conversationRef, {
    lastMessage: {
      ...lastMessage,
      createdAt: serverTimestamp(),
    },
    updatedAt: serverTimestamp(),
  });
}

export function subscribeToConversations(
  userId: string,
  callback: (conversations: Conversation[]) => void
): () => void {
  const q = query(
    collection(db, 'conversations'),
    where('participants', 'array-contains', userId),
    orderBy('updatedAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const conversations = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        lastMessage: data.lastMessage ? {
          ...data.lastMessage,
          createdAt: data.lastMessage.createdAt?.toDate() || new Date(),
        } : null,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Conversation;
    });
    callback(conversations);
  });
}
