import { PageHeader } from '@/components/shared/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExpenseCategoryList } from '@/features/expense-categories/components/expense-category-list';
import { ExpenseList } from '@/features/expenses/components/expense-list';
import { RecurringExpenseList } from '@/features/recurring-expenses/components/recurring-expense-list';

// Página de despesas: abas para despesas do mês, recorrências e categorias.
export function ExpensesPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Despesas" description="Acompanhe despesas, recorrências e categorias do casal." />

      <Tabs defaultValue="expenses">
        <TabsList>
          <TabsTrigger value="expenses">Despesas</TabsTrigger>
          <TabsTrigger value="recurring">Recorrentes</TabsTrigger>
          <TabsTrigger value="categories">Categorias</TabsTrigger>
        </TabsList>
        <TabsContent value="expenses">
          <ExpenseList />
        </TabsContent>
        <TabsContent value="recurring">
          <RecurringExpenseList />
        </TabsContent>
        <TabsContent value="categories">
          <ExpenseCategoryList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
