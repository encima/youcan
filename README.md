# YOUCAN 

## What?

A chrome/chromium/firefox extension to provide similar functionality to [Toucan](https://jointoucan.com) with support for any language that DeepL supports. 

Built using [WXT](https://wxt.dev)

![WXT](./public/wxt.svg)

## Why?
Toucan is awesome and infinitely more well made, but it does not (yet) support Swedish or Finnish.

## How?

- Clone the repo
- Create a `config.json` in the `public` folder 
- Add your DeepL API Key under the key: `deeplKey` 
- Add your target language under the key: `targetLang`
- Run `npm run build`
- Load the extension (saved in `.output`) using the `chrome://extensions` page
- Navigate to any page and use the default shortcut to run: `Ctrl/Cmd+Shift+7`