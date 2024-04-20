import { sendMessage, onMessage } from "webext-bridge/content-script";
import { Readability } from '@mozilla/readability';

export default defineContentScript({
  matches: ['<all_urls>'],
  main() {

    let randomNode: Node;
    let randomIndex: number;
    let words: any[] = [];



    onMessage('translated', (result) => {
      console.log('TRANSLATED!')
      const { translated } = result.data;
      let body = document.body.innerHTML;
      translated.forEach((word: any) => {
        let newSentence = word.context;
        const newWord = `<b class=youcan-hover data-original=${word.text} data-translated=${word.translated}>${word.translated}</b>`;
        newSentence = newSentence.replace(word.text, newWord);
        body = body.replace(word.text, newWord);
        console.log(body.indexOf(word.context), word.context, newSentence);
      });
      document.body.innerHTML = body;
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

    onMessage('youcan', () => {
      const documentClone = document.cloneNode(true) as Document;
      console.log('extracting content');
      const article = new Readability(documentClone).parse();
      article?.textContent.split('. ').forEach((line) => {
        let randomWord = line.split(' ')[Math.floor(Math.random() * line.split(' ').length)];
        if (randomWord.length > 1) {
          words.push({ text: [randomWord], context: line, target_lang: 'SV' });
        }
      });

      sendMessage('translate', { words: words }, "background");
    });
  },
});


