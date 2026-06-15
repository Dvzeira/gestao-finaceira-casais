import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PageHeader } from '@/components/shared/page-header';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useMyCouple } from '@/features/couples/hooks/use-my-couple';
import { InvitePartnerCard } from '@/features/couples/components/invite-partner-card';
import { PendingInvitesCard } from '@/features/couples/components/pending-invites-card';
import { FinancialSummaryCard } from '@/features/dashboard/components/financial-summary-card';
import { GoalsOverviewCard } from '@/features/dashboard/components/goals-overview-card';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : '';
  return `${first}${last}`.toUpperCase();
}

export function DashboardPage() {
  const { userId } = useAuth();
  const { data: couple, isLoading } = useMyCouple();

  const currentMember = couple?.members.find((member) => member.userId === userId);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>;
  }

  if (!couple) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Dashboard" description="Acompanhe as finanças do casal em um só lugar." />
        <PendingInvitesCard />
        <InvitePartnerCard />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={currentMember ? `Olá, ${currentMember.name.split(' ')[0]}` : 'Dashboard'}
        description="Acompanhe as finanças do casal em um só lugar."
      />

      <FinancialSummaryCard />

      <GoalsOverviewCard />

      <Card>
        <CardHeader>
          <CardTitle>Seu casal</CardTitle>
          <CardDescription>{couple.name ?? 'Casal sem nome definido'}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {couple.members.map((member) => (
            <div
              key={member.userId}
              className="flex items-center justify-between gap-4 rounded-md border border-border p-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  {getInitials(member.name)}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{member.name}</p>
                  <p className="text-xs text-muted-foreground">{member.email}</p>
                </div>
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                {member.role === 'OWNER' ? 'Responsável' : 'Membro'}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
