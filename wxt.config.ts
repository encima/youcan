import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({

  manifest: {
    permissions: ['storage', 'tabs', 'webRequest'],
    host_permissions: [
      "https://api.deepl.com/*"
    ],
    commands: {
      "start-translate": {
        suggested_key: { default: 'Ctrl + Shift + 7' },
        description: 'Translate page'
      }
    }
  },
  webExtConfig: {
    binaries: {
      firefox: '/Applications/FirefoxDeveloperEdition.app/Contents/MacOS/firefox', // Use Firefox Developer Edition instead of regular Firefox
    },
  }

});

