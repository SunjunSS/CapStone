const OpenAI = require("openai");
const dotenv = require("dotenv");

// 환경 변수 로드 (.env 파일 필요)
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // .env 파일에 API 키 저장 필요
});

async function askOpenAI(prompt, speakers) {
  try {
    if (!prompt || !speakers) return;

    // 화자 이름을 순차적으로 반영하는 로직
    let updatedPrompt = prompt;
    const speakerList = speakers.split(", "); // 화자 이름 배열로 변환
    let speakerIndex = 0;

    // 텍스트 내의 화자(예: A, B, C)를 화자 이름으로 변경
    updatedPrompt = updatedPrompt.replace(/([A-Za-z0-9가-힣]+)/g, (match) => {
      const speaker = speakerList[speakerIndex] || "Unknown"; // 화자 이름 없으면 "Unknown"
      speakerIndex = (speakerIndex + 1) % speakerList.length; // 화자 이름 순차적으로 교체
      return `${speaker}: ${match}`;
    });

    // 📝 mindMap 데이터 여부에 따라 프롬프트 선택
    const finalPrompt = `이 음성 텍스트는 회의 중 기록된 대화입니다. 한국어로 응답해주세요.

    ### 📝 **목표**
    - **음성 텍스트를 분석하여 회의의 목적을 파악**하세요.

    ### 🔍 **입력 데이터**
    #### **음성 텍스트**
    ${updatedPrompt}

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

    **주요 키워드**
    [키워드 목록]
    ---`;

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
