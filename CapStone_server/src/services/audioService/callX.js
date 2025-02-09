require("dotenv").config();
const axios = require("axios");

const BASE_URL =
  "https://clovastudio.stream.ntruss.com/testapp/v1/chat-completions";
const API_KEY = process.env.CLOVA_API_KEY; // .env 파일에서 API 키를 가져옴

const modelName = 'HCX-003';

async function ClovaX(request) {
  try {
    
    const requestBody = request;

    const response = await axios.post(`${BASE_URL}/${modelName}`, requestBody, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`, // API 인증키
      },
    });

    //console.log("요약 결과:", response.data);
    return response; // 요약된 텍스트 반환
  } catch (error) {
    console.error(
      "오류 발생:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
}

module.exports = { ClovaX };
