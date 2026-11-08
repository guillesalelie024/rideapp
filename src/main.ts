import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import { initTheme } from './composables/theme';

import { IonicVue } from '@ionic/vue';

/* Register Ionic icons so <ion-icon> renders everywhere */
import { addIcons } from 'ionicons';
import * as ionIcons from 'ionicons/icons';
addIcons(ionIcons);

/* Core CSS required for Ionic components to work properly */
import '@ionic/vue/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/vue/css/normalize.css';
import '@ionic/vue/css/structure.css';
import '@ionic/vue/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/vue/css/padding.css';
import '@ionic/vue/css/text-alignment.css';
import '@ionic/vue/css/flex-utils.css';

/**
 * Ionic Dark Mode
 * -----------------------------------------------------
 * For more info, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */

/* @import '@ionic/vue/css/palettes/dark.always.css'; */
/* @import '@ionic/vue/css/palettes/dark.class.css'; */
import './theme/variables.css';
import './theme/app.css';
import './theme/design-system.css';
import './theme/auth.css';

initTheme();

const app = createApp(App)
  .use(IonicVue)
  .use(router);

app.config.errorHandler = (error, _instance, info) => {
  console.error(`Unhandled Vue error during ${info}`, error);
  window.dispatchEvent(new CustomEvent('ride:action-error'));
};

router.isReady().then(() => {
  app.mount('#app');
});
