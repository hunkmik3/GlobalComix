import { errorResponse, handleOptions, jsonResponse } from '../_shared/cors.ts';
import { getAdminClient, requireAdmin } from '../_shared/supabase.ts';

type CreateUserBody = {
  email: string;
  password: string;
  username?: string;
  display_name: string;
  role: 'ADMIN' | 'REVIEWER' | 'ARTIST';
};

const roleValues = ['ADMIN', 'REVIEWER', 'ARTIST'];

Deno.serve(async (req) => {
  const options = handleOptions(req);
  if (options) return options;

  if (req.method !== 'POST') {
    return errorResponse('Method not allowed.', 405);
  }

  try {
    const { user: requester, profile } = await requireAdmin(req);
    const body = await req.json() as CreateUserBody;

    if (!body.email || !body.password || !body.display_name || !body.role) {
      return errorResponse('Email, password, display_name, and role are required.');
    }

    if (!roleValues.includes(body.role)) {
      return errorResponse('Invalid role.');
    }

    const admin = getAdminClient();
    const { data, error } = await admin.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true,
      user_metadata: {
        display_name: body.display_name,
      },
    });

    if (error || !data.user) {
      return errorResponse(error?.message || 'Could not create user.', 400);
    }

    const { error: profileError } = await admin.from('profiles').insert({
      id: data.user.id,
      display_name: body.display_name,
      username: body.username || body.email,
      role: body.role,
      active: true,
    });

    if (profileError) {
      await admin.auth.admin.deleteUser(data.user.id);
      return errorResponse(profileError.message, 400);
    }

    await admin.from('activity_logs').insert({
      actor_id: requester.id,
      actor_name: profile.display_name,
      actor_role: profile.role,
      action: 'Account created',
      summary: `${profile.display_name} created an account for ${body.display_name}.`,
      detail: `${body.display_name} can sign in as ${body.role}.`,
      target_type: 'profile',
      target_id: data.user.id,
    });

    return jsonResponse({
      user: {
        id: data.user.id,
        email: data.user.email,
      },
    });
  } catch (error) {
    if (error instanceof Response) return error;
    return errorResponse(error instanceof Error ? error.message : 'Unexpected error.', 500);
  }
});
