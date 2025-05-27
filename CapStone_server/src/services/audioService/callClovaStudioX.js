require("dotenv").config();
const axios = require("axios");

const CLOVE_SUMMARIZATION_URL =
  "https://clovastudio.stream.ntruss.com/testapp/v1/api-tools/summarization/v2"
const API_KEY = process.env.CLOVA_API_KEY; // .env 파일에서 API 키를 가져옴

async function askClovaX(texts) {
  try {

    const finalPrompt = '';
    const requestBody = {
      texts: [finalPrompt], // 요약할 텍스트 배열
      autoSentenceSplitter: true, // 문장 분리 허용 여부
      segCount: -1, // 모델이 자동으로 문단 수 조절
      
    };

    const response = await axios.post(CLOVE_SUMMARIZATION_URL, requestBody, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`, // API 인증키
      },
    });

    console.log("요약 결과:", response.data);
    return response; // 요약된 텍스트 반환
  } catch (error) {
    console.error(
      "오류 발생:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
}

module.exports = { askClovaX };