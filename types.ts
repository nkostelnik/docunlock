export type UnlockStatus = 'idle' | 'uploading' | 'processing' | 'success' | 'error';

export interface ProcessedFile {
  name: string;
  size: string;
  type: string;
  protectionType?: string;
}
