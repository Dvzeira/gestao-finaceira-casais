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
import { useRecurringExpenseMutations } from '@/features/recurring-expenses/hooks/use-recurring-expense-mutations';
import { useMyCouple } from '@/features/couples/hooks/use-my-couple';
import { getApiErrorMessage } from '@/types/api-error';
import { toDateInputValue } from '@/lib/format';
import type { RecurringExpense } from '@/types/recurring-expenses';

// Converte campos numéricos opcionais: string vazia se torna `undefined` em
// vez de `0`, permitindo que `.optional()` funcione corretamente no zod.
const optionalNumber = z.preprocess(
  (value) => (value === '' || value === undefined ? undefined : Number(value)),
  z.number().optional(),
);

const recurringExpenseSchema = z
  .object({
    templateDescription: z.string().min(1, 'Informe uma descrição.').max(255),
    amount: z.coerce.number().positive('O valor deve ser maior que zero.'),
    categoryId: z.string().min(1, 'Selecione uma categoria.'),
    ownership: z.enum(['SHARED', 'INDIVIDUAL']),
    ownerUserId: z.string().optional(),
    sharedSplitPercentageA: optionalNumber,
    sharedSplitPercentageB: optionalNumber,
    frequency: z.enum(['WEEKLY', 'MONTHLY', 'YEARLY']),
    dayOfMonth: optionalNumber,
    startDate: z.string().min(1, 'Informe a data de início.'),
    endDate: z.string().optional(),
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
  )
  .refine(
    (data) =>
      data.frequency === 'WEEKLY' ||
      (data.dayOfMonth !== undefined && data.dayOfMonth >= 1 && data.dayOfMonth <= 31),
    {
      message: 'Informe o dia do mês (1-31).',
      path: ['dayOfMonth'],
    },
  );

type RecurringExpenseFormInput = z.input<typeof recurringExpenseSchema>;
type RecurringExpenseFormOutput = z.output<typeof recurringExpenseSchema>;

interface RecurringExpenseFormProps {
  recurringExpense?: RecurringExpense;
  onSuccess: () => void;
}

// Formulário compartilhado entre criação e edição de despesas recorrentes.
export function RecurringExpenseForm({ recurringExpense, onSuccess }: RecurringExpenseFormProps) {
  const { create, update } = useRecurringExpenseMutations();
  const { data: categories } = useExpenseCategories();
  const { data: couple } = useMyCouple();
  const isEditing = !!recurringExpense;

  const form = useForm<RecurringExpenseFormInput, unknown, RecurringExpenseFormOutput>({
    resolver: zodResolver(recurringExpenseSchema),
    defaultValues: {
      templateDescription: recurringExpense?.templateDescription ?? '',
      amount: recurringExpense?.amount ?? 0,
      categoryId: recurringExpense?.categoryId ?? '',
      ownership: recurringExpense?.ownership ?? 'SHARED',
      ownerUserId: recurringExpense?.ownerUserId ?? undefined,
      sharedSplitPercentageA: recurringExpense?.sharedSplitPercentageA ?? 50,
      sharedSplitPercentageB: recurringExpense?.sharedSplitPercentageB ?? 50,
      frequency: recurringExpense?.frequency ?? 'MONTHLY',
      dayOfMonth: recurringExpense?.dayOfMonth ?? 1,
      startDate: recurringExpense ? toDateInputValue(recurringExpense.startDate) : '',
      endDate: recurringExpense?.endDate ? toDateInputValue(recurringExpense.endDate) : undefined,
    },
  });

  const ownership = form.watch('ownership');
  const frequency = form.watch('frequency');

  async function onSubmit(values: RecurringExpenseFormOutput) {
    const payload = {
      templateDescription: values.templateDescription,
      amount: values.amount,
      categoryId: values.categoryId,
      ownership: values.ownership,
      ...(values.ownership === 'INDIVIDUAL'
        ? { ownerUserId: values.ownerUserId }
        : {
            sharedSplitPercentageA: values.sharedSplitPercentageA,
            sharedSplitPercentageB: values.sharedSplitPercentageB,
          }),
      frequency: values.frequency,
      ...(values.frequency !== 'WEEKLY' ? { dayOfMonth: values.dayOfMonth } : {}),
      startDate: values.startDate,
      ...(values.endDate ? { endDate: values.endDate } : {}),
    };

    if (isEditing) {
      await update.mutateAsync({ id: recurringExpense.id, payload });
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
          name="templateDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Assinatura streaming" {...field} />
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
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoria</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
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
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="frequency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Frequência</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="WEEKLY">Semanal</SelectItem>
                    <SelectItem value="MONTHLY">Mensal</SelectItem>
                    <SelectItem value="YEARLY">Anual</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {frequency !== 'WEEKLY' && (
            <FormField
              control={form.control}
              name="dayOfMonth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dia do mês</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      max="31"
                      {...field}
                      value={field.value as number | string}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Início</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Término (opcional)</FormLabel>
                <FormControl>
                  <Input type="date" {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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

        {mutation.isError && (
          <p className="text-sm font-medium text-destructive">
            {getApiErrorMessage(mutation.error)}
          </p>
        )}

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {isEditing ? 'Salvar alterações' : 'Adicionar recorrência'}
        </Button>
      </form>
    </Form>
  );
}
