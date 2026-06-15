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
import { useExpenseCategories } from '@/features/expense-categories/hooks/use-expense-categories';
import { useExpenseMutations } from '@/features/expenses/hooks/use-expense-mutations';
import { useMyCouple } from '@/features/couples/hooks/use-my-couple';
import { getApiErrorMessage } from '@/types/api-error';
import { toDateInputValue } from '@/lib/format';
import type { Expense } from '@/types/expenses';

// Converte campos numéricos opcionais: string vazia se torna `undefined` em
// vez de `0`, permitindo que `.optional()` funcione corretamente no zod.
const optionalNumber = z.preprocess(
  (value) => (value === '' || value === undefined ? undefined : Number(value)),
  z.number().optional(),
);

const expenseSchema = z
  .object({
    description: z.string().min(1, 'Informe uma descrição.').max(255),
    amount: z.coerce.number().positive('O valor deve ser maior que zero.'),
    categoryId: z.string().min(1, 'Selecione uma categoria.'),
    ownership: z.enum(['SHARED', 'INDIVIDUAL']),
    ownerUserId: z.string().optional(),
    sharedSplitPercentageA: optionalNumber,
    sharedSplitPercentageB: optionalNumber,
    dueDate: z.string().min(1, 'Informe a data de vencimento.'),
    installmentTotal: optionalNumber,
  })
  .refine((data) => data.ownership !== 'INDIVIDUAL' || !!data.ownerUserId, {
    message: 'Selecione o responsável pela despesa.',
    path: ['ownerUserId'],
  })
  .refine(
    (data) =>
      data.ownership !== 'SHARED' ||
      (data.sharedSplitPercentageA ?? 0) + (data.sharedSplitPercentageB ?? 0) === 100,
    {
      message: 'A soma dos percentuais deve ser 100%.',
      path: ['sharedSplitPercentageB'],
    },
  );

type ExpenseFormInput = z.input<typeof expenseSchema>;
type ExpenseFormOutput = z.output<typeof expenseSchema>;

interface ExpenseFormProps {
  expense?: Expense;
  onSuccess: () => void;
}

// Formulário compartilhado entre criação e edição de despesas, incluindo
// divisão por percentual (SHARED) ou responsável único (INDIVIDUAL) e
// geração de parcelas na criação.
export function ExpenseForm({ expense, onSuccess }: ExpenseFormProps) {
  const { create, update } = useExpenseMutations();
  const { data: categories } = useExpenseCategories();
  const { data: couple } = useMyCouple();
  const isEditing = !!expense;

  const form = useForm<ExpenseFormInput, unknown, ExpenseFormOutput>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      description: expense?.description ?? '',
      amount: expense?.amount ?? 0,
      categoryId: expense?.categoryId ?? '',
      ownership: expense?.ownership ?? 'SHARED',
      ownerUserId: expense?.ownerUserId ?? undefined,
      sharedSplitPercentageA: expense?.sharedSplitPercentageA ?? 50,
      sharedSplitPercentageB: expense?.sharedSplitPercentageB ?? 50,
      dueDate: expense ? toDateInputValue(expense.dueDate) : '',
      installmentTotal: undefined,
    },
  });

  const ownership = form.watch('ownership');

  async function onSubmit(values: ExpenseFormOutput) {
    const payload = {
      description: values.description,
      amount: values.amount,
      categoryId: values.categoryId,
      dueDate: values.dueDate,
      ownership: values.ownership,
      ...(values.ownership === 'INDIVIDUAL'
        ? { ownerUserId: values.ownerUserId }
        : {
            sharedSplitPercentageA: values.sharedSplitPercentageA,
            sharedSplitPercentageB: values.sharedSplitPercentageB,
          }),
      ...(values.installmentTotal ? { installmentTotal: values.installmentTotal } : {}),
    };

    if (isEditing) {
      await update.mutateAsync({ id: expense.id, payload });
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
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Aluguel" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
            name="dueDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vencimento</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoria</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories?.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="ownership"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Divisão</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a divisão" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="SHARED">Compartilhada</SelectItem>
                  <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {ownership === 'INDIVIDUAL' && (
          <FormField
            control={form.control}
            name="ownerUserId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Responsável</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o responsável" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {couple?.members.map((member) => (
                      <SelectItem key={member.userId} value={member.userId}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {ownership === 'SHARED' && (
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="sharedSplitPercentageA"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>% {couple?.members[0]?.name ?? 'Pessoa A'}</FormLabel>
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
              name="sharedSplitPercentageB"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>% {couple?.members[1]?.name ?? 'Pessoa B'}</FormLabel>
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

        {!isEditing && (
          <FormField
            control={form.control}
            name="installmentTotal"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Parcelas (opcional)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="2"
                    max="360"
                    placeholder="Ex: 12"
                    {...field}
                    value={field.value as number | string | undefined}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {mutation.isError && (
          <p className="text-sm font-medium text-destructive">
            {getApiErrorMessage(mutation.error)}
          </p>
        )}

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {isEditing ? 'Salvar alterações' : 'Adicionar despesa'}
        </Button>
      </form>
    </Form>
  );
}
