// Template for src/environments/environment.development.ts, which is
// gitignored because it holds real Firebase credentials.
//
// Setup:
//   cp src/environments/environment.development.example.ts \
//      src/environments/environment.development.ts
// then fill in firebaseConfig with the values from the Firebase console.
//
// Keep the keys here in step with environment.ts - a key present there and
// missing from the development file fails the build with TS2339, since both
// files must satisfy the same shape.

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
  locations: '/locations',
  transactionInfo: '/transactions/info/',
  transactionsList: '/transactions/list',
  recentChargePoints: '/transactions/recent',
  wsUrl: 'wss://wattbrews.me/ws',
  sendCommand: '/csc',
  report: '/report',
  monthReport: '/month',
  userReport: '/user',
  chargerReport: '/charger',
  uptimeReport: '/uptime',
  statusReport: '/status',
  exportReport: '/export',
  powerReport: '/power',
  mailSubscriptions: '/mail/subscriptions',
  paymentRetries: '/payment/retries',
  debug: true,
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
