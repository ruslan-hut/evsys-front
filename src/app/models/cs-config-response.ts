export interface CsConfigResponse {
  configurationKey: ConfigKey[],
}

export interface ConfigKey{
  key: string,
  readonly?: boolean,
  value: string,
  loading?: boolean,
}



