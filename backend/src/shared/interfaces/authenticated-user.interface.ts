// Formato do usuário anexado a `request.user` pelo JwtStrategy após validar
// o access token.
export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
}
