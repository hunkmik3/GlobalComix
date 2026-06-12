const requiredEnv = (name) => {
  const value = import.meta.env[name];

  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }

  throw new Error(
    `Missing required env var: ${name}. Copy .env.example to .env.local and restart the dev server.`,
  );
};

const optionalEnv = (name, fallback) => {
  const value = import.meta.env[name];
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
};

const parseLoginAliases = (value) => {
  if (!value) return {};

  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .reduce((aliases, entry) => {
      const separatorIndex = entry.indexOf('=');
      if (separatorIndex === -1) return aliases;

      const alias = entry.slice(0, separatorIndex).trim().toLowerCase();
      const email = entry.slice(separatorIndex + 1).trim();
      if (alias && email) aliases[alias] = email;

      return aliases;
    }, {});
};

export const env = Object.freeze({
  appName: optionalEnv('VITE_APP_NAME', 'GlobalComix Panel Tracker'),
  loginAliases: parseLoginAliases(optionalEnv('VITE_LOGIN_ALIASES', '')),
  storagePrefix: optionalEnv('VITE_STORAGE_PREFIX', 'globalcomix_panel_tracker'),
  supabaseUrl: requiredEnv('VITE_SUPABASE_URL'),
  supabaseAnonKey: requiredEnv('VITE_SUPABASE_ANON_KEY'),
});
