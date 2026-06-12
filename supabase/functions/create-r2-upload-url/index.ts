import { errorResponse, handleOptions, jsonResponse } from '../_shared/cors.ts';
import { createUploadUrl, sanitizeFileName } from '../_shared/r2.ts';
import { requireActiveUser } from '../_shared/supabase.ts';

type UploadUrlBody = {
  comic_id?: string;
  chapter_id?: string;
  panel_id?: string;
  stage: 'comic_thumbnail' | 'origin' | 'style_frame' | 'video';
  version: 'cover' | 'origin' | 'old' | 'new';
  file_name: string;
  mime_type: string;
};

const allowedStages = ['comic_thumbnail', 'origin', 'style_frame', 'video'];
const allowedVersions = ['cover', 'origin', 'old', 'new'];
const allowedVersionsByStage: Record<UploadUrlBody['stage'], readonly UploadUrlBody['version'][]> = {
  comic_thumbnail: ['cover'],
  origin: ['origin'],
  style_frame: ['old', 'new'],
  video: ['old', 'new'],
};

Deno.serve(async (req) => {
  const options = handleOptions(req);
  if (options) return options;

  if (req.method !== 'POST') {
    return errorResponse('Method not allowed.', 405);
  }

  try {
    const { user } = await requireActiveUser(req);
    const body = await req.json() as UploadUrlBody;

    if (!allowedStages.includes(body.stage) || !allowedVersions.includes(body.version)) {
      return errorResponse('Invalid stage or version.');
    }

    if (!allowedVersionsByStage[body.stage].includes(body.version)) {
      return errorResponse('Version does not match upload stage.');
    }

    const mimeType = body.mime_type || '';
    const isValidMimeType = body.stage === 'video'
      ? mimeType.startsWith('video/') || mimeType.startsWith('image/')
      : mimeType.startsWith('image/');

    if (!body.file_name || !isValidMimeType) {
      return errorResponse('A valid file_name and mime_type are required.');
    }

    const safeName = sanitizeFileName(body.file_name);
    const key = [
      'globalcomix',
      body.comic_id || 'unassigned-comic',
      body.chapter_id || 'comic',
      body.panel_id || 'cover',
      body.stage,
      body.version,
      `${crypto.randomUUID()}-${safeName}`,
    ].join('/');

    const uploadUrl = await createUploadUrl({
      key,
      contentType: mimeType,
    });

    return jsonResponse({
      uploadUrl,
      key,
      uploadedBy: user.id,
      expiresIn: 300,
    });
  } catch (error) {
    if (error instanceof Response) return error;
    return errorResponse(error instanceof Error ? error.message : 'Unexpected error.', 500);
  }
});
