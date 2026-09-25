import { TvBoardClient } from "@/components/tv/tv-board-client";

type TvPageProps = {
  params: Promise<{ sessionSlug: string }>;
};

export default async function TvPage({ params }: TvPageProps) {
  const { sessionSlug } = await params;
  return <TvBoardClient slug={sessionSlug} />;
}
