import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { useExpenseCategoryMutations } from '@/features/expense-categories/hooks/use-expense-category-mutations';
import { getApiErrorMessage } from '@/types/api-error';

const categorySchema = z.object({
  name: z.string().min(1, 'Informe um nome.').max(50),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

// Formulário simples para criar uma nova categoria de despesa.
export function ExpenseCategoryForm() {
  const { create } = useExpenseCategoryMutations();

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: '' },
  });

  async function onSubmit(values: CategoryFormValues) {
    await create.mutateAsync(values);
    form.reset();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-2">
        <div className="flex items-start gap-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Input placeholder="Nova categoria" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={form.formState.isSubmitting}>
            Adicionar
          </Button>
        </div>
        {create.isError && (
          <p className="text-sm font-medium text-destructive">{getApiErrorMessage(create.error)}</p>
        )}
      </form>
    </Form>
  );
}
