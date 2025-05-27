const axios = require("axios");
require("dotenv").config();

const API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

const { getModelByCategory } = require("../../utils/openaiModelMap");

/**
 * 특정 부모 노드(주제)와 클릭한 노드를 기반으로 하위 노드 추천
 * @param {string} rootTopic - 프로젝트의 주제 (루트 노드의 내용)
 * @param {string} selectedNode - 사용자가 클릭한 노드
 * @param {array} relatedNodes - 기존 노드 목록
 * @returns {Promise<string[]>} - AI가 추천하는 아이디어 목록
 */
async function getMindmapSuggestions(
  rootTopic,
  selectedNode,
  parentNode,
  relatedNodes,
  category = "default" // 프론트에서 전달된 카테고리
) {
  const prompt = `
"${selectedNode}"의 하위 주제로 적절한 키워드 5개를 추천해주세요.

🛑 매우 중요: **모든 소단어는 반드시 한글 또는 영어 기준 "5글자 이하"**여야 합니다. 이 조건은 절대로 어겨서는 안 됩니다!

조건:
- 각 키워드는 2~4개의 소단어로 구성하여 구체적이고 전문적인 내용을 담아주세요.
- 각 소단어는 한글/영어 기준 반드시 5글자 이하여야 합니다(특수문자와 괄호만 글자 수에 포함하지 않음).
- 소단어는 의미 단위로 자연스럽게 분리되어야 합니다.
- 예: "사용자(UX) 경험 분석"에서 소단어는 "사용자(UX)", "경험", "분석"이며, 
  "사용자(UX)"는 괄호를 제외하고 "사용자"(3글자)와 "UX"(2글자)를 합쳐 5글자이므로 허용됩니다.

중요: 다음 규칙을 반드시 적용하세요.

1. 모든 키워드는 최대한 자연스러운 띄어쓰기로 분리해야 합니다:
   * "하이퍼파라미터튜닝" → "하이퍼 파라미터 튜닝" (3개 단어로 분리)
   * "머신러닝알고리즘" → "머신러닝 알고리즘" (2개 단어로 분리)
   * "딥러닝모델학습" → "딥러닝 모델 학습" (3개 단어로 분리)
   * "사용자인터페이스" → "사용자 인터페이스" (2개 단어로 분리)
   * "데이터시각화도구" → "데이터 시각화 도구" (3개 단어로 분리)
   * "퍼포먼스최적화전략" → "퍼포먼스 최적화 전략" (3개 단어로 분리)

2. 각 소단어가 5글자를 초과하는 경우는 반드시 다른 단어로 대체하세요:
   * "트랜스포메이션" → "변환" (7글자→2글자로)
   * "커뮤니케이션" → "소통" (6글자→2글자로)
   * "비주얼라이제이션" → "시각화" (8글자→3글자로)
   * "로컬라이제이션" → "현지화" (7글자→3글자로)
   * "인터내셔널" → "국제" (6글자→2글자로)
   * "퍼포먼스"는 5글자이므로 그대로 사용
   * "인터페이스"는 5글자이므로 그대로 사용

⚠️ "글자 수"란 **한글의 자음+모음을 결합한 완성형 음절 기준**입니다.  
예: "로컬라이제이션"은 한글 음절 7자 → **7글자**로 계산합니다.  
**반드시 모든 소단어는 완성된 한글 기준으로 5글자를 초과하지 않아야 합니다!**

3. "데이터", "앱", "웹", "AI", "UX", "UI" 등 실무에서 자주 사용되는 외래어는 5글자 이하면 허용합니다.
4. 특수문자와 괄호는 사용 가능하며, 글자 수 계산에서 제외됩니다.
5. 다음 키워드는 이미 존재하므로 추천에서 제외해주세요: ${relatedNodes.join(
    ", "
  )}

잘못된 예: "데이터 트랜스포메이션", "인터랙티브 비주얼라이제이션"
올바른 예: "데이터 변환", "대화형 시각화"

아래와 같이 단어 1~2개로만 구성된 단순한 키워드는 피하고, 여러 소단어를 조합한 구체적인 키워드를 생성하세요:
✗ "데이터 시각화" (너무 단순함)
✗ "그래프 네트워크" (너무 단순함)
✗ "ARIMA 모델" (너무 단순함)

대신 아래와 같이 여러 소단어로 구성된 구체적인 키워드를 생성하세요:
✓ "모바일 머신러닝 적용" (3개 소단어)
✓ "보안 및 인증 시스템" (4개 소단어)
✓ "실시간 데이터 처리" (3개 소단어)
✓ "크로스 플랫폼 개발" (3개 소단어)
✓ "사용자 경험(UX) 최적화" (3개 소단어)

출력 형식:
- 키워드1
- 키워드2
- 키워드3
- 키워드4
- 키워드5
`;

  const model = getModelByCategory(category);

  console.log("적용된 open ai 모델은 : ", model);

  try {
    const response = await axios.post(
      OPENAI_URL,
      {
        model,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 150,
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const suggestions = response.data.choices[0].message.content
      .split("\n")
      .map((line) => line.replace(/^[-•]\s*/, "").trim())
      .filter(Boolean);
    return suggestions;
  } catch (error) {
    console.error("OpenAI API 요청 실패:", error);
    return [];
  }
}

/**
 * 프로젝트 내 모든 노드를 분석하여 가장 중요한 노드를 선택하고 보완하는 AI 요청
 * @param {string[]} nodeList - 프로젝트의 모든 노드 리스트
 * @returns {Promise<{bestNode: string, improvedIdea: string}>} - 선택된 중요한 노드와 보완된 아이디어
 */
async function getBestMindmapIdea(nodeList, rootNode) {
  if (!nodeList || nodeList.length === 0) {
    throw new Error("노드 목록이 비어 있습니다.");
  }

  // 🔥 루트 노드 제외하고 AI에 전달할 리스트 생성
  const filteredNodes = nodeList.filter((node) => node !== rootNode);

  if (filteredNodes.length === 0) {
    throw new Error("루트 노드를 제외한 노드가 없습니다.");
  }

  const formattedNodes = filteredNodes.map((node) => `- ${node}`).join("\n");

  const prompt = `
    The user is working on a mind map for a project.
    The project contains the following ideas (excluding the main topic):

    ${formattedNodes}

    Based on this, please do the following:
    1. Select the most important idea from the list above (Do NOT select the main topic).
    2. Improve the selected idea by adding more details, refining its concept, or making it more practical.
    
    Respond in Korean, and output the result as:
    - Best Idea: (selected node)
    - Improved Idea: (enhanced version)
  `;

  try {
    const response = await axios.post(
      OPENAI_URL,
      {
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 200,
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
    const [bestNode, improvedIdea] = resultText
      .split("\n")
      .map((line) =>
        line.replace(/^(Best Idea:|Improved Idea:)\s*/, "").trim()
      );

    return { bestNode, improvedIdea };
  } catch (error) {
    console.error("OpenAI 요청 실패:", error);
    return { bestNode: "", improvedIdea: "" };
  }
}

module.exports = { getMindmapSuggestions, getBestMindmapIdea };
