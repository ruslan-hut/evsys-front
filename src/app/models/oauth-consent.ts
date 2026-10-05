/** A pending MCP client authorization, as the backend describes it to the consent page. */
export interface OAuthConsent {
  request_id: string;
  client_id: string;
  client_name: string;
  redirect_uri: string;
  redirect_host: string;
  scope: string;
  resource: string;
  expires_at: string;
  username: string;
  /** False when the code goes somewhere other than Claude or a local app: the client name is then unverified. */
  known_client: boolean;
  can_approve: boolean;
}

/** Where the browser goes after a decision: the MCP client, carrying the code or the error. */
export interface OAuthRedirect {
  redirect_url: string;
}
