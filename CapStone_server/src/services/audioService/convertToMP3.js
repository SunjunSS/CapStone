// /**
//  * @파일명 convertToMP3.js
//  * 
//  * @함수정보 
//  *  audio파일을 mp3파일로 변환해주는 함수
//  * 
//  * @날짜 2025-01-27
//  * 
//  * @사용법 
//  * 1. 모듈 import : const { convertToMP3 } = require('./convertToMP3');
//  * 2. 함수 호출 : convertToMP3(inputFilePath, outputFilePath);
//  * 
//  * @매개변수
//  * 1. fileBuffer : 파일 데이터를 나타내는 변수 (이미 mp3일 경우 저장 경로에 저장할 데이터)
//  * 2. fileName : 확장자를 포함한 파일의 이름
//  * 
//  * @사용예시
//  * const { convertToMP3 } = require('./convertToMP3');
//  * convertToMP3('./input.wav', './output.mp3')
//  *   .then(() => console.log('Conversion successful!'))
//  *   .catch(err => console.error('Error during conversion:', err));
//  * 
//  * @설치해야할것
//  * - ffmpeg: Ensure ffmpeg is installed and accessible via the command line.
//  * 
//  * @메모
//  * - The function supports popular audio formats like WAV and OGG.
//  * - Error handling included for file not found or unsupported formats.
//  */

const fs = require("fs");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");


async function convertToMP3(inputPath, outputPath) {
  // audio 폴더가 없는 경우 생성 (비동기 방식으로 생성)

  const originalFormat = path.extname(inputPath); // 파일 확장자 추출

  //console.log("변환할 파일: ", fileName);
  console.log("입력 경로 확인: ", inputPath); // 경로 확인

  // const outputPath = path.join(
  //   noFileOutputPath,
  //   `${Date.now()}.mp3` // 파일 이름에서 확장자 제외하고 .mp3로 설정
  // );

  console.log("Output path for MP3:", outputPath);

  // 파일이 존재하는지 확인
  if (!fs.existsSync(inputPath)) {
    console.error("입력 파일이 존재하지 않습니다:", inputPath);
    throw new Error("입력 파일이 존재하지 않습니다.");
  }

  if (originalFormat.toLowerCase() !== ".mp3") {
    // MP3로 변환
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .output(outputPath) // 출력 파일 경로 지정
        .on("end", () => {
          console.log(`File converted to MP3: ${outputPath}`);
          resolve(outputPath); // 변환된 파일 경로 반환
        })
        .on("error", (err) => {
          console.error("Error converting file to MP3:", err.message);
          reject(err);
        })
        .run(); // ffmpeg 명령어 실행
    });
  } else {
    try {
      await fs.writeFile(outputPath, inputPath); // 파일 비동기 저장
      console.log(`File already in MP3 format: ${mp3Path}`);
      return mp3Path; // 저장된 MP3 파일 경로 반환
    } catch (err) {
      console.error("Error saving MP3 file:", err.message);
      throw err;
    }
  }
}


module.exports = {convertToMP3};