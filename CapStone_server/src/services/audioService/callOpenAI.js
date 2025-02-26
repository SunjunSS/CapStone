const OpenAI = require("openai");
const dotenv = require("dotenv");

// 환경 변수 로드 (.env 파일 필요)
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // .env 파일에 API 키 저장 필요
});

async function askOpenAI(prompt, mindMap = null) {
  try {
    if (!prompt) return;

    // 📝 mindMap 데이터 여부에 따라 프롬프트 선택
    let finalPrompt = "";

    if (mindMap) {
      // ✅ mindMap 데이터가 있을 경우 (노드 생성 요청)
      finalPrompt = `
      이 음성 텍스트는 회의 중 기록된 대화입니다. 또한 아래의 마인드맵 노드는 회의 중 작성된 노드입니다.
      마인드맵 노드의 텍스트를 키워드로 고려하고, 음성 텍스트의 내용을 반영하여 **새롭게 추가할 만한 노드를 최대 2개까지만** 생성해주세요.

      음성 텍스트:
      ${prompt}

      마인드맵 노드:
      ${mindMap}

      응답은 아래 형식으로 반환해주세요:
      ---
      ### 추가할 노드 (최대 2개)
      - [노드1]
      - [노드2] (노드가 2개 미만이면 적절한 개수만 반환)
      `;
    } else {
      // ✅ mindMap 데이터가 없을 경우 (기본 회의록 생성)
      finalPrompt = `
      이 음성 텍스트는 회의 중 기록된 대화입니다. 한국어로 응답해주세요.

      ### 📝 **목표**
      - **음성 텍스트를 분석하여 회의의 목적을 파악**하세요.

      ### 🔍 **입력 데이터**
      #### **음성 텍스트**
      ${prompt}

      --- 

      ### **📌 작업 내용**
      1. **SRT 음성 텍스트 파일을 그대로 반환하세요 (수정하면 안됨!)**
      2. **SRT 파일을 기반으로 회의록을 작성하세요:**
        - **회의 목적**
        - **주요 주제**
        - **다음 할 일**
        - **요약**
        - **키워드**

      응답은 아래 형식으로 반환해주세요:
      ---
      ### SRT 파일:
      <SRT 내용>

      ---
      ### 회의록:
      **주요 주제**
      - [내용]

      **다음 할 일**
      - [내용]

      **요약**
      [간단한 요약 내용]
      ---
      ### 키워드 

      ** 주요 키워드**
      [키워드 목록]
      ---
      `;
    }

    // OpenAI API 호출
    const response = await openai.chat.completions.create({
      model: "gpt-4", // 또는 "gpt-3.5-turbo"
      messages: [{ role: "user", content: finalPrompt }],
      max_tokens: 1000,
    });

    console.log("OpenAI 응답:", response.choices[0].message.content);

    return response.choices[0].message.content;
  } catch (error) {
    console.error("오류 발생:", error);
  }
}

module.exports = { askOpenAI };
