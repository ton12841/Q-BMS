import ActivationPageClient from "@/modules/auth/components/ActivationPageClient";

export default async function ActivateInvitationPage({
  params,
}: {
  params: Promise<{inviteId: string}>;
}) {
  const {inviteId} = await params;
  return <ActivationPageClient invitationPublicId={inviteId} />;
}
