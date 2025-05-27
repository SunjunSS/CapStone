import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function askOpenAIStreaming(prompt) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      stream: true, // ✅ 스트리밍 활성화
    });

    for await (const chunk of response) {
      process.stdout.write(chunk.choices[0]?.delta?.content || ""); // 실시간 출력
    }

    console.log("\n[스트리밍 완료]");
  } catch (error) {
    console.error("오류 발생:", error);
  }
}

module.exports={ askOpenAIStreaming };
