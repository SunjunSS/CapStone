// utils/openaiModelMap.js
const modelMap = {
  컴퓨터공학: "ft:gpt-4o-2024-08-06:personal:node-suggestion-computer:Baie1E4c",
  기계전자공학:
    "ft:gpt-4o-2024-08-06:personal:node-suggestion-machine:BUfyWj7w",
  디자인및예술: "ft:gpt-4o-2024-08-06:personal:node-suggestion-design:BV4Eugbl",
  인문사회및경영:
    "ft:gpt-4o-2024-08-06:personal:node-suggestion-society:BWNRFOxN",
  융합및교양교육:
    "ft:gpt-4o-2024-08-06:personal:node-suggestion-liberal:BWlG5Zp9",
  default: "ft:gpt-4o-2024-08-06:personal:node-suggestion-computer:BTYMLEek",
};

function getModelByCategory(category) {
  return modelMap[category] || modelMap["default"];
}

module.exports = { getModelByCategory };
