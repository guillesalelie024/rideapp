import { createRouter, createWebHistory } from '@ionic/vue-router';
import type { RouteRecordRaw } from 'vue-router';
const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Welcome',
    component: () => import('../views/WelcomePage.vue')
  },
  {
    path: '/explore',
    name: 'Explore',
    component: () => import('../views/ExplorePage.vue')
  },
  {
    path: '/weather',
    name: 'Weather',
    component: () => import('../views/WeatherPage.vue')
  },
  {
    path: '/home',
    name: 'Home',
    component: () => import('../views/HomePage.vue'),
    beforeEnter: (to) => (to.query.tab === 'details' && typeof to.query.place === 'string'
      ? { name: 'DestinationDetails', params: { id: to.query.place } }
      : undefined)
  },
  {
    path: '/itinerary',
    name: 'ItineraryPlanner',
    component: () => import('../views/ItineraryPlannerPage.vue')
  },
  {
    path: '/trip-summary',
    name: 'TripSummary',
    component: () => import('../views/TripSummaryPage.vue')
  },
  {
    path: '/live',
    name: 'RideLive',
    component: () => import('../views/RideLivePage.vue')
  },
  {
    path: '/trip-completion/:id',
    name: 'TripCompletion',
    component: () => import('../views/TripCompletionPage.vue')
  },
  {
    path: '/restaurants',
    name: 'Restaurants',
    component: () => import('../views/RestaurantListPage.vue')
  },
  {
    path: '/commute',
    name: 'Commute',
    component: () => import('../views/RouteFareComparisonPage.vue')
  },
  {
    path: '/route-details',
    name: 'RouteDetails',
    component: () => import('../views/RouteDetailsPage.vue')
  },
  {
    path: '/near-me',
    name: 'NearMe',
    component: () => import('../views/NearMePage.vue')
  },
  {
    path: '/surprise',
    name: 'SurpriseMe',
    component: () => import('../views/SurprisePage.vue')
  },
  {
    path: '/trips',
    name: 'Trips',
    component: () => import('../views/TripsPage.vue')
  },
  {
    path: '/saved',
    name: 'Saved',
    component: () => import('../views/SavedPage.vue')
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('../views/ProfilePage.vue')
  },
  {
    path: '/emergency-contacts',
    name: 'EmergencyContacts',
    component: () => import('../views/EmergencyContactsPage.vue')
  },
  {
    path: '/preferences',
    name: 'Preferences',
    component: () => import('../views/PreferencesPage.vue')
  },
  {
    path: '/security',
    name: 'Security',
    component: () => import('../views/SecurityPage.vue')
  },
  {
    path: '/terms',
    name: 'Terms',
    component: () => import('../views/TermsPage.vue')
  },
  {
    path: '/privacy',
    name: 'Privacy',
    component: () => import('../views/PrivacyPage.vue')
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: () => import('../views/ForgotPasswordPage.vue')
  },
  {
    path: '/reset-password',
    name: 'ResetPassword',
    component: () => import('../views/ResetPasswordPage.vue')
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('../views/AboutPage.vue')
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('../views/SettingsPage.vue')
  },
  {
    path: '/destinations/:id',
    name: 'DestinationDetails',
    component: () => import('../views/DestinationDetailsPage.vue')
  },
  {
    path: '/signup',
    name: 'SignUp',
    component: () => import('../views/SignUpPage.vue')
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginPage.vue')
  },
  {
    path: '/auth',
    redirect: { name: 'Login' }
  },
  {
    path: '/welcome',
    redirect: '/'
  },
  {
    path: '/dashboard',
    redirect: '/home'
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/NotFoundPage.vue')
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;
