// utils/openaiModelMap.js
const modelMap = {
  컴퓨터공학: "ft:gpt-4o-2024-08-06:personal:node-suggestion-computer:BTYMLEek",
  문학: "",
  요약: "",
  기술분석: "",
  회의록: "",
  default: "gpt-4o",
};

function getModelByCategory(category) {
  return modelMap[category] || modelMap["default"];
}

module.exports = { getModelByCategory };
