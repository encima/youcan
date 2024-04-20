import { storage } from 'wxt/storage';

const saveOptions = () => {

    let language = document.getElementById('language').value;
    let key = document.getElementById('deepl-key').textContent;
    let changed = {}
    if (key !== defaultKey) {
        storage.setItem('local:deeplKey', key);
    }
    if (language!== defaultLang) {
        storage.setItem('local:lang', language);
    }
  
    const status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(() => {
        status.textContent = '';
    }, 750);
}
  
const restoreOptions = () => {
    storage.setItem('local:deeplKey', defaultKey);
    storage.setItem('local:lang', defaultLang);
};

const resetOptions = () => {
    // browser.storage.sync.set(
    //     { lang: defaultLang, key: defaultKey }).then(
    //     () => {
    //         const status = document.getElementById('status');
    //         status.textContent = 'Options reset.';
    //         setTimeout(() => {
    //         status.textContent = '';
    //         }, 750);
    //     }
    //   );
}
  
  
document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);
document.getElementById('reset').addEventListener('click', resetOptions);