const OpenAI = require("openai");
const dotenv = require("dotenv");

// 환경 변수 로드
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // .env 파일에 API 키 저장 필요
});

async function askOpenAI(speakerSpeech, speakerNames) {
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

    let finalPrompt = `
    이 음성 텍스트는 회의 중 기록된 대화입니다. 한국어로 응답해주세요.
    아래 JSON 형식으로 정확하게 응답해주세요.

    {
      "srt": [
        {"time": "발언시간", "speaker": "닉네임", "speech": "발언"},
        {"time": "00:00:01,984 --> 00:00:11,770", "speaker": "kiup", "speech": "화자 분리가 잘 되는지 그것은 잘 되고 있습니다. 근데 제가 말하고 hoo님이 말씀하시면은 이것이 서로 겹치는 타이밍을 잘 분류를 해 주는지 그게 중요해요."},
        {"time": "00:00:11,710 --> 00:00:20,970", "speaker": "hoo", "speech": "정말 그렇습니다. 이게 서로 대화가 주고받는 거를 자연스럽게 회의록을 출력을 해줘야 되기 때문인데요. 더 중요한 게 있나요?"},
        {"time": "00:00:20,840 --> 00:00:29,270", "speaker": "kiup", "speech": "근데 더 중요한 것은 타임 출력은 잘 되는 것 같고 화자 분리도 잘 되니까 AI에게 조금 더 맡기는 부분이 중요한 것 같습니다."},
        {"time": "00:00:29,900 --> 00:00:32,920", "speaker": "hoo", "speech": "네 정말 그렇습니다. 음성 종료하겠습니다."}
      ],
      "minutes": {
        "purpose": "회의 목적",
        "topics": ["주요 주제1", "주요 주제2"],
        "next_steps": ["다음 할 일1", "다음 할 일2"],
        "summary": "요약 내용",
        "keywords": ["키워드1", "키워드2"]
      }
    }

    ### **📌 작업 내용**
    1. **SRT 음성 텍스트 파일을 자연스럽게 수정해주세요. (새로운 내용 창작은 안됩니다!!)**
    2. **화자의 발언 순서를 나타내는 숫자는 생략해주세요.**
    3. **SRT 파일을 기반으로 회의록을 작성하세요:**
      - **화자(A, B 등)를 화자 목록에 맞게 바꿔주세요.**
      - **회의 목적**
      - **주요 주제**
      - **다음 할 일**
      - **요약**
      - **키워드**


    ### 📝 **목표**
    - **음성 텍스트를 분석하여 회의의 목적을 파악**하세요.

    ### 🔍 **입력 데이터**
    #### **화자 목록**
    ${speakerNames.join(", ")}

    #### **SRT 음성 텍스트**
    ${formattedSpeech} `;

    // OpenAI API 호출
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [{ role: "user", content: finalPrompt }],
      max_tokens: 1500,
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
