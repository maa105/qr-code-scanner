import QRReader from './vendor/qrscan.js';
import '../css/styles.css';

window.addEventListener('DOMContentLoaded', () => {
  //To check the device and add iOS support
  window.iOS = ['iPad', 'iPhone', 'iPod'].indexOf(navigator.platform) >= 0;
  window.isMediaStreamAPISupported = (navigator && navigator.mediaDevices && 'enumerateDevices' in navigator.mediaDevices);
  window.noCameraPermission = false;

  //Initializing qr scanner
  window.addEventListener('load', () => {
    QRReader.init(true)
    .then(function(initResult) {
      const success = Boolean(initResult);
      setTimeout(() => {
        const html = document.getElementsByTagName('html')[0];
        if (success) {
          startScanning();
          window.addEventListener('message', function(event) {
            if(event.origin === location.origin && event.data && event.data.command === 'next-device') {
              QRReader.nextDevice()
              .then((result) => {
                parent.postMessage({
                  event: 'next-device-result',
                  success: true,
                  error: false,
                  ...result
                }, location.origin);
              })
              .catch((err) => {
                parent.postMessage({
                  event: 'next-device-result',
                  success: false,
                  error: true,
                  errorMessage: err.message
                }, location.origin);
              });
            }
          }, false);
          parent.postMessage({
            event: 'init-status',
            ...initResult,
            streaming: true,
            single: false
          }, location.origin);
          html.className = 'streaming';
        }
        else {
          var scanSingleFunc = getSelectFromPhotoFunc();
          window.addEventListener('message', function(event) {
            if(event.origin === location.origin && event.data && event.data.command === 'scan') {
              scanSingleFunc();
            }
          }, false);
          parent.postMessage({
            event: 'init-status', 
            streaming: false,
            single: true
          }, location.origin);    
          html.className = 'single';
        }
      }, 1000);
    }); //To initialize QR Scanner
  });

  // start scanning
  function startScanning() {
    QRReader.startScanning(250, result => {
      parent.postMessage({
        event: 'scan-result', 
        result: result
      }, location.origin);
    });
  }

  function getSelectFromPhotoFunc() {
    //Creating the camera element
    var cameraInput = document.getElementById('input-file');
    var img = document.getElementById('image');
    var singleFrame = document.getElementById('single-frame');

    singleFrame.style.backgroundImage = 'none';

    //On camera change
    cameraInput.addEventListener('change', event => {
      if (event.target && event.target.files.length > 0) {
        const url = URL.createObjectURL(event.target.files[0]);
        singleFrame.style.backgroundImage = 'url(\'' + url + '\')';
        img.src = url;
        QRReader.scanSingle(result => {
          parent.postMessage({
            event: 'scan-result', 
            result: result
          }, location.origin);
        });
      }
    });

    return cameraInput.click.bind(cameraInput);
  }
});
