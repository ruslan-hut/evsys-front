export interface WsMessage {
  status: string;
  stage?: string;
  info?: string;
  progress?: number;
  id?: number;
  data?: string;
}
