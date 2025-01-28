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
 * 1. 모듈 import : const { convertToMP3 } = require('./convertToMP3');
 * 2. 함수 호출 : convertToMP3(inputFilePath, outputFilePath);
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

async function callClovaSpeechAPI(filePath, requestEntity, secret, invokeUrl) {
  try {
    // 파일이 존재하는지 확인
    if (!fs.existsSync(filePath)) {
      throw new Error("파일이 존재하지 않습니다.");
    }

    // FormData 구성
    const formData = new FormData();
    formData.append("params", JSON.stringify(requestEntity));
    formData.append("media", fs.createReadStream(filePath));

    console.log("요청 파일 경로: ", filePath);

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

    return response.data; // API 응답 반환
  } catch (error) {
    console.error("오류 발생:", error.message);
    throw error;
  }
}

module.exports = { callClovaSpeechAPI };