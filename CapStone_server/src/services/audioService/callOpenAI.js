const OpenAI = require("openai");
const dotenv = require("dotenv");

// 환경 변수 로드 (.env 파일 필요)
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY // .env 파일에 API 키 저장 필요
});

async function askOpenAI(prompt) {
  try {
    // 프롬프트 정의

    if(!prompt)
      return;

    const finalPrompt = `
    이 음성 텍스트는 회의 중 기록된 대화입니다. 또한 아래의 마인드맵 노드는 회의 중 작성된 노드입니다.

    ### 📝 **목표**
    - **음성 텍스트를 분석하여 회의의 목적을 파악**하세요.
    - **회의 목적과 기존 마인드맵을 기반으로 추가할 만한 노드를 최대 3개 추천**하세요.

    ### 🔍 **입력 데이터**
    #### **음성 텍스트**
    ${prompt}

    #### **마인드맵 노드**
    ${JSON.stringify(mindmapData, null, 2)}

    ---

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

    ---

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
    `;


    const response = await openai.chat.completions.create({
      model: "gpt-4", // 또는 "gpt-3.5-turbo"
      messages: [{ role: "user", content: finalPrompt }],
      max_tokens: 1000,
    });

    console.log("OpenAI 응답:", response.choices[0].message.content);

    return response;
  } catch (error) {
    console.error("오류 발생:", error);
  }
}

module.exports = { askOpenAI };


