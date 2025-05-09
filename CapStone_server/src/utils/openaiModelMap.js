// utils/openaiModelMap.js
const modelMap = {
  코드: "ft:gpt-4o-2024-08-06:personal:node-suggestion-computer:BTYMLEek",
  문학: "gpt-3.5-turbo",
  요약: "gpt-3.5-turbo-16k",
  기술분석: "gpt-4-turbo",
  회의록: "ft:gpt-4o-2024-08-06:personal:meeting-summary:abc123",
  default: "gpt-4-turbo",
};

function getModelByCategory(category) {
  return modelMap[category] || modelMap["default"];
}

module.exports = { getModelByCategory };
