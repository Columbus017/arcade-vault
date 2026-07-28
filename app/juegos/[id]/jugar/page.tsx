import { notFound } from "next/navigation";
import { GAMES } from "@/lib/games";
import { PlayerScreen } from "@/components/PlayerScreen";

export default async function PlayerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const game = GAMES.find((g) => g.id === id);
  if (!game) notFound();

  return <PlayerScreen game={game} />;
}
