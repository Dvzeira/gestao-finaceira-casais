import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useMyInvites } from '@/features/couples/hooks/use-my-invites';
import { acceptInvite, rejectInvite } from '@/features/couples/services/couples.api';

// Lista convites pendentes recebidos pelo usuário autenticado, permitindo
// aceitar (formando o casal) ou rejeitar cada convite.
export function PendingInvitesCard() {
  const { data: invites, isLoading } = useMyInvites();
  const queryClient = useQueryClient();

  const accept = useMutation({
    mutationFn: acceptInvite,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['couples'] }),
  });

  const reject = useMutation({
    mutationFn: rejectInvite,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['couples'] }),
  });

  if (isLoading || !invites || invites.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Convites recebidos</CardTitle>
        <CardDescription>
          Aceite um convite para formar seu casal financeiro.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {invites.map((invite) => (
          <div
            key={invite.id}
            className="flex items-center justify-between rounded-md border border-border p-3"
          >
            <div>
              <p className="text-sm font-medium text-foreground">
                Convite de {invite.inviterName}
              </p>
              <p className="text-xs text-muted-foreground">
                Expira em {new Date(invite.expiresAt).toLocaleDateString('pt-BR')}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={reject.isPending}
                onClick={() => reject.mutate(invite.token)}
              >
                Rejeitar
              </Button>
              <Button
                size="sm"
                disabled={accept.isPending}
                onClick={() => accept.mutate(invite.token)}
              >
                Aceitar
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
