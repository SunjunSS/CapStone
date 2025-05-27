
const { callClovaSpeechAPI } = require('../src/services/audioService/callClovaSpeech');
// const { convertToMP3 } = require('../src/services/convertToMP3');
// const { askOpenAI } = require('../src/services/callOpenAI');
// const { askClovaX } = require('../src/services/callClovaStudioX');
const { ClovaX } = require('../src/services/audioService/callX');

const path = require("path");

const filePath = path.join(
  "C:",
  "CapStone",
  "CapStone",
  "CapStone_server",
  "storage",
  "temp_audio",
  "hoo_6.mp3"
);

// ✅ async function을 만들고 그 안에서 await 사용
async function main() {
  try {

    const speechResponse = await callClovaSpeechAPI(filePath);
    console.log(`텍스트 전환 응답: ${speechResponse}`);
   
    
  } catch (error) {

    console.error("Error:", error);

  }
}

// ✅ main 함수 실행
main();
