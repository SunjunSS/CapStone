const OpenAI = require("openai");
const dotenv = require("dotenv");

// 환경 변수 로드
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // .env 파일에 API 키 저장 필요
});

async function askOpenAI(speakerSpeech, speakerNames, nodeData) {
  try {
    if (!speakerSpeech || !speakerNames) return;

    let formattedSpeech = Object.entries(speakerSpeech)
      .map(([nickname, speechText], index) => {
        let speechBlocks = speechText.split("\n\n");
        return speechBlocks
          .map((block, i) => {
            let lines = block.split("\n");
            if (lines.length < 3) return ""; // SRT 형식이 아닐 경우 무시

            let time = lines[1]; // "00:00:21,000 --> 00:00:28,840"
            let speech = lines.slice(2).join(" "); // 발언 내용만 추출

            return `${time}\n${nickname}: ${speech}`;
          })
          .filter((line) => line) // 빈 줄 제거
          .join("\n\n");
      })
      .join("\n\n");

      console.log(`callOpenAI 노드 데이터: ${nodeData}`)

    let finalPrompt = `
    이 음성 텍스트는 회의 중 기록된 대화입니다. 한국어로 응답해주세요.
    아래 JSON 형식으로 정확하게 응답해주세요.

    {
      "srt": [
        {"time": "발언시간", "speaker": "닉네임", "speech": "발언"},
      ],
      "minutes": {
        "purpose": "회의 목적",
        "topics": ["주요 주제1", "주요 주제2"],
        "next_steps": ["다음 할 일1", "다음 할 일2"],
        "summary": "요약 내용",
        "keywords": ["키워드 1", "키워드 2"],
        "recommendNodes": [{id: , project_id: ,parent_key: , content: "키워드 1", isSelected: false}, {id: , project_id: ,parent_key: , content: "키워드 2", isSelected: false}]
      }
    }

    ### **📌 작업 내용**
    1. **SRT 음성 텍스트 파일을 자연스럽게 수정해주세요. (새로운 내용 창작은 안됩니다!!)**
    2. **화자의 발언 순서를 나타내는 숫자는 생략해주세요.**
    3. **SRT 파일, 노드 데이터를 기반으로 회의록을 작성하세요:**
      - **화자(A, B 등)를 화자 목록에 맞게 바꿔주세요.**
      - **회의 목적**
      - **주요 주제**
      - **다음 할 일**
      - **요약**
      - **키워드: 음성 텍스트 내용에서 중요한 키워드를 추출하세요.**
    4. **추천 노드 제안(recommendNodes)**: 
     - **기존 노드 데이터를 기반으로 가장 적절한 노드를 선택하여 추천하세요.**
     - **새로운 내용을 창작하지 말고, 기존 노드에서 확장할 수 있는 주제를 선택하세요.**
     - **추천 노드는 반드시 기존 노드의 주제와 관련된 내용을 포함해야 합니다.**
     - **각 노드는 기존 노드 중 관련성이 높은 parent_key를 가져야 합니다.**
     - **노드 ID는 auto_increment로 가정하고, project_id는 기존 노드와 동일하게 설정하세요.**
     - **isSelected는 false로 설정하세요.**



    ### 📝 **목표**
    - **음성 텍스트를 분석하여 회의의 목적을 파악**하세요.

    ### 🔍 **입력 데이터**
    #### **화자 목록**
    ${speakerNames.join(", ")}

    #### **SRT 음성 텍스트**
    ${formattedSpeech} 

    #### **현재 노드 데이터**
    ${nodeData}`;
    
    // OpenAI API 호출
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [{ role: "user", content: finalPrompt }],
      max_tokens: 2000,
      response_format: { type: "json_object" }, // JSON 형식으로 반환 요청
    });

    console.log("< OpenAI 응답 >");
    console.log(response.choices[0].message.content);

    // 응답을 JSON 객체로 파싱
    let jsonResponse;
    try {
      jsonResponse = JSON.parse(response.choices[0].message.content);
      console.log("🔹 OpenAI 응답 JSON:", jsonResponse);
    } catch (error) {
      console.error("응답 JSON 파싱 오류:", error);
    }

    // JSON 객체 반환
    return jsonResponse;
  } catch (error) {
    console.error("오류 발생:", error);
  }
}

module.exports = { askOpenAI };
