import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL,
  deleteObject 
} from 'firebase/storage';
import { storage } from './config';
import { formatFileSize } from '@/lib/utils';

const MAX_FILE_SIZE = 10 * 1024 * 1024;

interface UploadResult {
  url: string;
  path: string;
  name: string;
  type: string;
  size: number;
}

interface UploadProgress {
  progress: number;
  error?: string;
}

export async function uploadMessageFile(
  file: File,
  conversationId: string,
  userId: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`파일 크기가 너무 큽니다. 최대 ${formatFileSize(MAX_FILE_SIZE)}까지 업로드 가능합니다.`);
  }

  const timestamp = Date.now();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const filePath = `messages/${conversationId}/${userId}/${timestamp}_${sanitizedName}`;
  const storageRef = ref(storage, filePath);

  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = Math.round(
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        );
        onProgress?.({ progress });
      },
      (error) => {
        onProgress?.({ progress: 0, error: error.message });
        reject(error);
      },
      async () => {
        try {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({
            url,
            path: filePath,
            name: file.name,
            type: file.type,
            size: file.size,
          });
        } catch (error) {
          reject(error);
        }
      }
    );
  });
}

export async function deleteMessageFile(path: string): Promise<void> {
  const storageRef = ref(storage, path);
  await deleteObject(storageRef);
}

export function isValidFileType(file: File): boolean {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ];
  return allowedTypes.includes(file.type);
}
