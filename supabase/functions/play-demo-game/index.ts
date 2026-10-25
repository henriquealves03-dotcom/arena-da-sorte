import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://henriquealves03-dotcom.github.io",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
};
function respond(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return respond({ error: "Método não permitido." }, 405);
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return respond({ error: "Faça login para sincronizar os pontos." }, 401);
  const url = Deno.env.get("SUPABASE_URL");
  const publishableKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SECRET_KEY");
  if (!url || !publishableKey || !serviceKey) return respond({ error: "A função ainda precisa de configuração segura no Supabase." }, 503);
  const userClient = createClient(url, publishableKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const adminClient = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  try {
    const token = authHeader.slice("Bearer ".length);
    const { data: { user }, error: authError } = await userClient.auth.getUser(token);
    if (authError || !user) return respond({ error: "Sessão inválida. Entre novamente." }, 401);
    let body: { game?: unknown; choice?: unknown };
    try { body = await req.json(); } catch { return respond({ error: "Pedido inválido." }, 400); }
    const game = body.game, choice = body.choice;
    if (!["roulette", "cards", "dice", "reflex"].includes(String(game))) return respond({ error: "Jogo não permitido para pontuação sincronizada." }, 400);
    if (game === "roulette" && !(Number.isInteger(choice) && Number(choice) >= 1 && Number(choice) <= 7)) return respond({ error: "Escolha inválida para a roleta." }, 400);
    if (game === "dice" && !(Number.isInteger(choice) && Number(choice) >= 1 && Number(choice) <= 6)) return respond({ error: "Escolha inválida para os dados." }, 400);
    if (game !== "roulette" && game !== "dice" && choice !== null && choice !== undefined) return respond({ error: "Este jogo não recebe escolha." }, 400);
    const { data: recent, error: rateError } = await adminClient.from("demo_game_events")
      .select("id,created_at").eq("user_id", user.id)
      .gte("created_at", new Date(Date.now() - 60_000).toISOString())
      .order("created_at", { ascending: false }).limit(20);
    if (rateError) return respond({ error: "Não foi possível validar a rodada." }, 500);
    if ((recent ?? []).length >= 20) return respond({ error: "Limite de 20 rodadas por minuto. Tente novamente em instantes." }, 429);
    if ((recent ?? []).some((event) => Date.now() - new Date(event.created_at).getTime() < 1500)) return respond({ error: "Aguarde um instante antes da próxima rodada." }, 429);
    const { error: eventError } = await adminClient.from("demo_game_events").insert({ user_id: user.id, game });
    if (eventError) return respond({ error: "Não foi possível registrar a rodada." }, 500);
    let outcome: Record<string, number> = {}, points = 0;
    if (game === "roulette") {
      const picked = 1 + Math.floor(Math.random() * 7);
      points = Number(choice) === picked ? 20 : 0; outcome = { picked };
    } else if (game === "cards") {
      const player = 1 + Math.floor(Math.random() * 99), computer = 1 + Math.floor(Math.random() * 99);
      points = player > computer ? 20 : player === computer ? 5 : 0; outcome = { player, computer };
    } else if (game === "dice") {
      const rolled = 1 + Math.floor(Math.random() * 6);
      points = Number(choice) === rolled ? 30 : 0; outcome = { rolled };
    } else {
      outcome = { challenge: 1 + Math.floor(Math.random() * 99) };
      points = 10 + Math.floor(Math.random() * 21);
    }
    if (points > 0) {
      const { error: ledgerError } = await adminClient.from("point_ledger").insert({ user_id: user.id, amount: points, reason: "game_reward_demo" });
      if (ledgerError) return respond({ error: "Não foi possível salvar os pontos. Atualize a página e confira o saldo." }, 500);
    }
    const { data: entries, error: balanceError } = await adminClient.from("point_ledger").select("amount").eq("user_id", user.id);
    if (balanceError) return respond({ error: "Não foi possível carregar o saldo sincronizado." }, 500);
    const balance = (entries ?? []).reduce((sum, entry) => sum + Number(entry.amount), 0);
    return respond({ game, outcome, points, balance, fictional: true });
  } catch {
    return respond({ error: "Erro inesperado ao processar a rodada." }, 500);
  }
});
