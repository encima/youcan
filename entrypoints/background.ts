import { onMessage, sendMessage } from "webext-bridge/background";
import { storage } from '@wxt-dev/storage';
import { getTranslation, setTranslation } from './idb.js';

export default defineBackground(() => {
  console.log('Setting up Youcan', { id: browser.runtime.id });

  // Listen for translate message from content script
  onMessage('translate', async ({ data }) => {
    const { words } = data;
    const url = (await browser.tabs.query({ active: true, currentWindow: true }))[0]?.url;
    if (url) {
      // Check cache first
      const cached = await getTranslation(url);
      if (cached && Array.isArray(cached) && cached.length === words.length) {
        // Use cached translation
        browser.tabs
          .query({ currentWindow: true, active: true })
          .then((tabs) => {
            sendMessage('translated', { translated: cached }, 'content-script@' + tabs[0].id);
          });
        return;
      }
    }
    // Not cached or cache miss, translate
    const translatedWords = await translateWithDeepl(words);
    if (url) {
      await setTranslation(url, translatedWords);
    }
    browser.tabs
      .query({ currentWindow: true, active: true })
      .then((tabs) => {
        sendMessage('translated', { translated: translatedWords }, 'content-script@' + tabs[0].id);
      });
  });

  // Listen for keyboard shortcut to start translation
  browser.commands.onCommand.addListener((command) => {
    if (command === "start-translate") {
      browser.tabs
        .query({ currentWindow: true, active: true })
        .then((tabs) => {
            sendMessage('start-translate', {}, 'content-script@' + tabs[0].id);
        });
    }
  });

  // Function to translate words using DeepL API
  async function translateWithDeepl(content: any[]) {
    try {
      // Get target language from storage or use default
      const targetLang = await storage.getItem<string>('local:targetLang') || 'FI';
      
      // Extract words and context
      let words: string[] = content.map((word) => word.text);
      let context = content.map((word) => word.context).join('\n');
      
      // Prepare request body
      let reqBody = JSON.stringify({
        'text': words,
        'target_lang': targetLang,
        'context': context
      });
      
      // Get API key from storage
      const apiKey = await storage.getItem<string>('local:deeplKey');
      
      if (!apiKey) {
        console.error('DeepL API key not found. Please set it in the options page.');
        return content;
      }
      
      console.log(`Translating ${words.length} words to ${targetLang}`);
      
      // Make request to DeepL API
      const resp = await fetch('https://api.deepl.com/v2/translate', {
        method: 'POST',
        headers: {
          'Authorization': `DeepL-Auth-Key ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: reqBody
      });
      
      if (!resp.ok) {
        console.error('DeepL API error:', resp.status);
        // If we get an authentication error, notify the user
        if (resp.status === 403) {
          browser.notifications.create({
            type: 'basic',
            iconUrl: browser.runtime.getURL('/icon/128.png'),
            title: 'DeepL API Error',   
            message: 'Authentication failed. Please check your API key in the options page.'
          });
        }
        return content;
      }
      
      // Process response
      const body = await resp.json();
      body.translations.forEach((translation: any, i: number) => {
        content[i].translated = translation.text;
      });
      
      return content;
    } catch (err) {
      console.error('Translation error:', err);
      // Show error notification
      browser.notifications.create({
        type: 'basic',
        iconUrl: browser.runtime.getURL('/icon/128.png'),
        title: 'Translation Error',
        message: 'An error occurred during translation. Please try again.'
      });
      return content;
    }
  }
});
