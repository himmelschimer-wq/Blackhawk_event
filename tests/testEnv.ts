// Ensure test environment variables are initialized before any server modules load
process.env.NODE_ENV = 'test';

if (!process.env.SUPABASE_URL) {
  process.env.SUPABASE_URL = 'https://test-placeholder.supabase.co';
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-placeholder-service-role-key-never-use-in-prod';
}
if (!process.env.DISCORD_CLIENT_ID) {
  process.env.DISCORD_CLIENT_ID = '123456789012345678';
}
if (!process.env.DISCORD_REDIRECT_URI) {
  process.env.DISCORD_REDIRECT_URI = 'https://blackhawk.gg/api/auth/discord/callback';
}
