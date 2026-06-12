import { errorResponse, handleOptions, jsonResponse } from '../_shared/cors.ts';
import { createReadUrl, sanitizeFileName, uploadObject } from '../_shared/r2.ts';
import { getAdminClient, requireActiveUser } from '../_shared/supabase.ts';

type UploadStage = 'comic_thumbnail' | 'origin' | 'style_frame' | 'video';
type UploadVersion = 'cover' | 'origin' | 'old' | 'new';

const allowedStages = ['comic_thumbnail', 'origin', 'style_frame', 'video'];
const allowedVersions = ['cover', 'origin', 'old', 'new'];
const allowedVersionsByStage: Record<UploadStage, readonly UploadVersion[]> = {
  comic_thumbnail: ['cover'],
  origin: ['origin'],
  style_frame: ['old', 'new'],
  video: ['old', 'new'],
};

const optionalFormValue = (form: FormData, name: string) => {
  const value = form.get(name);
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
};

Deno.serve(async (req) => {
  const options = handleOptions(req);
  if (options) return options;

  if (req.method !== 'POST') {
    return errorResponse('Method not allowed.', 405);
  }

  try {
    const { user, profile } = await requireActiveUser(req);
    const form = await req.formData();
    const file = form.get('file');
    const stage = optionalFormValue(form, 'stage') as UploadStage | undefined;
    const version = optionalFormValue(form, 'version') as UploadVersion | undefined;

    if (!(file instanceof File)) {
      return errorResponse('file is required.');
    }

    if (!stage || !version || !allowedStages.includes(stage) || !allowedVersions.includes(version)) {
      return errorResponse('Invalid stage or version.');
    }

    if (!allowedVersionsByStage[stage].includes(version)) {
      return errorResponse('Version does not match upload stage.');
    }

    const mimeType = file.type || 'application/octet-stream';
    const isValidMimeType = stage === 'video'
      ? mimeType.startsWith('video/') || mimeType.startsWith('image/')
      : mimeType.startsWith('image/');

    if (!isValidMimeType) {
      return errorResponse('mime_type does not match upload stage.');
    }

    const comicId = optionalFormValue(form, 'comic_id');
    const chapterId = optionalFormValue(form, 'chapter_id');
    const panelId = optionalFormValue(form, 'panel_id');
    const safeName = sanitizeFileName(file.name || 'upload.bin');
    const key = [
      'globalcomix',
      comicId || 'unassigned-comic',
      chapterId || 'comic',
      panelId || 'cover',
      stage,
      version,
      `${crypto.randomUUID()}-${safeName}`,
    ].join('/');

    const body = new Uint8Array(await file.arrayBuffer());

    await uploadObject({
      key,
      body,
      contentType: mimeType,
    });

    const admin = getAdminClient();
    const { data: asset, error } = await admin
      .from('panel_assets')
      .insert({
        comic_id: comicId || null,
        chapter_id: chapterId || null,
        panel_id: panelId || null,
        stage,
        version,
        r2_key: key,
        mime_type: mimeType,
        size_bytes: file.size || body.byteLength,
        uploaded_by: user.id,
        upload_status: 'ready',
      })
      .select('*')
      .single();

    if (error) return errorResponse(error.message, 400);

    if (stage === 'comic_thumbnail' && comicId) {
      await admin
        .from('comics')
        .update({ thumbnail_asset_id: asset.id, updated_at: new Date().toISOString() })
        .eq('id', comicId);
    }

    await admin.from('activity_logs').insert({
      actor_id: user.id,
      actor_name: profile.display_name,
      actor_role: profile.role,
      action: 'Asset uploaded',
      summary: `${profile.display_name} uploaded ${version} ${stage.replaceAll('_', ' ')} media.`,
      detail: 'The file is now stored in Cloudflare R2.',
      target_type: panelId ? 'panel' : 'comic',
      target_id: panelId || comicId || null,
    });

    const readUrl = await createReadUrl({ key });

    return jsonResponse({
      asset,
      readUrl,
      expiresIn: 3600,
    });
  } catch (error) {
    if (error instanceof Response) return error;
    return errorResponse(error instanceof Error ? error.message : 'Unexpected error.', 500);
  }
});
