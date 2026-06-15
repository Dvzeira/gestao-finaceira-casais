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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useIncomeMutations } from '@/features/incomes/hooks/use-income-mutations';
import { getApiErrorMessage } from '@/types/api-error';
import { toDateInputValue } from '@/lib/format';
import type { Income } from '@/types/incomes';

const incomeSchema = z.object({
  type: z.enum(['SALARY', 'EXTRA']),
  description: z.string().min(1, 'Informe uma descrição.').max(255),
  amount: z.coerce.number().positive('O valor deve ser maior que zero.'),
  referenceMonth: z.string().min(1, 'Informe o mês de referência.'),
  receivedAt: z.string().min(1, 'Informe a data de recebimento.'),
});

type IncomeFormInput = z.input<typeof incomeSchema>;
type IncomeFormOutput = z.output<typeof incomeSchema>;

interface IncomeFormProps {
  income?: Income;
  onSuccess: () => void;
}

// Formulário compartilhado entre criação e edição de receitas.
export function IncomeForm({ income, onSuccess }: IncomeFormProps) {
  const { create, update } = useIncomeMutations();
  const isEditing = !!income;
  const mutation = isEditing ? update : create;

  const form = useForm<IncomeFormInput, unknown, IncomeFormOutput>({
    resolver: zodResolver(incomeSchema),
    defaultValues: {
      type: income?.type ?? 'SALARY',
      description: income?.description ?? '',
      amount: income?.amount ?? 0,
      referenceMonth: income ? toDateInputValue(income.referenceMonth).slice(0, 7) : '',
      receivedAt: income ? toDateInputValue(income.receivedAt) : '',
    },
  });

  async function onSubmit(values: IncomeFormOutput) {
    const payload = {
      type: values.type,
      description: values.description,
      amount: values.amount,
      referenceMonth: `${values.referenceMonth}-01`,
      receivedAt: values.receivedAt,
    };

    if (isEditing) {
      await update.mutateAsync({ id: income.id, payload });
    } else {
      await create.mutateAsync(payload);
    }
    onSuccess();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="SALARY">Salário</SelectItem>
                  <SelectItem value="EXTRA">Extra</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Salário de junho" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
          name="referenceMonth"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mês de referência</FormLabel>
              <FormControl>
                <Input type="month" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="receivedAt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data de recebimento</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {mutation.isError && (
          <p className="text-sm font-medium text-destructive">
            {getApiErrorMessage(mutation.error)}
          </p>
        )}

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {isEditing ? 'Salvar alterações' : 'Adicionar receita'}
        </Button>
      </form>
    </Form>
  );
}
