import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

/*
 * SOURCE OF TRUTH for the brand tokens, shared by every web app via the @Theme
 * tsconfig path alias. The template has no brand: the primary ramp below is a
 * neutral placeholder (zinc, on the stock Aura surfaces). Replace the values
 * here when the project has a design system — nothing outside this file
 * hardcodes them.
 *
 * Contrast: light mode uses the 950 step as `primary.color` (white text
 * 19.9:1); dark mode uses the 50 step with a dark contrast colour.
 */

const templatePreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '{zinc.50}',
      100: '{zinc.100}',
      200: '{zinc.200}',
      300: '{zinc.300}',
      400: '{zinc.400}',
      500: '{zinc.500}',
      600: '{zinc.600}',
      700: '{zinc.700}',
      800: '{zinc.800}',
      900: '{zinc.900}',
      950: '{zinc.950}',
    },
    colorScheme: {
      light: {
        primary: {
          color: '{primary.950}',
          contrastColor: '#ffffff',
          hoverColor: '{primary.800}',
          activeColor: '{primary.700}',
        },
        highlight: {
          background: '{primary.950}',
          focusBackground: '{primary.700}',
          color: '#ffffff',
          focusColor: '#ffffff',
        },
      },
      dark: {
        primary: {
          color: '{primary.50}',
          contrastColor: '{primary.950}',
          hoverColor: '{primary.200}',
          activeColor: '{primary.300}',
        },
        highlight: {
          background: '{primary.50}',
          focusBackground: '{primary.300}',
          color: '{primary.950}',
          focusColor: '{primary.950}',
        },
      },
    },
  },
  extend: {
    // Status tints — text + soft background per severity for hand-made pills, banners and
    // field errors (--p-status-*): the Aura tag recipe (700 text on the 100 step in light, 300
    // text on a 16 % wash in dark), so app code never pairs white with a 500-step colour.
    status: {
      success: {
        color: 'light-dark({green.700}, {green.300})',
        background: 'light-dark({green.100}, color-mix(in srgb, {green.500}, transparent 84%))',
      },
      info: {
        color: 'light-dark({sky.700}, {sky.300})',
        background: 'light-dark({sky.100}, color-mix(in srgb, {sky.500}, transparent 84%))',
      },
      warn: {
        color: 'light-dark({orange.700}, {orange.300})',
        background: 'light-dark({orange.100}, color-mix(in srgb, {orange.500}, transparent 84%))',
      },
      danger: {
        color: 'light-dark({red.700}, {red.300})',
        background: 'light-dark({red.100}, color-mix(in srgb, {red.500}, transparent 84%))',
      },
      // Neutral tone for statuses that carry no severity (draft, inactive, a plain category).
      secondary: {
        color: 'light-dark({surface.600}, {surface.300})',
        background: 'light-dark({surface.200}, color-mix(in srgb, {surface.500}, transparent 84%))',
      },
    },
  },
});

export default templatePreset;
