import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

// Tweak this preset per client. Override `semantic.primary.{50..950}` with your brand
// palette and the rest of the UI will adapt.
export const appPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#f5faff',
      100: '#e5f0fb',
      200: '#c8defa',
      300: '#9dc4f5',
      400: '#5a9bee',
      500: '#0269b4',
      600: '#005594',
      700: '#004273',
      800: '#002f52',
      900: '#001c31',
      950: '#000e19',
    },
  },
});

export default appPreset;
