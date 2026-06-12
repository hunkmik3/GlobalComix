import { errorResponse, handleOptions, jsonResponse } from '../_shared/cors.ts';
import { getAdminClient } from '../_shared/supabase.ts';

type ResolveLoginBody = {
  identifier?: string;
};

Deno.serve(async (req) => {
  const options = handleOptions(req);
  if (options) return options;

  if (req.method !== 'POST') {
    return errorResponse('Method not allowed.', 405);
  }

  try {
    const body = await req.json() as ResolveLoginBody;
    const identifier = body.identifier?.trim();

    if (!identifier) {
      return errorResponse('Email or username is required.');
    }

    if (identifier.includes('@')) {
      return jsonResponse({ email: identifier.toLowerCase() });
    }

    const admin = getAdminClient();
    const { data: profile, error } = await admin
      .from('profiles')
      .select('id, active')
      .ilike('username', identifier)
      .maybeSingle();

    if (error) return errorResponse(error.message, 400);
    if (!profile?.id || profile.active === false) {
      return errorResponse('Invalid login credentials.', 404);
    }

    const { data, error: userError } = await admin.auth.admin.getUserById(profile.id);
    if (userError || !data.user?.email) {
      return errorResponse('Invalid login credentials.', 404);
    }

    return jsonResponse({ email: data.user.email.toLowerCase() });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Unexpected error.', 500);
  }
});
