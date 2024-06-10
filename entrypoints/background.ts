import { onMessage, sendMessage } from "webext-bridge/background";
import { storage } from 'wxt/storage';
export default defineBackground(() => {
  console.log('Setting up Youcan', { id: browser.runtime.id });

  let key: string | null = null;
  let lang: string | null  = null;

  const config = loadConfig().then((config) => {
    if (config !== null) {
      key = config.deeplKey;
      lang = config.targetLang;
    } else {
      storage.getItem<string>('local:deeplKey',).then((value) => {
        key = value!;
      });
      storage.getItem<string>('local:lang').then((value) => {
        lang = value!;
      });
    }
  });


  onMessage('translate', ({ data }) => {
    const { words } = data;
    translateWithDeepl(words).then((translatedWords) => {
      browser.tabs
        .query({ currentWindow: true, active: true })
        .then((tabs) => {
          ;
          sendMessage('translated', { translated: translatedWords }, 'content-script@' + tabs[0].id);
        });
    });
  });

  async function loadConfig() {
    try {
      const response = await fetch(browser.runtime.getURL('/config.json'));
      const config = await response.json();
      return config;
    } catch (error) {
      console.error('Error loading config.json:', error);
      return null;
    }
  }
  browser.commands.onCommand.addListener((command) => {
    if (command === "start-translate") {
      browser.tabs
        .query({ currentWindow: true, active: true })
        .then((tabs) => {
            sendMessage('start-translate', {}, 'content-script@' + tabs[0].id);
        });
    }
  });


  async function formatWithOllama(content: any[], random: boolean = true) {
    for (let i = 0; i < content.length; i++) {
      ``
      const resp = await fetch('http://localhost:11434/api/generate ', {
        method: 'POST',
        body: JSON.stringify({
          model: 'mistrallite',
          stream: 'false',
          format: 'json',
          prompt: 'Pick a random word from the sentence and translate it to Swedish: ' + content[i].context
        })
      });
      const body = await resp.json();
    }
  }

  async function translateWithDeepl(content: any[], random: boolean = true) {
    if (key === null || lang === null) {
      try {
        let words: string[] = content.map((word) => word.text[0]);
        let context = content.map((word) => word.context).join('\n');
        let reqBody = JSON.stringify({
          'text': words,
          'target_lang': lang,
          'context': context
        });
        const resp = await fetch('https://api-free.deepl.com/v2/translate', {
          method: 'POST',
          headers: {
            'Authorization': 'DeepL-Auth-Key ' + key,
            'Content-Type': 'application/json'
          },
          body: reqBody
        });
        if (!resp.ok) {
          console.log(resp.status);
          return content;
        }
        const body = await resp.json();
        body.translations.forEach((translation: any, i: number) => {
          content[i].translated = translation.text
        });
        // content[i].translated = body.translations[0].text
        // }
        return content;
      } catch (err) {
        console.error(err);
      }

    } else {
      console.error('No key or language set, set in options page');
    }
  }
});


