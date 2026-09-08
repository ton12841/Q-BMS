import ActivationPageClient from "@/modules/auth/components/ActivationPageClient";

export default async function ActivatePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const rawInvite = params.invite;
  const invitationPublicId = Array.isArray(rawInvite) ? rawInvite[0] || "" : rawInvite || "";

  return <ActivationPageClient invitationPublicId={invitationPublicId} />;
}
