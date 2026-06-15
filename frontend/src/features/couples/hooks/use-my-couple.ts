import { useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { getMyCouple } from '@/features/couples/services/couples.api';

// Retorna o casal do usuário autenticado. Quando o usuário ainda não
// pertence a um casal, o backend responde 404 — tratamos como "sem casal"
// em vez de erro, para a UI mostrar o convite de parceiro(a).
export function useMyCouple() {
  return useQuery({
    queryKey: ['couples', 'me'],
    queryFn: async () => {
      try {
        return await getMyCouple();
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 404) {
          return null;
        }
        throw error;
      }
    },
  });
}
