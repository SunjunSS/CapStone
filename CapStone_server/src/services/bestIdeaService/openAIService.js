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
    
    사용자가 작성한 마인드맵의 노드 목록을 분석하고, 가장 가치 있는 주제 ${count}개를 추천해주세요.
    
    마인드맵 노드 목록:
    ${formattedNodes}
    
    다음 규칙에 따라 정확히 ${count}개의 주제를 추천해주세요:
    
    1. 각 추천 주제는 마인드맵의 노드를 바탕으로 하되, 이를 확장하고 개선해야 합니다.
    2. 추천 주제는 구체적이고 실현 가능하며 가치 있는 아이디어여야 합니다.
    3. 각 추천 주제는 "주제명: 주제 설명" 형식으로 작성해주세요.
    4. "개선된 아이디어:", "Best Idea:" 등의 접두어는 사용하지 마세요.
    
    출력 형식:
    1. 추천 주제 1명: 추천 주제 1에 대한 자세한 설명
    2. 추천 주제 2명: 추천 주제 2에 대한 자세한 설명
    3. 추천 주제 3명: 추천 주제 3에 대한 자세한 설명
    
    답변은 위의 형식을 정확히 따라야 하며, 번호와 주제명, 설명 외에 다른 부가 설명이나 인사말은 포함하지 마세요.
  `;

  try {
    const response = await axios.post(
      OPENAI_URL,
      {
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 800, // 더 긴 설명을 위해 토큰 수 증가
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

    // 결과를 파싱하여 각 아이디어 분리
    const sections = resultText.split(/\d+\.\s+/).filter(Boolean);

    // 각 섹션에서 주제명과 설명 추출
    const ideas = sections.map((section) => {
      // "주제명: 설명" 형식으로 분리
      const match = section.trim().match(/^([^:]+):\s*(.*)/s);

      if (match && match.length >= 3) {
        const bestNode = match[1].trim(); // 주제명
        const improvedIdea = match[2].trim(); // 설명
        return { bestNode, improvedIdea };
      } else {
        // 형식이 맞지 않을 경우 전체 내용을 설명으로 간주
        console.warn("형식이 맞지 않는 응답:", section);
        return {
          bestNode: "추천 주제",
          improvedIdea: section.trim(),
        };
      }
    });

    console.log("파싱된 아이디어:", ideas); // 디버깅용 로그
    return ideas;
  } catch (error) {
    console.error("OpenAI 요청 실패:", error);
    return [];
  }
}

module.exports = { getBestMindmapIdeas };
