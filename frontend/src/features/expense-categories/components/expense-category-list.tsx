import { AlertCircle, Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/empty-state';
import { ExpenseCategoryForm } from '@/features/expense-categories/components/expense-category-form';
import { useExpenseCategories } from '@/features/expense-categories/hooks/use-expense-categories';
import { useExpenseCategoryMutations } from '@/features/expense-categories/hooks/use-expense-category-mutations';

// Tela de gerenciamento de categorias de despesa: lista categorias do casal
// (e globais) e permite criar/excluir categorias próprias.
export function ExpenseCategoryList() {
  const { data: categories, isLoading, isError } = useExpenseCategories();
  const { remove } = useExpenseCategoryMutations();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Categorias de despesa</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <ExpenseCategoryForm />

        {isLoading && <p className="text-sm text-muted-foreground">Carregando categorias...</p>}
        {isError && (
          <EmptyState
            icon={AlertCircle}
            title="Não foi possível carregar as categorias"
            description="Tente novamente mais tarde."
          />
        )}

        <div className="flex flex-wrap gap-2">
          {categories?.map((category) => (
            <Badge key={category.id} variant="outline" className="gap-1 py-1 pl-2.5 pr-1">
              {category.name}
              {category.coupleId && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-4"
                  aria-label={`Excluir categoria ${category.name}`}
                  disabled={remove.isPending}
                  onClick={() => remove.mutate(category.id)}
                >
                  <Trash2 className="size-3" />
                </Button>
              )}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
