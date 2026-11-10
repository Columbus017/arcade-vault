import { createClient } from '@/lib/supabase/client';
export interface ScoreRow {
  id: number;
  game_id: string;
  player_name: string;
  score: number;
  created_at: string; // ISO
}
export async function submitScore(input: {
  gameId: string;
  playerName: string;
  score: number;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const supabase = createClient();
    const { error } = await supabase.from('scores').insert({
      game_id: input.gameId,
      player_name: input.playerName.trim(),
      score: input.score,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Unknown error',
    };
  }
}
export async function getTopScores(
  gameId: string,
  limit = 10,
): Promise<ScoreRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('scores')
    .select('id, game_id, player_name, score, created_at')
    .eq('game_id', gameId)
    .order('score', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as ScoreRow[];
}
