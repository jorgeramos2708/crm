import * as Minio from 'minio';
import { env } from '../config.js';

const BUCKET = process.env.MINIO_BUCKET || 'crm-archivos';

function client() {
  return new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT || '9000', 10),
    useSSL: process.env.MINIO_SSL === 'true',
    accessKey: process.env.MINIO_USER || 'crm',
    secretKey: process.env.MINIO_PASSWORD || 'crm_dev_password',
  });
}

let cached: Minio.Client | null = null;
export function storage(): Minio.Client {
  if (!cached) cached = client();
  return cached;
}

export async function ensureBucket(): Promise<void> {
  try {
    const exists = await storage().bucketExists(BUCKET);
    if (!exists) {
      await storage().makeBucket(BUCKET);
      console.log(`🪣 Bucket MinIO listo: ${BUCKET}`);
    }
  } catch (err) {
    console.error('MinIO ensureBucket (reintentable):', (err as Error)?.message || err);
  }
}

export function bucketName(): string {
  return BUCKET;
}
