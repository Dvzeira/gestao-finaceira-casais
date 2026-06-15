import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useGoalMutations } from '@/features/goals/hooks/use-goal-mutations';
import { useMyCouple } from '@/features/couples/hooks/use-my-couple';
import { getApiErrorMessage } from '@/types/api-error';
import { toDateInputValue } from '@/lib/format';
import type { Goal } from '@/types/goals';

const goalSchema = z
  .object({
    title: z.string().min(1, 'Informe um título.').max(255),
    targetAmount: z.coerce.number().positive('O valor deve ser maior que zero.'),
    targetDate: z.string().min(1, 'Informe a data alvo.'),
    splitPercentageA: z.coerce.number().min(0).max(100),
    splitPercentageB: z.coerce.number().min(0).max(100),
  })
  .refine((data) => data.splitPercentageA + data.splitPercentageB === 100, {
    message: 'A soma dos percentuais deve ser 100%.',
    path: ['splitPercentageB'],
  });

type GoalFormInput = z.input<typeof goalSchema>;
type GoalFormOutput = z.output<typeof goalSchema>;

interface GoalFormProps {
  goal?: Goal;
  onSuccess: () => void;
}

// Formulário compartilhado entre criação e edição de metas, incluindo a
// divisão de contribuição por percentual entre os membros do casal.
export function GoalForm({ goal, onSuccess }: GoalFormProps) {
  const { create, update } = useGoalMutations();
  const { data: couple } = useMyCouple();
  const isEditing = !!goal;
  const hasSecondMember = (couple?.members.length ?? 0) > 1;

  const percentageFor = (index: number) => {
    const userId = couple?.members[index]?.userId;
    return goal?.splits.find((split) => split.userId === userId)?.percentage ?? (index === 0 ? 50 : 50);
  };

  const form = useForm<GoalFormInput, unknown, GoalFormOutput>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      title: goal?.title ?? '',
      targetAmount: goal?.targetAmount ?? 0,
      targetDate: goal ? toDateInputValue(goal.targetDate) : '',
      splitPercentageA: goal ? percentageFor(0) : 50,
      splitPercentageB: goal ? percentageFor(1) : 50,
    },
  });

  async function onSubmit(values: GoalFormOutput) {
    const members = couple?.members ?? [];
    const splits = hasSecondMember
      ? [
          { userId: members[0].userId, percentage: values.splitPercentageA },
          { userId: members[1].userId, percentage: values.splitPercentageB },
        ]
      : [{ userId: members[0].userId, percentage: 100 }];

    const payload = {
      title: values.title,
      targetAmount: values.targetAmount,
      targetDate: values.targetDate,
      splits,
    };

    if (isEditing) {
      await update.mutateAsync({ id: goal.id, payload });
    } else {
      await create.mutateAsync(payload);
    }
    onSuccess();
  }

  const mutation = isEditing ? update : create;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Viagem para a praia" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="targetAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor alvo (R$)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    {...field}
                    value={field.value as number | string}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="targetDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data alvo</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {hasSecondMember && (
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="splitPercentageA"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>% {couple?.members[0]?.name}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      {...field}
                      value={field.value as number | string}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="splitPercentageB"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>% {couple?.members[1]?.name}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      {...field}
                      value={field.value as number | string}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {mutation.isError && (
          <p className="text-sm font-medium text-destructive">
            {getApiErrorMessage(mutation.error)}
          </p>
        )}

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {isEditing ? 'Salvar alterações' : 'Criar meta'}
        </Button>
      </form>
    </Form>
  );
}
