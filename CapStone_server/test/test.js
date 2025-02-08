
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
  "audio",
  "1738923695368.mp3"
);

// ✅ async function을 만들고 그 안에서 await 사용
async function main() {
  try {

    const speechResponse = await callClovaSpeechAPI(filePath);
    console.log(`텍스트 전환 응답: ${speechResponse}`);
   
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

    const request = 
      {"messages": [
        {
          "role": "system",
          "content": `
          사용자가 제공하는 음성 텍스트는 회의 중 기록된 대화입니다. 또한 사용자가 제공하는 마인드맵 노드는 회의 중 작성된 노드입니다.

          ### 📝 **목표**
          - **음성 텍스트를 분석하여 회의의 목적을 파악**하세요.
          - **회의 목적과 기존 마인드맵을 기반으로 추가할 만한 노드를 최대 3개 추천**하세요.

          ### **📌 작업 내용**
          1. **음성 텍스트를 자연스럽게 수정한 SRT 파일을 반환하세요.**
          2. **SRT 파일을 기반으로 회의록을 작성하세요:**
            - **회의 목적**
            - **주요 주제**
            - **다음 할 일**
            - **요약**
            - **키워드**
          3. **새로운 노드를 최대 3개 추천하세요.**
            - 회의의 목적을 고려하여 가장 적합한 노드를 추천하세요.
            - 기존 마인드맵 구조를 유지하면서 적절한 parent 값을 설정하세요.

          ### **📌 응답 형식**
          \`\`\`json
          {
            "srt": "<SRT 내용>",

            "minutes": {
              "회의 목적": "[회의의 핵심 목적]",
              "주요 주제": [
                "[내용]"
              ],
              "다음 할 일": [
                "[내용]"
              ],
              "요약": "[간단한 요약 내용]",
              "키워드": ["키워드1", "키워드2", "키워드3"]
            },

            "newNodes": [
              { "key": 10, "name": "새로운 노드 1", "parent": 2, "isSelected": false },
              { "key": 11, "name": "새로운 노드 2", "parent": 3, "isSelected": false },
              { "key": 12, "name": "새로운 노드 3", "parent": 4, "isSelected": false }
            ]
          }
          \`\`\`
          `
        },
        {
          "role": "user",
          "content": `
          우리팀의 회의 내용을 알려줄게, 음성 텍스트와 마인드맵 노드 데이터를 보낼게.
          시스템에 정해진 대로 응답을 반환해줘!

          #### **음성 텍스트**
          ${speechResponse}

          #### **마인드맵 노드**
          ${JSON.stringify(mindmapData, null, 2)}
          `
        },
        
      ],
      "maxTokens": 2048,
    };


    

    const AIres = await ClovaX(request); 

    console.log(`x응답: ${AIres.data.result.message.content}`);

  } catch (error) {
    console.error("Error:", error);
  }
}

// ✅ main 함수 실행
main();
