export interface RedirectUrl {
  charge_point_id: string,
  connector_id: number,
  time: number,
}

export function isRedirectUrlExpired(redirectUrl: RedirectUrl): boolean {
  return Date.now() - redirectUrl.time > 900000;
}
