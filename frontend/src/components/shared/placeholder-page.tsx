import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface PlaceholderPageProps {
  title: string;
  description: string;
}

// Tela provisória para áreas ainda não implementadas, mantendo a navegação
// principal funcional enquanto as features são desenvolvidas.
export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Em construção.</p>
      </CardContent>
    </Card>
  );
}
