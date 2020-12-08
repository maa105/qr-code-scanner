Based on [code-kotis/qr-code-scanner](https://github.com/code-kotis/qr-code-scanner)

QR scanner frame to embed to your project as an iframe. You can communicate with it using `postMessage`. You can switch cameras. Fallback to single image if streaming is not supported.

## Features

  - Switch camera

  - Fallback to single image scan

  - Encapsulated logic in iframe and communicate with it through postMessage

  - Listen for scan results and other events through `window.addEventListener`

## Installation

1. Clone this repo

  ```bash
  git clone https://github.com/maa105/qr-code-scanner
  ```

2. Installation

  ```bash
  npm install
  ```

3. Run (Dev)

  ```bash
  npm run start
  ```

4. Build

  ```bash
  npm run build
  ```

5. Move dist folder to your app and use the `index.html` in your app as src of `iframe`

6. communicate with iframe through:
  
  6.1. listen to events:

```js

  window.addEventListener('message', (message) => {
    if(message.data.event === 'scan-result') {
      console.log('Scan Result: ', message.data.result);
    }
    else if(message.data.event === 'init-status') {
      if(message.data.streaming) {
        console.log('Cameras available:', message.data.devices);
        console.log('Selected camera:', message.data.devices[message.data.selected]);
      }
      else {
        console.log('Fallback use postMessage { command: "scan" }');
      }
    }
    else if(message.data.event === 'next-device-result') {
      if(message.data.success) {
        console.log('Cameras available:', message.data.devices);
        console.log('Selected camera:', message.data.devices[message.data.selected]);
      }
      else {
        console.log('OOPS');
      }
    }
  });

```
  
  6.2. send commands through `postMessage`

```js

  document.getElementById('qr-scanner-frame').contentWindow.postMessage({
    command: 'next-device'
  });

// only use incase streaming is false
  document.getElementById('qr-scanner-frame').contentWindow.postMessage({
    command: 'scan'
  });

```
