const axios = require("axios");
require("dotenv").config();

const API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

async function getBestMindmapIdeas(nodeList, count = 3) {
  if (!nodeList || nodeList.length === 0) {
    throw new Error("노드 목록이 비어 있습니다.");
  }

  const formattedNodes = nodeList.map((node) => `- ${node}`).join("\n");

  const prompt = `
    당신은 마인드맵 분석 및 주제 추천 전문가입니다.
    
    사용자가 작성한 마인드맵의 노드 목록을 분석하고, 노드를 바탕으로 추천할 수 있는 훌륭한 주제 ${count}개를 제안해주세요.
    
    마인드맵 노드 목록:
    ${formattedNodes}
    
    다음 규칙을 정확히 따라주세요:
    
    1. 각 추천 주제는 간결하고 명확한 한 문장으로 작성해주세요.
    2. 추천 주제 앞에 번호나 기호를 붙이지 마세요.
    3. "개선된 아이디어:", "Best Idea:", "추천 주제:" 등의 접두어를 사용하지 마세요.
    4. 각 추천 주제는 독립적인 줄에 작성하세요.
    5. 추천 주제는 구체적이고 실현 가능하며 가치 있는 아이디어여야 합니다.
    
    응답 예시:
    디지털 트랜스포메이션과 기업의 미래
    인공지능이 바꿀 미래 산업 구조
    지속가능한 비즈니스 모델 구축 전략
    
    위 예시처럼 각 줄에 하나의 주제만 작성하고, 번호나 추가 설명 없이 정확히 ${count}개의 주제만 나열해주세요.
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

    // 줄바꿈으로 분리하여 각 주제를 추출
    const ideas = resultText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0) // 빈 줄 제거
      .map((topic) => {
        // 혹시 번호나 기호가 있을 경우 제거
        const cleanTopic = topic.replace(/^[\d\.\-\*\•]+\s*/, "");
        return {
          bestNode: cleanTopic, // 주제 자체를 bestNode로 사용
          improvedIdea: "", // improvedIdea는 빈 문자열로 설정
        };
      });

    console.log("파싱된 아이디어:", ideas); // 디버깅용 로그
    return ideas;
  } catch (error) {
    console.error("OpenAI 요청 실패:", error);
    return [];
  }
}

module.exports = { getBestMindmapIdeas };
