import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey);

const resolveLoginEmail = async (identifier) => {
  const normalizedIdentifier = identifier.trim();
  const aliasEmail = env.loginAliases[normalizedIdentifier.toLowerCase()];
  if (aliasEmail || normalizedIdentifier.includes('@')) return aliasEmail || normalizedIdentifier;

  const { data, error } = await supabase.functions.invoke('resolve-login', {
    body: {
      identifier: normalizedIdentifier,
    },
  });

  if (error) throw new Error('Invalid login credentials');
  if (!data?.email) throw new Error('Invalid login credentials');

  return data.email;
};

export const toAppUser = (profile, authUser = {}) => {
  const createdAt = profile?.created_at || authUser?.created_at || new Date().toISOString();

  return {
    id: profile?.id || authUser?.id,
    name: profile?.display_name || authUser?.user_metadata?.display_name || authUser?.email || 'User',
    username: profile?.username || authUser?.email || '',
    email: authUser?.email || profile?.email || '',
    role: profile?.role || 'ARTIST',
    active: profile?.active !== false,
    joined: createdAt.slice(0, 7),
  };
};

const fetchProfileForUser = async (authUser) => {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authUser.id)
    .maybeSingle();

  if (error) throw error;
  if (!profile) throw new Error('Profile not found. Please ask an admin to finish account setup.');
  if (profile.active === false) throw new Error('This account is inactive.');

  return toAppUser(profile, authUser);
};

export const getCurrentSessionUser = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  if (!data.session?.user) return null;

  try {
    return await fetchProfileForUser(data.session.user);
  } catch (profileError) {
    await supabase.auth.signOut();
    throw profileError;
  }
};

export const signInWithEmail = async (email, password) => {
  const resolvedEmail = await resolveLoginEmail(email);

  const { data, error } = await supabase.auth.signInWithPassword({
    email: resolvedEmail,
    password,
  });

  if (error) throw error;
  if (!data.user) throw new Error('Sign in failed. Please try again.');

  return fetchProfileForUser(data.user);
};

export const signOutFromSupabase = () => supabase.auth.signOut();

export const fetchProfiles = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('display_name', { ascending: true });

  if (error) throw error;
  return (data || []).map((profile) => toAppUser(profile));
};

const getFunctionErrorMessage = async (error) => {
  if (error?.context instanceof Response) {
    const payload = await error.context.clone().json().catch(() => null);
    return payload?.error || payload?.message || error.message;
  }

  return error?.message || 'Request failed.';
};

export const createAdminUser = async ({ email, password, username, displayName, role }) => {
  const { data, error } = await supabase.functions.invoke('admin-create-user', {
    body: {
      email,
      password,
      username,
      display_name: displayName,
      role,
    },
  });

  if (error) throw new Error(await getFunctionErrorMessage(error));

  return data?.user;
};
