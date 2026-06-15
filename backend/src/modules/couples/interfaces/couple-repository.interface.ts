// Contrato de persistência do agregado Couple (o "casal" em si, sem membros).

export interface CoupleEntity {
  id: string;
  name: string | null;
  createdAt: Date;
}

export const COUPLE_REPOSITORY = Symbol('COUPLE_REPOSITORY');

export interface ICoupleRepository {
  create(): Promise<CoupleEntity>;
  findById(id: string): Promise<CoupleEntity | null>;
}
