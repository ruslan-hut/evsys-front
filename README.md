# EVSys Front - Electric Vehicle Charging Station Management System

A comprehensive web-based platform for managing electric vehicle (EV) charging stations, built with Angular and Firebase. This system provides real-time monitoring, configuration, and management of charging points and their connectors.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Development](#development)
- [Build](#build)
- [Project Structure](#project-structure)
- [Key Components](#key-components)
- [Services](#services)

## 🎯 Overview

EVSys Front is a frontend application designed for managing electric vehicle charging infrastructure. It enables operators to monitor charging sessions, manage charge points, configure connectors, track transactions, and analyze usage statistics in real-time.

## ✨ Features

### Charge Point Management
- **Real-time Monitoring**: Live status updates of charging stations via WebSocket
- **Configuration Management**: Configure charge point settings and parameters
- **Connector Control**: Manage individual connectors and their configurations
- **Command Interface**: Send commands to charging stations (start/stop, reset, etc.)

### Transaction Management
- **Session Tracking**: Monitor active and historical charging sessions
- **Transaction Details**: View detailed information about each charging transaction
- **Meter Values**: Track energy consumption and power metrics

### User Management
- **User Profiles**: Manage user accounts and profiles
- **Authentication**: Firebase-based authentication system
- **User Tags**: RFID tag management for charging access
- **Payment Methods**: Manage user payment information

### Analytics & Reporting
- **Statistics Dashboard**: View usage statistics and trends
- **Monthly Reports**: Analyze charging patterns by month
- **User Statistics**: Track individual user consumption data

### Tariff Management
- **Pricing Plans**: Configure and manage tariff structures
- **Payment Plans**: Set up different payment options

### Logging & Monitoring
- **System Logs**: Comprehensive logging of system events
- **Error Tracking**: Real-time error monitoring and reporting
- **Message Logging**: Track all system messages and communications

## 🛠️ Technology Stack

- **Framework**: Angular 18.1.0
- **UI Library**: Angular Material 18.1.0
- **Authentication**: Firebase 10.7.2 with FirebaseUI 6.1.0
- **Real-time Communication**: WebSocket
- **Language**: TypeScript 5.4.5
- **Reactive Programming**: RxJS 7.8.0
- **Build Tool**: Angular CLI 18.1.0

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 18.x or higher
- **npm**: Version 9.x or higher
- **Angular CLI**: Version 18.x

```bash
npm install -g @angular/cli@18
```

## 🚀 Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd evsys-front
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment**

Update the environment files with your configuration:
- `src/environments/environment.ts` (production)
- `src/environments/environment.development.ts` (development)

Configure Firebase credentials, API endpoints, and WebSocket URLs.

## 💻 Development

### Development Server

Run the development server:

```bash
npm start
# or
ng serve
```

Navigate to `http://localhost:4200/`. The application will automatically reload when you make changes to the source files.

### Watch Mode

Build and watch for changes:

```bash
npm run watch
```

### Code Scaffolding

Generate a new component:
```bash
ng generate component component-name
```

Generate other Angular elements:
```bash
ng generate directive|pipe|service|class|guard|interface|enum|module
```

## 🏗️ Build

### Development Build
```bash
ng build
```

### Production Build
```bash
ng build --configuration production
```

Build artifacts will be stored in the `dist/` directory.

## 📁 Project Structure

```
src/
├── app/
│   ├── components/          # UI Components
│   │   ├── chargepoint/     # Charge point components
│   │   ├── connector/       # Connector components
│   │   ├── transaction-*/   # Transaction management
│   │   ├── user/            # User management
│   │   ├── user-profile/    # User profile components
│   │   ├── logs/            # Logging interface
│   │   ├── statistic/       # Analytics dashboard
│   │   ├── tariff/          # Tariff management
│   │   ├── promo/           # Promotional features
│   │   ├── dialogs/         # Dialog components
│   │   ├── modal/           # Modal components
│   │   └── ui/              # Shared UI components
│   ├── service/             # Application Services
│   │   ├── account.service.ts
│   │   ├── chargepoint.service.ts
│   │   ├── transaction.service.ts
│   │   ├── websocket.service.ts
│   │   ├── firebase.service.ts
│   │   └── ...
│   ├── models/              # TypeScript Interfaces & Models
│   │   ├── chargepoint.ts
│   │   ├── connector.ts
│   │   ├── transaction.ts
│   │   ├── user.ts
│   │   └── ...
│   ├── helpers/             # Guards & Interceptors
│   │   ├── auth.guard.ts
│   │   ├── error.interceptor.ts
│   │   └── token.interceptor.ts
│   ├── pipes/               # Custom Pipes
│   └── app-routing.module.ts
├── assets/                  # Static Assets
│   ├── icons/              # SVG icons
│   ├── company-en.json     # Company information
│   ├── privacy-*.json      # Privacy policies
│   └── terms-*.json        # Terms of service
└── environments/           # Environment Configurations
```

## 🧩 Key Components

### Charge Point Components
- **ChargePointComponent**: Display individual charge point details
- **ChargePointListComponent**: List and filter charge points
- **ChargePointFormComponent**: Create/edit charge points
- **ChargePointConfigComponent**: Configure charge point settings
- **ChargePointInfoComponent**: View detailed charge point information
- **ChargePointScreenComponent**: Real-time monitoring screen

### Connector Components
- **ConnectorComponent**: Display connector status and details
- **ConnectorFormComponent**: Configure connectors
- **ConnectorInfoComponent**: Detailed connector information

### Transaction Components
- **TransactionInfoComponent**: View transaction details
- **TransactionScreenComponent**: Monitor active transactions

### User Components
- **UserComponent**: User management interface
- **UserProfileComponent**: User profile management

## 🔧 Services

### Core Services

- **ChargepointService**: Manage charge point data and operations
- **TransactionService**: Handle charging transactions
- **WebsocketService**: Real-time communication with backend
- **AccountService**: User account management
- **FirebaseService**: Firebase authentication and data
- **TariffService**: Tariff and pricing management
- **StatsService**: Statistics and analytics
- **LocalStorageService**: Browser storage management
- **ErrorService**: Error handling and reporting
- **LoggerService**: Application logging
- **ModalService**: Modal dialog management
- **TimeService**: Time and date utilities

## 🔐 Authentication

The application uses Firebase Authentication with the following features:
- Email/password authentication
- OAuth providers (configurable)
- Token-based API authentication
- Route guards for protected pages
- Automatic token refresh

## 📡 Real-time Communication

WebSocket integration provides:
- Live charge point status updates
- Real-time transaction monitoring
- Instant notification of system events
- Bi-directional communication with charging stations

## 🧪 Testing

Run unit tests:
```bash
npm test
# or
ng test
```

Tests execute via [Karma](https://karma-runner.github.io) test runner.

## 📝 Code Standards

- Follow Angular style guide
- Use TypeScript strict mode
- Implement reactive patterns with RxJS
- Use Angular Material components for consistency
- Write meaningful component and service names
- Document complex logic with comments

## 🌐 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 📄 License

[Add your license information here]

## 👥 Contributing

[Add contributing guidelines if applicable]

## 📞 Support

[Add support contact information]

---

**Version**: 0.0.1  
**Angular CLI**: 18.1.0  
**Node**: 18.x+
