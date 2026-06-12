import { errorResponse, handleOptions, jsonResponse } from '../_shared/cors.ts';
import { getAdminClient, requireActiveUser } from '../_shared/supabase.ts';

Deno.serve(async (req) => {
  const options = handleOptions(req);
  if (options) return options;

  if (req.method !== 'POST') {
    return errorResponse('Method not allowed.', 405);
  }

  try {
    await requireActiveUser(req);

    const admin = getAdminClient();
    const { data, error } = await admin
      .from('profiles')
      .select('id, display_name, username, role, active, joined_at')
      .order('display_name', { ascending: true });

    if (error) return errorResponse(error.message, 400);

    return jsonResponse({ profiles: data || [] });
  } catch (error) {
    if (error instanceof Response) return error;
    return errorResponse(error instanceof Error ? error.message : 'Unexpected error.', 500);
  }
});
