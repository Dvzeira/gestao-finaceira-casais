import { useQuery } from '@tanstack/react-query';
import { listMyInvites } from '@/features/couples/services/couples.api';

export function useMyInvites() {
  return useQuery({
    queryKey: ['couples', 'invites'],
    queryFn: listMyInvites,
  });
}
