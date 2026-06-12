import { errorResponse, handleOptions, jsonResponse } from '../_shared/cors.ts';
import { createReadUrl } from '../_shared/r2.ts';
import { getAdminClient, requireActiveUser } from '../_shared/supabase.ts';

type ReadUrlBody = {
  asset_id?: string;
  r2_key?: string;
};

Deno.serve(async (req) => {
  const options = handleOptions(req);
  if (options) return options;

  if (req.method !== 'POST') {
    return errorResponse('Method not allowed.', 405);
  }

  try {
    const { profile } = await requireActiveUser(req);
    const body = await req.json() as ReadUrlBody;

    if (!body.asset_id && !body.r2_key) {
      return errorResponse('asset_id or r2_key is required.');
    }

    const admin = getAdminClient();
    let assetQuery = admin
      .from('panel_assets')
      .select('id, r2_key');

    if (body.asset_id) {
      assetQuery = assetQuery.eq('id', body.asset_id);
    } else {
      assetQuery = assetQuery.eq('r2_key', body.r2_key);
    }

    const { data: asset, error } = await assetQuery.maybeSingle();
    if (error || !asset) return errorResponse('Asset not found.', 404);

    const readUrl = await createReadUrl({ key: asset.r2_key });

    return jsonResponse({
      readUrl,
      expiresIn: 3600,
      viewerRole: profile.role,
    });
  } catch (error) {
    if (error instanceof Response) return error;
    return errorResponse(error instanceof Error ? error.message : 'Unexpected error.', 500);
  }
});
