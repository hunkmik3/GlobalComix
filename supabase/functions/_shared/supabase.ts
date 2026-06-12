import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from './cors.ts';

type AppRole = 'ADMIN' | 'REVIEWER' | 'ARTIST';

type Profile = {
  id: string;
  display_name: string;
  username: string;
  role: AppRole;
  active: boolean;
};

type Requester = {
  user: { id: string } | null;
  profile: Profile | null;
};

type ActiveRequester = {
  user: { id: string };
  profile: Profile;
};

const getEnv = (name: string) => {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
};

export const getAdminClient = () => {
  return createClient(
    getEnv('SUPABASE_URL'),
    getEnv('APP_SUPABASE_SERVICE_ROLE_KEY'),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
};

export const getUserClient = (authHeader: string) => {
  return createClient(
    getEnv('SUPABASE_URL'),
    getEnv('SUPABASE_ANON_KEY'),
    {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
};

export const getRequester = async (req: Request): Promise<Requester> => {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return { user: null, profile: null };

  const userClient = getUserClient(authHeader);
  const adminClient = getAdminClient();
  const { data, error } = await userClient.auth.getUser();

  if (error || !data.user) return { user: null, profile: null };

  const { data: profile } = await adminClient
    .from('profiles')
    .select('id, display_name, username, role, active')
    .eq('id', data.user.id)
    .maybeSingle();

  return { user: data.user, profile: profile as Profile | null };
};

const authResponse = (message: string, status: number) => {
  return Response.json({ error: message }, { status, headers: corsHeaders });
};

export const requireActiveUser = async (req: Request): Promise<ActiveRequester> => {
  const requester = await getRequester(req);
  if (!requester.user || !requester.profile?.active) {
    throw authResponse('Unauthorized.', 401);
  }
  return {
    user: requester.user,
    profile: requester.profile,
  };
};

export const requireAdmin = async (req: Request) => {
  const requester = await requireActiveUser(req);
  if (requester.profile.role !== 'ADMIN') {
    throw authResponse('Forbidden.', 403);
  }
  return requester;
};
