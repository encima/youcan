import { sendMessage, onMessage } from "webext-bridge/content-script";
import { Readability } from '@mozilla/readability';

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_end',
  main() {

    let words: any[] = [];
    let randomNode: Node;
    let randomIndex: number;

    function replaceTextInNode(node, originalSentence: string | RegExp, newSentence: string) {
      let regex = new RegExp(originalSentence, 'gi');
      if (node.nodeType === Node.TEXT_NODE) {
          let newNodeValue = node.nodeValue.replace(regex, function(match) {
              return newSentence
          });
  
          if (newNodeValue !== node.nodeValue) {
              let span = document.createElement('span');
              span.innerHTML = newNodeValue;
              node.parentNode.replaceChild(span, node);
          }
      } else if (node.nodeType === Node.ELEMENT_NODE && node.nodeName !== 'SCRIPT' && node.nodeName !== 'STYLE') {
          for (let child of node.childNodes) {
              replaceTextInNode(child, originalSentence, newSentence);
          }
      }
  }

  function getTextNodes(node) {
    let textNodes = [];
    if (node.nodeType === Node.TEXT_NODE) {
        textNodes.push(node);
    } else if (node.nodeType === Node.ELEMENT_NODE && node.nodeName !== 'SCRIPT' && node.nodeName !== 'STYLE') {
        for (let child of node.childNodes) {
            textNodes = textNodes.concat(getTextNodes(child));
        }
    }
    return textNodes;
}

function getSentencesFromTextNodes(textNodes) {
    let sentences = [];
    textNodes.forEach(node => {
        let nodeSentences = node.nodeValue.match(/[^\.!\?]+[\.!\?]+/g);
        if (nodeSentences) {
            sentences = sentences.concat(nodeSentences.map(sentence => sentence.trim()));
        }
    });
    return sentences;
}

function getRandomSentences(textNodes, count) {
  
  let sentences = getSentencesFromTextNodes(textNodes);
    let selectedSentences = [];
    while (selectedSentences.length < count && sentences.length > 0) {
        let randomIndex = Math.floor(Math.random() * sentences.length);
        selectedSentences.push(sentences.splice(randomIndex, 1)[0]);
    }
    return selectedSentences;
}

    onMessage('translated', (result) => {
      console.log('TRANSLATED!')
      const { translated } = result.data;
      let body = document.body.innerHTML;
      translated.forEach((word: any) => {
        console.dir(word);
        let newSentence = word.context;
        newSentence = newSentence.replace(word.text, `<b class=youcan-hover data-original=${word.text} data-translated=${word.translated}>${word.translated}</b>`);
        replaceTextInNode(document.body, newSentence, word.translated);

        
        // body = body.replace(new RegExp(word.context, 'gi'), newSentence);
      });
      // document.body.innerHTML = body;
    });

    document.body.addEventListener('mouseover', (event: MouseEvent) => {
      const hoverElement = event.target as HTMLElement | null;
      if (hoverElement && hoverElement.classList.contains('youcan-hover')) {
        const orig: string = hoverElement.getAttribute('data-original') || '';
        hoverElement.innerText = orig;
      }
    });

    document.body.addEventListener('mouseout', (event) => {
      const hoverElement = event.target as HTMLElement | null;
      if (hoverElement && hoverElement.classList.contains('youcan-hover')) {
        const translated: string = hoverElement.getAttribute('data-translated') || '';
        hoverElement.innerText = translated;
      }
    });

    onMessage('start-translate', () => {
      let textNodes = getTextNodes(document.body);
      const documentClone = document.cloneNode(true) as Document;
      console.log('extracting content');
      const article = new Readability(documentClone).parse();
      let sentences = getRandomSentences(textNodes, textNodes.length)
      // article?.textContent.split('\n').forEach((line) => {
      sentences.forEach((line) => {
        let randomWord = line.split(' ')[Math.floor(Math.random() * line.split(' ').length)];
        if (randomWord.length > 1) {
          words.push({ text: [randomWord], context: line, target_lang: 'SV' });
        }
      });

      sendMessage('translate', { words: words }, "background");
    });

  }
});



