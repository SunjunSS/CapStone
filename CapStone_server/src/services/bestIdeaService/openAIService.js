const axios = require("axios");
require("dotenv").config();

const API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

async function getBestMindmapIdeas(nodeList, count = 5) {
  if (!nodeList || nodeList.length === 0) {
    throw new Error("노드 목록이 비어 있습니다.");
  }

  const formattedNodes = nodeList.map((node) => `- ${node}`).join("\n");

  const prompt = `
    당신은 마인드맵 분석 및 주제 추천 전문가입니다.
    
    마인드맵 노드 목록을 분석하고, 중요한 35~36자 길이의 추천 주제를 ${count}개 생성하세요.
    
    마인드맵 노드 목록:
    ${formattedNodes}
    
    ===글자 수 지침===
    • 중요: 각 주제는 공백 포함 정확히 35~36자여야 합니다. 이 지침을 엄격히 준수하세요.
    • 글자 수는 출력에 포함하지 마세요. 주제 텍스트만 작성하세요.
    • 34자 이하는 절대 허용되지 않습니다.
    
    ===형식 지침===
    • 번호나 기호 없이 각 주제를 별도 줄에 작성하세요.
    • 다음 템플릿을 사용하세요: 
      "[기술/방법론] + [을/를] + [활용한/기반으로 한] + [구체적인 응용 분야] + [을/를 위한] + [기대 효과/특징] + [시스템/방법론/도구]"
    
    ===내용 지침===
    • 구체적이고 실용적인 주제를 제안하세요.
    • "효과적인", "혁신적인", "최적화된"과 같은 수식어를 사용하세요.
    • "~을 위한", "~을 통한", "~에 기반한" 등의 연결 표현을 반드시 사용하세요.
    
    ###올바른 주제 예시###
    인공지능을 이용한 동작 및 제스처 분석을 통한 연기 교육 개선 방법
    영화 및 연극 제작에서의 AI 지원 카메라 및 장면 전환 최적화 기술
    연극 및 영화 제작에 있어 AI 기반의 대본 및 장면 최적화 도구 개발
    디지털 연극 교육을 위한 AI 기반 대본 분석 및 캐릭터 개발 도구
    
    ###잘못된 주제 예시###
    AI 연기 지도를 위한 감정 반응 시스템 (너무 짧음!)
    실시간 대화 패턴 예측 및 분석 도구 (너무 짧음!)
    
    ###주제 확장 방법###
    • 짧은 주제: "AI 기반 실시간 번역 시스템"
      확장된 주제: "다국어 환경에서 AI 기반 실시간 번역 시스템을 통한 효과적인 의사소통 도구 개발"
    
    • 짧은 주제: "감정 인식 연기 지도 도구"
      확장된 주제: "인공지능 기반 감정 인식 기술을 활용한 실시간 연기 지도 및 피드백 시스템 개발"
    
    ###출력 형식###
    (각 주제를 별도의 줄에 작성하고, 글자 수 표시나 부가 설명 없이 35-36자 길이의 주제만 나열하세요)
    
    위 지침에 따라 각 줄에 하나의 주제만 작성하고, 정확히 ${count}개의 주제를 나열해주세요.
    모든 주제는 반드시 35~36자(공백 포함)여야 합니다.
    
    각 주제 생성 전에 글자 수를 미리 계산하고, 정확히 35-36자가 되도록 조정하세요. 이 지침을 엄격히 준수하는 것이 매우 중요합니다.
`;

  try {
    const response = await axios.post(
      OPENAI_URL,
      {
        model: "gpt-4-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 300,
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const resultText = response.data.choices[0].message.content;
    console.log("API 응답 원본:", resultText); // 디버깅용 로그

    // 줄바꿈으로 분리하여 각 주제를 추출하고 글자 수 확인 및 조정
    const ideas = resultText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0) // 빈 줄 제거
      .filter((line) => !line.match(/^\d+$|글자 수|characters/i)) // 글자 수만 있는 줄 제거
      .map((topic) => {
        // 혹시 번호나 기호가 있을 경우 제거
        const cleanTopic = topic.replace(/^[\d\.\-\*\•]+\s*/, "");

        // 글자 수 로깅 (디버깅용)
        console.log(`주제: "${cleanTopic}", 글자 수: ${cleanTopic.length}`);

        // 글자 수 체크 및 조정 (35-36자 범위로)
        let finalTopic = cleanTopic;

        if (finalTopic.length > 36) {
          // 36자보다 길면 36자로 잘라내기
          finalTopic = finalTopic.substring(0, 36);
          console.log(
            `조정됨(축소): "${finalTopic}", 글자 수: ${finalTopic.length}`
          );
        } else if (finalTopic.length < 35) {
          // 35자보다 짧으면 무시하거나 로그 남기기
          console.log(`경고: 주제가 35자 미만입니다. 원본 유지`);
        }

        return {
          bestNode: finalTopic, // 조정된 주제 사용
          improvedIdea: "", // improvedIdea는 빈 문자열로 설정
        };
      })
      .slice(0, count); // 요청한 개수만큼만 반환

    // 충분한 주제가 생성되지 않았을 경우 로그
    if (ideas.length < count) {
      console.warn(
        `경고: 요청한 ${count}개보다 적은 ${ideas.length}개의 주제가 생성되었습니다.`
      );
    }

    console.log("파싱된 아이디어:", ideas); // 디버깅용 로그
    return ideas;
  } catch (error) {
    console.error("OpenAI 요청 실패:", error);
    return [];
  }
}

module.exports = { getBestMindmapIdeas };
