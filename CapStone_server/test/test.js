
const { callClovaSpeechAPI } = require('../src/services/callClovaSpeech');
const { convertToMP3 } = require('../src/services/convertToMP3');
const { askOpenAI } = require('../src/services/callOpenAI');
const { askClovaX } = require('../src/services/callClovaStudioX');
const { ClovaX } = require('../src/services/callX');

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
  "1738839122439.mp3"
);

// ✅ async function을 만들고 그 안에서 await 사용
async function main() {
  try {
    // const response = await callClovaSpeechAPI(filePath);
    //console.log(`response: ${response}`);

    // 노드 없는 형태.
    // const responseAI = await askOpenAI(response);
    // console.log(`AI: ${responseAI}`);

    //console.log(response);

    // const clovaXResponse = await askClovaX(response);
    // console.log(`X: ${clovaXResponse}`);


    const mindmapData = [
      { key: 1, name: "캡스톤 마인드맵 탐색", parent: 0, isSelected: false },
      { key: 2, name: "퍼블릭시트", parent: 1, isSelected: false },
      { key: 3, name: "글로벌", parent: 1, isSelected: false },
      { key: 4, name: "마인드맵 생성", parent: 1, isSelected: false },
      { key: 5, name: "출처 정보 제공", parent: 2, isSelected: false },
      { key: 6, name: "음성인식", parent: 3, isSelected: false },
      { key: 7, name: "노이즈 제거", parent: 3, isSelected: false },
      { key: 8, name: "이미지 LLM", parent: 4, isSelected: false },
      { key: 9, name: "마인드맵 생성 트직 구현", parent: 4, isSelected: false },
    ];

    const response = `1
    00:00:00,000 --> 00:00:01,470
    A: 내가 이거 그냥 알아볼게.

    2
    00:00:01,470 --> 00:00:09,620
    B: 네. 안녕하세요. 지금 DB 설정 중입니다. DB 설정 중이고요. 의존성 체 
    크해 주는 중입니다. 감사합니다.

    3
    00:00:09,620 --> 00:00:12,370
    A: 네. 감사합니다.

    위의 텍스트에서 키워드를 최대 4개까지 추출해줘 
    `

    const AIres = await ClovaX(response); 

    console.log(`x응답: ${AIres.data.result.message.content}`);

  } catch (error) {
    console.error("Error:", error);
  }
}

// ✅ main 함수 실행
main();
