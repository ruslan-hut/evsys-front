export const environment = {
  apiUrl: 'https://wattbrews.me/api/v1',
  admin: 'admin',
  operator: 'operator',
  config: '/config/',
  readSysLog: '/log/sys',
  readBackLog: '/log/back',
  readPayLog: '/log/pay',
  chargePointList: '/chp',
  chargePoint: '/point/',
  transactionInfo: '/transactions/info/',
  wsUrl: 'wss://wattbrews.me/ws',
  sendCommand: '/csc',
  debug: false,
  firebaseConfig: {
    apiKey: "fb-api-key",
    authDomain: "fb-auth-domain",
    projectId: "fb-project-id",
    storageBucket: "fb-storage-bucket",
    messagingSenderId: "fb-messaging-sender-id",
    appId: "fb-app-id",
    measurementId: "fb-measurement-id"
  },
};
