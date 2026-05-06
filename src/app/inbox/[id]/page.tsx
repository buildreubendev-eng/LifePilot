import { InboxDetailView } from "@/components/InboxDetailView";

export default async function InboxDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <InboxDetailView id={id} />;
}
