import { User } from 'firebase/auth';

export interface AppUser extends User {
  displayName: string | null;
  photoURL: string | null;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderPhotoURL: string | null;
  text: string;
  type: 'text' | 'image' | 'file';
  attachments?: Attachment[];
  createdAt: Date;
  readBy: string[];
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface Conversation {
  id: string;
  name: string;
  type: 'direct' | 'group';
  participants: string[];
  participantNames: Record<string, string>;
  participantPhotos: Record<string, string | null>;
  lastMessage: {
    text: string;
    senderId: string;
    createdAt: Date;
  } | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  createdAt: Date;
  lastSeen: Date;
  isOnline: boolean;
}
