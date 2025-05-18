const axios = require("axios");
require("dotenv").config();

const API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
/**
 * 프로젝트 내 모든 노드를 분석하여 가장 중요한 노드를 선택하고 보완하는 AI 요청
 * @param {string[]} nodeList - 프로젝트의 모든 노드 리스트
 * @returns {Promise<{bestNode: string, improvedIdea: string}>} - 선택된 중요한 노드와 보완된 아이디어
 */
async function getBestMindmapIdea(nodeList) {
  if (!nodeList || nodeList.length === 0) {
    throw new Error("노드 목록이 비어 있습니다.");
  }

  const formattedNodes = nodeList.map((node) => `- ${node}`).join("\n");

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

module.exports = { getBestMindmapIdea };
