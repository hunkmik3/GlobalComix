import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from 'npm:@aws-sdk/client-s3';
import { getSignedUrl } from 'npm:@aws-sdk/s3-request-presigner';

const getOptionalEnv = (name: string) => {
  const value = Deno.env.get(name);
  return value?.trim() || undefined;
};

const getEnv = (name: string) => {
  const value = getOptionalEnv(name);
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
};

const getR2Endpoint = () => {
  const endpoint = getOptionalEnv('R2_ENDPOINT');

  if (endpoint) {
    if (!endpoint.startsWith('https://') && !endpoint.startsWith('http://')) {
      throw new Error(
        'R2_ENDPOINT must be a full URL like https://<account-id>.r2.cloudflarestorage.com. If you only have the account ID, set R2_ACCOUNT_ID instead.',
      );
    }

    return endpoint.replace(/\/+$/, '');
  }

  const accountId = getOptionalEnv('R2_ACCOUNT_ID');
  if (!accountId) throw new Error('Missing environment variable: R2_ENDPOINT or R2_ACCOUNT_ID');

  return `https://${accountId}.r2.cloudflarestorage.com`;
};

export const getR2Client = () => {
  return new S3Client({
    region: 'auto',
    endpoint: getR2Endpoint(),
    forcePathStyle: true,
    credentials: {
      accessKeyId: getEnv('R2_ACCESS_KEY_ID'),
      secretAccessKey: getEnv('R2_SECRET_ACCESS_KEY'),
    },
  });
};

export const createUploadUrl = async ({
  key,
  contentType,
  expiresIn = 300,
}: {
  key: string;
  contentType: string;
  expiresIn?: number;
}) => {
  const command = new PutObjectCommand({
    Bucket: getEnv('R2_BUCKET'),
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(getR2Client(), command, { expiresIn });
};

export const uploadObject = async ({
  key,
  body,
  contentType,
}: {
  key: string;
  body: Uint8Array;
  contentType: string;
}) => {
  const command = new PutObjectCommand({
    Bucket: getEnv('R2_BUCKET'),
    Key: key,
    Body: body,
    ContentType: contentType,
  });

  await getR2Client().send(command);
};

export const createReadUrl = async ({
  key,
  expiresIn = 3600,
}: {
  key: string;
  expiresIn?: number;
}) => {
  const command = new GetObjectCommand({
    Bucket: getEnv('R2_BUCKET'),
    Key: key,
  });

  return getSignedUrl(getR2Client(), command, { expiresIn });
};

export const sanitizeFileName = (fileName: string) => {
  return fileName
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120) || 'upload.bin';
};
