import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({

    manifest: {
        permissions: ['storage', 'tabs'],
        commands: {
          "youcan" : {
              suggested_key: { default: 'Ctrl + Shift + 7'},
              description: 'Translate page'
          }
        },
        web_accessible_resources: [{ resources: ['config.json'], matches: ['<all_urls>']}]
      },
      

});
