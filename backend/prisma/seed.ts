import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Categorias globais (coupleId = null) oferecidas a todos os casais por padrão.
const DEFAULT_EXPENSE_CATEGORIES: Array<{ name: string; icon: string; color: string }> = [
  { name: 'Moradia', icon: 'home', color: '#2563eb' },
  { name: 'Alimentação', icon: 'utensils', color: '#16a34a' },
  { name: 'Transporte', icon: 'car', color: '#f97316' },
  { name: 'Saúde', icon: 'heart-pulse', color: '#dc2626' },
  { name: 'Educação', icon: 'graduation-cap', color: '#7c3aed' },
  { name: 'Lazer', icon: 'party-popper', color: '#db2777' },
  { name: 'Vestuário', icon: 'shirt', color: '#0891b2' },
  { name: 'Assinaturas', icon: 'repeat', color: '#9333ea' },
  { name: 'Investimentos', icon: 'trending-up', color: '#059669' },
  { name: 'Outros', icon: 'more-horizontal', color: '#6b7280' },
];

async function seedExpenseCategories(): Promise<void> {
  for (const category of DEFAULT_EXPENSE_CATEGORIES) {
    const existing = await prisma.expenseCategory.findFirst({
      where: { coupleId: null, name: category.name },
    });

    if (existing) {
      continue;
    }

    await prisma.expenseCategory.create({
      data: {
        coupleId: null,
        name: category.name,
        icon: category.icon,
        color: category.color,
      },
    });
  }
}

async function main(): Promise<void> {
  await seedExpenseCategories();
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
