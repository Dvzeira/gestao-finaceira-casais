import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useContributionMutations } from '@/features/goals/hooks/use-contribution-mutations';
import { getApiErrorMessage } from '@/types/api-error';

const contributionSchema = z.object({
  amount: z.coerce.number().positive('O valor deve ser maior que zero.'),
  contributedAt: z.string().min(1, 'Informe a data.'),
});

type ContributionFormInput = z.input<typeof contributionSchema>;
type ContributionFormOutput = z.output<typeof contributionSchema>;

interface GoalContributionFormProps {
  goalId: string;
  onSuccess: () => void;
}

// Formulário para registrar uma nova contribuição em uma meta.
export function GoalContributionForm({ goalId, onSuccess }: GoalContributionFormProps) {
  const { add } = useContributionMutations(goalId);

  const form = useForm<ContributionFormInput, unknown, ContributionFormOutput>({
    resolver: zodResolver(contributionSchema),
    defaultValues: { amount: 0, contributedAt: '' },
  });

  async function onSubmit(values: ContributionFormOutput) {
    await add.mutateAsync(values);
    form.reset({ amount: 0, contributedAt: '' });
    onSuccess();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor (R$)</FormLabel>
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
            name="contributedAt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {add.isError && (
          <p className="text-sm font-medium text-destructive">{getApiErrorMessage(add.error)}</p>
        )}

        <Button type="submit" disabled={form.formState.isSubmitting}>
          Registrar contribuição
        </Button>
      </form>
    </Form>
  );
}
