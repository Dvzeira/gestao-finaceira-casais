// Formato aceito para JWT_*_EXPIRES_IN (ex: "15m", "7d"), compatível com o
// tipo `StringValue` esperado por JwtSignOptions.expiresIn.
export type JwtDuration = `${number}${'s' | 'm' | 'h' | 'd'}`;
