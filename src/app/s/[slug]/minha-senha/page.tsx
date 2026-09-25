import { MyTicketClient } from "@/components/queue/my-ticket-client";

type MyTicketPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ t?: string }>;
};

export default async function MyTicketPage({
  params,
  searchParams,
}: MyTicketPageProps) {
  const { slug } = await params;
  const { t } = await searchParams;
  return <MyTicketClient slug={slug} claimToken={t} />;
}
