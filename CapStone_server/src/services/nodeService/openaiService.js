const axios = require("axios");
require("dotenv").config();

const API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

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
  relatedNodes
) {
  const prompt = `
    The user is creating a mind map.
    The main topic of this project (root node) is: "${rootTopic}".
    The selected node is: "${selectedNode}".
    This node is under the parent node: "${parentNode}".
    Existing nodes in the mind map: ${relatedNodes.join(", ")}.

    Please suggest three subtopics for "${selectedNode}" that logically follow from its context.
    Ensure that the suggested subtopics are relevant to both "${selectedNode}" and its parent node "${parentNode}".

    Respond in Korean.
  `;

  try {
    const response = await axios.post(
      OPENAI_URL,
      {
        model: "gpt-4",
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
      .filter(Boolean);
    return suggestions;
  } catch (error) {
    console.error("OpenAI API 요청 실패:", error);
    return [];
  }
}

module.exports = { getMindmapSuggestions };
