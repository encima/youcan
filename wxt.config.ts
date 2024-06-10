import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({

  manifest: {
    permissions: ['storage', 'tabs'],
    commands: {
      "start-translate": {
        suggested_key: { default: 'Ctrl + Shift + 7' },
        description: 'Translate page'
      }
    }
  },

});
