import { sendMessage, onMessage } from "webext-bridge/content-script";
import { Readability } from '@mozilla/readability';
import { storage } from '@wxt-dev/storage';

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_end',
  main() {
    // CSS for hover effect
    const style = document.createElement('style');
    style.textContent = `
      .youcan-translated {
        position: relative;
        text-decoration: underline dotted;
        cursor: pointer;
      }
      
      .youcan-translated:hover .youcan-original {
        display: block;
      }
      
      .youcan-original {
        display: none;
        position: absolute;
        background: #333;
        color: white;
        padding: 5px 10px;
        border-radius: 4px;
        font-size: 14px;
        bottom: 125%;
        left: 50%;
        transform: translateX(-50%);
        white-space: nowrap;
        z-index: 1000;
      }
      
      .youcan-original::after {
        content: "";
        position: absolute;
        top: 100%;
        left: 50%;
        margin-left: -5px;
        border-width: 5px;
        border-style: solid;
        border-color: #333 transparent transparent transparent;
      }
    `;
    document.head.appendChild(style);

    // Store words to be translated
    let wordsToTranslate: any[] = [];

    // Function to replace a specific word in a text node with its translation
    function replaceWordInNode(node: Node, word: string, translation: string, originalWord: string) {
      if (node.nodeType === Node.TEXT_NODE && node.nodeValue) {
        const text = node.nodeValue;
        
        // Check if the word is actually in the text before proceeding
        if (typeof text === 'string' && text.indexOf(word) >= 0) {
          const regex = new RegExp(`\\b${word}\\b`, 'g');
          
          // Create a document fragment to hold the new content
          const fragment = document.createDocumentFragment();
          let lastIndex = 0;
          let match;
          
          // Find all instances of the word and replace them
          while ((match = regex.exec(text)) !== null) {
            // Add text before the match
            if (match.index > lastIndex) {
              fragment.appendChild(document.createTextNode(text.substring(lastIndex, match.index)));
            }
            
            // Create the translated element with hover effect
            const translatedSpan = document.createElement('span');
            translatedSpan.className = 'youcan-translated';
            translatedSpan.textContent = translation;
            
            // Create the original word tooltip
            const originalSpan = document.createElement('span');
            originalSpan.className = 'youcan-original';
            originalSpan.textContent = originalWord;
            
            translatedSpan.appendChild(originalSpan);
            fragment.appendChild(translatedSpan);
            
            lastIndex = match.index + match[0].length;
          }
          
          // Add any remaining text
          if (lastIndex < text.length) {
            fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
          }
          
          // Replace the original node with our fragment
          if (node.parentNode) {
            node.parentNode.replaceChild(fragment, node);
            return true;
          }
        }
      }
      return false;
    }

    // Function to traverse the DOM and replace words
    function traverseAndReplace(node: Node, word: string, translation: string, originalWord: string) {
      if (node.nodeType === Node.TEXT_NODE) {
        return replaceWordInNode(node, word, translation, originalWord);
      } else if (node.nodeType === Node.ELEMENT_NODE && 
                 node.nodeName !== 'SCRIPT' && 
                 node.nodeName !== 'STYLE' && 
                 node.nodeName !== 'NOSCRIPT') {
        // Skip script/style tags
        // Check if the element has the youcan class to avoid processing already processed nodes
        const element = node as Element;
        if (element.className && typeof element.className === 'string' && element.className.includes('youcan-')) {
          return false;
        }
        
        let replaced = false;
        const childNodes = Array.from(node.childNodes);
        for (const child of childNodes) {
          if (traverseAndReplace(child, word, translation, originalWord)) {
            replaced = true;
          }
        }
        return replaced;
      }
      return false;
    }

    // Function to get all text nodes in the document
    function getTextNodes(node: Node): Node[] {
      let textNodes: Node[] = [];
      
      if (node.nodeType === Node.TEXT_NODE && 
          node.textContent && 
          node.textContent.trim().length > 0) {
        textNodes.push(node);
      } else if (node.nodeType === Node.ELEMENT_NODE && 
                 node.nodeName !== 'SCRIPT' && 
                 node.nodeName !== 'STYLE' && 
                 node.nodeName !== 'NOSCRIPT') {
        for (let i = 0; i < node.childNodes.length; i++) {
          textNodes = textNodes.concat(getTextNodes(node.childNodes[i]));
        }
      }
      
      return textNodes;
    }

    // Function to select random words from text nodes
    async function selectRandomWords(textNodes: Node[], count: number = 10) {
      // Get configured word count from storage or use default
      const configuredCount = await storage.getItem<number>('local:wordCount') || count;
      
      const words: Set<string> = new Set();
      const wordObjects: any[] = [];
      
      // Get all words from text nodes
      const allWords: string[] = [];
      const wordToContextMap: Map<string, string> = new Map();
      
      textNodes.forEach(node => {
        if (node.textContent) {
          const text = node.textContent.trim();
          if (text.length > 0) {
            // Extract words (3+ characters)
            const extractedWords = text.match(/\b[a-zA-Z]{3,}\b/g);
            if (extractedWords) {
              extractedWords.forEach(word => {
                if (!wordToContextMap.has(word)) {
                  allWords.push(word);
                  wordToContextMap.set(word, text);
                }
              });
            }
          }
        }
      });
      
      // Select random words
      const selectedCount = Math.min(configuredCount, allWords.length);
      console.log(`Selecting ${selectedCount} words for translation (from ${allWords.length} total words)`);
      
      for (let i = 0; i < selectedCount; i++) {
        if (allWords.length === 0) break;
        
        const randomIndex = Math.floor(Math.random() * allWords.length);
        const word = allWords.splice(randomIndex, 1)[0];
        
        if (!words.has(word)) {
          words.add(word);
          wordObjects.push({
            text: word,
            context: wordToContextMap.get(word) || "",
          });
        }
      }
      
      return wordObjects;
    }

    // Handle translated words from background script
    onMessage('translated', (result) => {
      console.log('Received translations:', result.data.translated);
      const { translated } = result.data;
      
      if (translated && translated.length > 0) {
        // Apply translations to the page
        translated.forEach((item: any) => {
          if (item.text && item.translated) {
            traverseAndReplace(document.body, item.text, item.translated, item.text);
          }
        });
        
        // Show notification that translation is complete
        const notification = document.createElement('div');
        notification.style.position = 'fixed';
        notification.style.bottom = '20px';
        notification.style.right = '20px';
        notification.style.backgroundColor = '#4CAF50';
        notification.style.color = 'white';
        notification.style.padding = '10px 15px';
        notification.style.borderRadius = '4px';
        notification.style.zIndex = '10000';
        notification.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
        notification.textContent = `Translated ${translated.length} words. Hover over them to see the original.`;
        
        document.body.appendChild(notification);
        
        // Remove notification after a few seconds
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 5000);
      } else {
        console.warn('No translations received or translations empty');
      }
    });

    // Start translation process when triggered
    onMessage('start-translate', async () => {
      console.log('Starting translation process');
      
      // Reset words array
      wordsToTranslate = [];
      
      // Get all text nodes
      const textNodes = getTextNodes(document.body);
      
      // Select random words based on configured count
      wordsToTranslate = await selectRandomWords(textNodes);
      
      if (wordsToTranslate.length > 0) {
        console.log('Selected words for translation:', wordsToTranslate);
        // Send words to background script for translation
        sendMessage('translate', { words: wordsToTranslate }, "background");
      } else {
        console.log('No suitable words found for translation');
        
        // Show notification that no words were found
        const notification = document.createElement('div');
        notification.style.position = 'fixed';
        notification.style.bottom = '20px';
        notification.style.right = '20px';
        notification.style.backgroundColor = '#f44336';
        notification.style.color = 'white';
        notification.style.padding = '10px 15px';
        notification.style.borderRadius = '4px';
        notification.style.zIndex = '10000';
        notification.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
        notification.textContent = 'No suitable words found for translation on this page.';
        
        document.body.appendChild(notification);
        
        // Remove notification after a few seconds
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 5000);
      }
    });
  }
});
