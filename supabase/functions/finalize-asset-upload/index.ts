import { errorResponse, handleOptions, jsonResponse } from '../_shared/cors.ts';
import { getAdminClient, requireActiveUser } from '../_shared/supabase.ts';

type FinalizeBody = {
  comic_id?: string;
  chapter_id?: string;
  panel_id?: string;
  stage: 'comic_thumbnail' | 'origin' | 'style_frame' | 'video';
  version: 'cover' | 'origin' | 'old' | 'new';
  r2_key: string;
  mime_type: string;
  size_bytes?: number;
};

const allowedVersionsByStage: Record<FinalizeBody['stage'], readonly FinalizeBody['version'][]> = {
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
    const { user, profile } = await requireActiveUser(req);
    const body = await req.json() as FinalizeBody;

    if (!body.r2_key || !body.mime_type || !body.stage || !body.version) {
      return errorResponse('r2_key, mime_type, stage, and version are required.');
    }

    if (!allowedVersionsByStage[body.stage]?.includes(body.version)) {
      return errorResponse('Version does not match upload stage.');
    }

    const isValidMimeType = body.stage === 'video'
      ? body.mime_type.startsWith('video/') || body.mime_type.startsWith('image/')
      : body.mime_type.startsWith('image/');

    if (!isValidMimeType) {
      return errorResponse('mime_type does not match upload stage.');
    }

    const admin = getAdminClient();
    const { data: asset, error } = await admin
      .from('panel_assets')
      .insert({
        comic_id: body.comic_id || null,
        chapter_id: body.chapter_id || null,
        panel_id: body.panel_id || null,
        stage: body.stage,
        version: body.version,
        r2_key: body.r2_key,
        mime_type: body.mime_type,
        size_bytes: body.size_bytes || null,
        uploaded_by: user.id,
        upload_status: 'ready',
      })
      .select('*')
      .single();

    if (error) return errorResponse(error.message, 400);

    if (body.stage === 'comic_thumbnail' && body.comic_id) {
      await admin
        .from('comics')
        .update({ thumbnail_asset_id: asset.id, updated_at: new Date().toISOString() })
        .eq('id', body.comic_id);
    }

    await admin.from('activity_logs').insert({
      actor_id: user.id,
      actor_name: profile.display_name,
      actor_role: profile.role,
      action: 'Asset uploaded',
      summary: `${profile.display_name} uploaded ${body.version} ${body.stage.replaceAll('_', ' ')} media.`,
      detail: 'The file is now stored in Cloudflare R2.',
      target_type: body.panel_id ? 'panel' : 'comic',
      target_id: body.panel_id || body.comic_id || null,
    });

    return jsonResponse({ asset });
  } catch (error) {
    if (error instanceof Response) return error;
    return errorResponse(error instanceof Error ? error.message : 'Unexpected error.', 500);
  }
});
