import meetingPDF2 from "./meetingPDF2.js";
import fs from "fs";


const json = {
  speakerNames: ["kiup","문권", "이희찬", "김선준"],
  srt: [
    {
      time: "00:00:01,000 --> 00:00:10,530",
      speaker: "kiup",
      speech:
        "네 안녕하세요. AI 웹 프로젝트에 대해서 이야기해 보겠습니다. 현재 두 가지 주제를 생각을 해봤는데",
    },
    {
      time: "00:00:10,530 --> 00:00:19,870",
      speaker: "kiup",
      speech: "먼저 음성의 웹 프로젝트에 AI가 사용자들 참가자들의",
    },
    {
      time: "00:00:19,870 --> 00:00:24,030",
      speaker: "kiup",
      speech: "분석을 도와주는 것이죠. 그래서 회의를 분석을 해주고",
    },
    {
      time: "00:00:24,220 --> 00:00:33,770",
      speaker: "kiup",
      speech:
        "녹화된 회의를 통해서 효과적인 회의 진행 방안을 제안해주 고 그리고 회의의 진행 흐름과 흐름 분석 그리고 각 멤버들의",
    },
    {
      time: "00:00:33,800 --> 00:00:43,319",
      speaker: "kiup",
      speech: "참여도나 참여도를 분석해주고 이를 통해서",
    },
    {
      time: "00:00:43,319 --> 00:00:51,355",
      speaker: "kiup",
      speech:
        "회의가 멤버들의 참여도 증진과 회의 작업 능률을 향상을 기대할 수 있는 그런 프로젝트를 생각해 봤습니다. 두 번째는 AI 정신감정 의 사인데요.",
    },
    {
      time: "00:00:59,800 --> 00:01:06,044",
      speaker: "kiup",
      speech: "먼저 1차적으로는 AI를 통해서 감정 조절과",
    },
    {
      time: "00:01:06,044 --> 00:01:14,260",
      speaker: "kiup",
      speech:
        "간단한 방 처방이 가능하고 그리고 좀 상황이 안 좋은 경우 에는 의사에게 직접적으로",
    },
    {
      time: "00:01:15,160 --> 00:01:20,980",
      speaker: "kiup",
      speech: "정보를 전달해서 대응이 가능하게 해주는 그런 프로젝트입니다.",
    },
  ],
  minutes: {
    purpose: "AI 웹 프로젝트에 관한 논의",
    topics: [
      "AI를 활용한 회의 분석 도구 개발",
      "AI 기반 정신감정 의사 시스템 개발",
    ],
    next_steps: [
      "회의 분석 도구에 대한 세부 기획안 작성",
      "정신감정  시스템에 대한 초기 프로토타입 개발",
    ],
    summary:
      "AI를 사용하여 회의의 효율을 개선할 수 있는 방안과 정신 건강을 위한 AI 의사 시스템 개발에 관하여 논의했다.",
    keywords: ["AI 웹 프로젝트", "회의 분석", "정신감정 의사", "참여도 분석"],
    recommendNodes: [[Object]],
  },
};

async function downloadPDF() {
  try {
    const doc = await meetingPDF2(json);
    const pdfBuffer = doc.output("arraybuffer");

    fs.writeFileSync("회의록2.pdf", Buffer.from(pdfBuffer));
    console.log("✅ 회의록.pdf 생성 완료 (Node.js 환경)");
  } catch (err) {
    console.error("❌ PDF 생성 중 오류:", err);
  }
}

downloadPDF();