import { SessionEntryClient } from "@/components/queue/session-entry-client";

type SessionEntryPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ t?: string }>;
};

export default async function SessionEntryPage({
  params,
  searchParams,
}: SessionEntryPageProps) {
  const { slug } = await params;
  const { t } = await searchParams;
  return <SessionEntryClient slug={slug} claimToken={t} />;
}
