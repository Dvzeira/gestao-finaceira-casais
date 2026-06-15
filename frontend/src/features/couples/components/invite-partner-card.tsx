import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { sendInvite } from '@/features/couples/services/couples.api';
import { getApiErrorMessage } from '@/types/api-error';

const inviteSchema = z.object({
  inviteeEmail: z.string().email('Informe um e-mail válido.'),
});

type InviteFormValues = z.infer<typeof inviteSchema>;

// Exibido quando o usuário autenticado ainda não pertence a um casal:
// permite convidar o(a) parceiro(a) por e-mail para formar o casal.
export function InvitePartnerCard() {
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState<string | null>(null);

  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { inviteeEmail: '' },
  });

  const mutation = useMutation({
    mutationFn: sendInvite,
    onSuccess: (invite) => {
      setFeedback(`Convite enviado para ${invite.inviteeEmail}.`);
      form.reset();
      void queryClient.invalidateQueries({ queryKey: ['couples'] });
    },
    onError: (error) => {
      setFeedback(getApiErrorMessage(error));
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Convide seu(sua) parceiro(a)</CardTitle>
        <CardDescription>
          Você ainda não faz parte de um casal. Envie um convite por e-mail
          para começar a organizar as finanças juntos.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) => mutation.mutate(values.inviteeEmail))}
            className="flex flex-col gap-4 sm:flex-row sm:items-end"
          >
            <FormField
              control={form.control}
              name="inviteeEmail"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>E-mail do(a) parceiro(a)</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="parceiro@email.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Enviando...' : 'Enviar convite'}
            </Button>
          </form>
        </Form>

        {feedback && <p className="mt-3 text-sm text-muted-foreground">{feedback}</p>}
      </CardContent>
    </Card>
  );
}
