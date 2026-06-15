import { http } from '@/lib/http';
import type {
  AcceptInviteResponse,
  Couple,
  CoupleInvite,
  PendingInvite,
} from '@/types/couples';

export async function getMyCouple(): Promise<Couple> {
  const { data } = await http.get<Couple>('/couples/me');
  return data;
}

export async function listMyInvites(): Promise<PendingInvite[]> {
  const { data } = await http.get<PendingInvite[]>('/couples/invites');
  return data;
}

export async function sendInvite(inviteeEmail: string): Promise<CoupleInvite> {
  const { data } = await http.post<CoupleInvite>('/couples/invite', {
    inviteeEmail,
  });
  return data;
}

export async function acceptInvite(token: string): Promise<AcceptInviteResponse> {
  const { data } = await http.post<AcceptInviteResponse>(
    `/couples/invites/${token}/accept`,
  );
  return data;
}

export async function rejectInvite(token: string): Promise<void> {
  await http.post(`/couples/invites/${token}/reject`);
}
