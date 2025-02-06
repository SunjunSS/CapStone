
const { callClovaSpeechAPI } = require('../src/services/callClovaSpeech');

const { convertToMP3 } = require('../src/services/convertToMP3');

// const mp3 = convertToMP3(
//   "../storage/audio/audioMixed1738682376246.wav",
//   "../storage/audio/audioMixedMP3.mp3"
// );
const path = require("path");

const filePath = path.join(
  "C:",
  "CapStone",
  "CapStone",
  "CapStone_server",
  "storage",
  "audio",
  "audioMixedMP3.mp3"
);



const response = callClovaSpeechAPI(filePath);

// console.log(mp3);
console.log(response);
