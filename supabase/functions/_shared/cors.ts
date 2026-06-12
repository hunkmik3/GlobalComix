export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

export const handleOptions = (req: Request) => {
  if (req.method !== 'OPTIONS') return null;
  return new Response('ok', { headers: corsHeaders });
};

export const jsonResponse = (body: unknown, status = 200) => {
  return Response.json(body, {
    status,
    headers: corsHeaders,
  });
};

export const errorResponse = (message: string, status = 400) => {
  return jsonResponse({ error: message }, status);
};
