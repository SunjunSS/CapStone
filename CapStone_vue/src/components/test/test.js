import parseSRT  from "./parseSRT.js";

const ai = {
  srt: [
    {
      time: "00:00:00,000 --> 00:00:08,680",
      speaker: "hoo",
      speech:
        "안녕하세요. 음성 텍스트가 잘 출력되는지, 그리고 패싱이 프런트에서 잘 되는지가 중요합니다.",
    },
    {
      time: "00:00:09,260 --> 00:00:18,560",
      speaker: "kiup",
      speech:
        "네 맞습니다. 일단은 출력이 잘 되고 JSON 객체로 잘 응답을 받기 때문에 그것을 파싱하는 과정이 잘 진행되면 될 것 같습니다.",
    },
    {
      time: "00:00:20,350 --> 00:00:26,250",
      speaker: "hoo",
      speech:
        "네 맞습니다. 그래서 기업과 호흡이 각 닉네임에 따라서 잘 출력되는지를 확인해 보겠습니다.",
    },
  ],
  minutes: {
    purpose: "프로젝트의 기술적 세부사항 검토",
    topics: ["음성 텍스트 출력의 정확성", "JSON 파싱과 프 런트엔드 처리"],
    next_steps: ["출력 문제 해결", "파싱 과정 최적화"],
    summary:
      "회의에서는 음성 텍스트 출력의 정확성과 JSON 파싱, 프런트엔드에서의 처리 방법을 논의했습니다. 특히, 기술 적 세부사항에 대한 점검과 개선 방향을 설정하였습니다.",
    keywords: ["음성 텍스트 출력", "JSON 파싱"],
  },
};

const response = parseSRT(ai);
console.log(response);
