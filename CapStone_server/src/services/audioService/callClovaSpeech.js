/**
 * @파일명 callClovaSpeech.js
 * 
 * @함수정보 
 *  네이버 클로바 speech api를 호출하는 함수 
 *  mp3파일을 로컬방식으로 전송하여 텍스트로 변환된 결과를 받습니다.
 * 
 * @날짜 2025-01-27
 * 
 * @사용법 
 * 1. 모듈 import : const { callClovaSpeechAPI } = require("./services/callClovaSpeech")
 * 2. 함수 호출 : callClovaSpeechAPI(filePath, requestEntity, secret, invokeUrl)
 * 
 * @매개변수
 * 1. filePath : 전송할 mp3파일의 경로
 * 2. requestEntity : api요청 시 요청양식을 작성하는 매개변수
 * 3. secret : secret 키 (클라우드 플랫폼내에 도메인 생성 시 주어지는 키)
 * 4. invokeUrl : invokeUrl (호출 url, 도메인 생성 시 주어지는 키)
 * 
 * 
 * @사용예시
 * 
 * 
 * 
 * @설치해야할것
 * 
 * 
 * 
 * @메모
 * 
 */

// fs 호출
require("dotenv").config();
const FormData = require("form-data");
const axios = require("axios");
const fs = require("fs");


// 클로바 스피치 API 호출
const secret = process.env.SECRET;
const invokeUrl = process.env.INVOKE_URL;
 

async function callClovaSpeechAPI(filePath) {
  try {
    // 요청 설정
    const requestEntity = {
      language: "ko-KR",
      completion: "sync",
      wordAlignment: true,
      fullText: true,
      noiseFiltering: true,
      diarization: {
        enable: true,
      },
      format: "SRT",
    };

    // 파일이 존재하는지 확인
    if (!fs.existsSync(filePath)) {
      throw new Error("파일이 존재하지 않습니다.");
    }

    console.log(`파일경로: ${filePath}`);

    if (!invokeUrl) {
      console.log("INVOKE_URL:", invokeUrl);
      console.error("INVOKE_URL 환경 변수가 설정되지 않았습니다.");
      return;
    }

    // FormData 구성
    const formData = new FormData();
    formData.append("params", JSON.stringify(requestEntity));
    formData.append("media", fs.createReadStream(filePath));
    // formData.append("format", SRT);

    // API 호출
    const response = await axios.post(
      `${invokeUrl}/recognizer/upload`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          "X-CLOVASPEECH-API-KEY": secret,
          Accept: "application/json",
        },
      }
    );

    console.log("HTTP 응답 코드:", response.status);

    // ✅ SRT 시간 포맷에서 밀리초 제거
    let rawSrt = response.data;

    // 00:00:35,318 --> 00:00:42,800 이런 형식에서 ,뒤 제거
    let cleanedSrt = rawSrt.replace(/(\d{2}:\d{2}:\d{2}),\d{3}/g, "$1");

    console.log("밀리초 제거된 SRT 결과:\n", cleanedSrt);
    console.log("---------------------------");

    return cleanedSrt;

    // // ✅ 응답 데이터가 SRT 형식이라면, 단순 출력
    // console.log("SRT 변환 결과:\n", response.data);
    // console.log("---------------------------");
    // // console.log("SRT 변환 결과:\n", response);

    // return response.data; // API 응답 반환
  } catch (error) {
    console.error("오류 발생:", error.message);
    throw error;
  }
}

module.exports = { callClovaSpeechAPI };