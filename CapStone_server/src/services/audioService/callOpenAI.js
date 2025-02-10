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
    이 음성 텍스트는 회의 중 기록된 대화입니다. 한국어로 응답해주세요.

    ### 📝 **목표**
    - **음성 텍스트를 분석하여 회의의 목적을 파악**하세요.
   

    ### 🔍 **입력 데이터**
    #### **음성 텍스트**
    ${prompt}

  
    ---

    ### **📌 작업 내용**
    1. **음성 텍스트를 자연스럽게 수정한 SRT 파일을 반환하세요.**
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


