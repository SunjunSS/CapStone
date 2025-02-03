import OpenAI from "openai";
import dotenv from "dotenv";

// 환경 변수 로드 (.env 파일 필요)
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // .env 파일에 API 키 저장 필요
});

async function askOpenAI(prompt) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4", // 또는 "gpt-3.5-turbo"
      messages: [{ role: "user", content: prompt }],
      max_tokens: 100,
    });

    console.log("OpenAI 응답:", response.choices[0].message.content);
  } catch (error) {
    console.error("오류 발생:", error);
  }
}

module.exports = { askOpenAI };


