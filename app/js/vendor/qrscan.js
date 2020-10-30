let video = null;
let image = null;
let canvas = null;
let canvasCtx = null;
let decoder = null;

let selectedDeviceId;
let selectedDeviceIndex;

const setCanvas = () => {
  canvas = document.createElement('canvas');
  canvasCtx = canvas.getContext('2d');
};

const setPhotoSource = () => {
  video = document.getElementById('video');
  image = document.getElementById('image');
};

const setCanvasProperties = () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
};

const startCapture = (constraints) => {
  return navigator.mediaDevices
    .getUserMedia(constraints)
    .then(function(stream) {
      video.srcObject = stream;
      video.setAttribute('playsinline', true);
      video.setAttribute('controls', true);
      setTimeout(() => {
        document.querySelector('video').removeAttribute('controls');
      });
    });
};

const init = (streaming) => {
  setPhotoSource();
  setCanvas();

  decoder = new Worker('decoder.js');

  if (streaming && window.isMediaStreamAPISupported) {
    return navigator.mediaDevices
      .enumerateDevices()
      .then(function(devices) {
        const videoInputDevices = devices.filter(function(device) {
          if (device.kind == 'videoinput') {
            return device;
          }
        });

        let constraints;
        if (videoInputDevices.length) {
          selectedDeviceIndex = videoInputDevices.length - 1;
          const selectedDevice = videoInputDevices[selectedDeviceIndex];
          selectedDeviceId = selectedDevice.deviceId;
          constraints = {
            video: {
              mandatory: {
                sourceId: selectedDeviceId ? selectedDeviceId : null
              }
            },
            audio: false
          };

          if (window.iOS) {
            constraints.video.facingMode = 'environment';
          }
        }
        else {
          selectedDeviceId = undefined;
          selectedDeviceIndex = undefined;
          constraints = { video: true };
        }
        return startCapture(constraints)
        .then(() => {
          return { devices: videoInputDevices.map((device) => device.label), selected: selectedDeviceIndex }
        });
      })
      .catch(function() {
        return false;
      });
  }
  else {
    return Promise.resolve(false);
  }

};

const nextDevice = () => {
  return navigator.mediaDevices
  .enumerateDevices()
  .then(function(devices) {
    const videoInputDevices = devices.filter(function(device) {
      if (device.kind == 'videoinput') {
        return device;
      }
    });

    let selectedDevice = selectedDeviceId && videoInputDevices[selectedDeviceIndex] && videoInputDevices[selectedDeviceIndex].deviceId === selectedDeviceId && videoInputDevices[selectedDeviceIndex];
    if(selectedDeviceId && !selectedDevice) {
      for(let i = 0; i < videoInputDevices.length; i++) {
        if(videoInputDevices[i].deviceId === selectedDeviceId) {
          selectedDevice = videoInputDevices[i];
          selectedDeviceIndex = i;
          break;
        }
      }
      if(!selectedDevice) {
        selectedDevice = videoInputDevices[selectedDeviceIndex];
      }
    }
    if(selectedDevice) {
      selectedDeviceIndex = (selectedDeviceIndex + 1) % videoInputDevices.length;
      selectedDevice = videoInputDevices[selectedDeviceIndex];
      selectedDeviceId = selectedDevice.deviceId;
    }
    else if(videoInputDevices.length) {
      selectedDeviceIndex = 0;
      selectedDevice = videoInputDevices[0];
      selectedDeviceId = selectedDevice.deviceId;
    }

    let constraints;
    if (selectedDevice) {
      constraints = {
        video: {
          mandatory: {
            sourceId: selectedDeviceId ? selectedDeviceId : null
          }
        },
        audio: false
      };

      if (window.iOS) {
        constraints.video.facingMode = 'environment';
      }
    }
    else {
      selectedDeviceId = undefined;
      selectedDeviceIndex = undefined;
      constraints = { video: true };
    }
    return startCapture(constraints)
    .then(() => {
      return { devices: videoInputDevices.map((device) => device.label), selected: selectedDeviceIndex }
    });
  });
};

const newDecoderFrame = (webcam) => {
  setCanvasProperties();
  setTimeout(() => {
    try {
      canvasCtx.drawImage(webcam, 0, 0, canvas.width, canvas.height);
      var imgData = canvasCtx.getImageData(0, 0, canvas.width, canvas.height);
  
      if (imgData.data) {
        decoder.postMessage(imgData);
      }
    } catch (e) {
      // Try-Catch to circumvent Firefox Bug #879717
      if (e.name == 'NS_ERROR_NOT_AVAILABLE') setTimeout(() => newDecoderFrame(webcam), 0);
    }
  }, 1);
}

/**
 * starts continuous scan
 * @param {number} interval the time in milliseconds to wait between scans (default 1)
 * @param {Function} a callback function that would be called for every successful scan with the results
 */
const startScanning = (interval, callback) => {
  function onDecoderMessage(event) {
    if (event.data.length > 0) {
      var qrid = event.data[0][2];
      callback(qrid);
    }
    setTimeout(function() {
      newDecoderFrame(video);
    }, interval || 1);
  }

  decoder.onmessage = onDecoderMessage;

  // Start QR-decoder
  newDecoderFrame(video);
};

/**
 * starts single scan
 * @param {Function} a callback function that would be called after scan. if scan was successful the result is supplied as first param, else null will be sent
 */
const scanSingle = (callback) => {
  function onDecoderMessage(event) {
    if (event.data.length > 0) {
      var qrid = event.data[0][2];
      callback(qrid);
    }
    else {
      callback(null);
    }
  }

  decoder.onmessage = onDecoderMessage;

  // Start QR-decoder
  newDecoderFrame(image);
};

export default {
  init,
  startScanning,
  scanSingle,
  nextDevice
};
