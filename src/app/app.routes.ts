import { Routes } from '@angular/router';
import { authGuard } from "./helpers/auth.guard";
import { homeRedirectGuard } from "./helpers/home-redirect.guard";

export const routes: Routes = [
  {
    path: 'log/system',
    loadComponent: () => import('./components/logs/logger/logger.component').then(m => m.LoggerComponent),
    canActivate: [authGuard]
  },
  {
    path: 'log/backend',
    loadComponent: () => import('./components/logs/backlog/backlog.component').then(m => m.BacklogComponent),
    canActivate: [authGuard]
  },
  {
    path: 'log/pay',
    loadComponent: () => import('./components/logs/paylog/paylog.component').then(m => m.PaylogComponent),
    canActivate: [authGuard]
  },
  {
    path: 'users',
    loadComponent: () => import('./components/user/users/users.component').then(m => m.UsersComponent),
    canActivate: [authGuard]
  },
  {
    path: 'users/add',
    loadComponent: () => import('./components/user/user-edit/user-edit.component').then(m => m.UserEditComponent),
    canActivate: [authGuard]
  },
  {
    path: 'users/info/:username',
    loadComponent: () => import('./components/user/user-info/user-info.component').then(m => m.UserInfoComponent),
    canActivate: [authGuard]
  },
  {
    path: 'users/edit/:username',
    loadComponent: () => import('./components/user/user-edit/user-edit.component').then(m => m.UserEditComponent),
    canActivate: [authGuard]
  },
  {
    path: 'user-tags',
    loadComponent: () => import('./components/user-tag/user-tags/user-tags.component').then(m => m.UserTagsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'user-tags/add',
    loadComponent: () => import('./components/user-tag/user-tag-edit/user-tag-edit.component').then(m => m.UserTagEditComponent),
    canActivate: [authGuard]
  },
  {
    path: 'user-tags/edit/:idTag',
    loadComponent: () => import('./components/user-tag/user-tag-edit/user-tag-edit.component').then(m => m.UserTagEditComponent),
    canActivate: [authGuard]
  },
  {
    path: 'points',
    loadComponent: () => import('./components/chargepoint-list/chargepoint-list.component').then(m => m.ChargepointListComponent)
  },
  {
    path: 'bank',
    loadComponent: () => import('./components/pages/bank-service/bank-service.component').then(m => m.BankServiceComponent)
  },
  {
    path: 'privacy/:lang',
    loadComponent: () => import('./components/pages/privacy-policy/privacy-policy.component').then(m => m.PrivacyPolicyComponent)
  },
  {
    path: 'privacy',
    loadComponent: () => import('./components/pages/privacy-policy/privacy-policy.component').then(m => m.PrivacyPolicyComponent)
  },
  {
    path: 'terms/:lang',
    loadComponent: () => import('./components/pages/terms/terms.component').then(m => m.TermsComponent)
  },
  {
    path: 'company-info/:lang',
    loadComponent: () => import('./components/pages/company-info/company-info.component').then(m => m.CompanyInfoComponent)
  },
  {
    path: 'account/login',
    loadComponent: () => import('./components/user/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'account/register',
    loadComponent: () => import('./components/user/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: '',
    pathMatch: 'full',
    canActivate: [homeRedirectGuard],
    // This component won't render - guard always redirects
    loadComponent: () => import('./components/chargepoint-list/chargepoint-list.component').then(m => m.ChargepointListComponent)
  },
  {
    path: 'points-config',
    loadComponent: () => import('./components/chargepoint-config/chargepoint-config.component').then(m => m.ChargepointConfigComponent),
    canActivate: [authGuard]
  },
  {
    path: 'points-form',
    loadComponent: () => import('./components/chargepoint-form/chargepoint-form.component').then(m => m.ChargepointFormComponent),
    canActivate: [authGuard]
  },
  {
    path: 'points-info',
    loadComponent: () => import('./components/chargepoint-info/chargepoint-info.component').then(m => m.ChargepointInfoComponent)
  },
  {
    path: 'promo',
    loadComponent: () => import('./components/promo-list/promo-list.component').then(m => m.PromoListComponent)
  },
  {
    path: 'promo-point',
    loadComponent: () => import('./components/promo/promo.component').then(m => m.PromoComponent)
  },
  {
    path: 'user-profile',
    loadComponent: () => import('./components/user-profile/user-profile.component').then(m => m.UserProfileComponent)
  },
  {
    path: 'payment-methods',
    loadComponent: () => import('./components/user-profile/payment-method-list/payment-method-list.component').then(m => m.PaymentMethodListComponent)
  },
  {
    path: 'new-transactions',
    loadComponent: () => import('./components/chargepoint-screen/chargepoint-screen.component').then(m => m.ChargepointScreenComponent)
  },
  {
    path: 'current-transaction',
    loadComponent: () => import('./components/transaction-screen/transaction-screen.component').then(m => m.TransactionScreenComponent)
  },
  {
    path: 'statistic',
    loadComponent: () => import('./components/statistic/statistic.component').then(m => m.StatisticComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'roaming-tariff',
    loadComponent: () => import('./components/tariff/tariff.component').then(m => m.TariffComponent)
  }
];
