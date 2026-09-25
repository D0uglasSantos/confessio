import { PriestPanelClient } from "@/components/priest/priest-panel-client";

type PriestPageProps = {
  params: Promise<{ stationId: string }>;
  searchParams: Promise<{ token?: string }>;
};

export default async function PriestPage({
  params,
  searchParams,
}: PriestPageProps) {
  const { stationId } = await params;
  const { token } = await searchParams;

  return (
    <PriestPanelClient
      stationId={stationId}
      accessToken={token && token.length > 0 ? token : null}
    />
  );
}
