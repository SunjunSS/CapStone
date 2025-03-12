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
    The mind map currently contains the following existing nodes: ${relatedNodes.join(
      ", "
    )}.

    Please suggest three subtopics that logically fit under "${selectedNode}" while considering the existing nodes.
    The suggested subtopics should:
    - Be directly related to both "${selectedNode}" and its parent node "${parentNode}".
    - Represent meaningful categories, themes, or important concepts related to "${selectedNode}".
    - Be concise and provided as keywords only (avoid long sentences or explanations).
  
    Respond in Korean, listing only the keywords as the final output.
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
  const filteredNodes = nodeList.filter(node => node !== rootNode);

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
      .map((line) => line.replace(/^(Best Idea:|Improved Idea:)\s*/, "").trim());

    return { bestNode, improvedIdea };
  } catch (error) {
    console.error("OpenAI 요청 실패:", error);
    return { bestNode: "", improvedIdea: "" };
  }
}


module.exports = { getMindmapSuggestions,getBestMindmapIdea };
