/**
 * @파일명 convertToMP3.js
 * 
 * @함수정보 
 *  audio파일을 mp3파일로 변환해주는 함수
 * 
 * @날짜 2025-01-27
 * 
 * @사용법 
 * 1. 모듈 import : const { convertToMP3 } = require('./convertToMP3');
 * 2. 함수 호출 : convertToMP3(inputFilePath, outputFilePath);
 * 
 * @매개변수
 * 1. fileBuffer : 파일 데이터를 나타내는 변수 (이미 mp3일 경우 저장 경로에 저장할 데이터)
 * 2. fileName : 확장자를 포함한 파일의 이름
 * 
 * @사용예시
 * const { convertToMP3 } = require('./convertToMP3');
 * convertToMP3('./input.wav', './output.mp3')
 *   .then(() => console.log('Conversion successful!'))
 *   .catch(err => console.error('Error during conversion:', err));
 * 
 * @설치해야할것
 * - ffmpeg: Ensure ffmpeg is installed and accessible via the command line.
 * 
 * @메모
 * - The function supports popular audio formats like WAV and OGG.
 * - Error handling included for file not found or unsupported formats.
 */

const fs = require("fs");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");


async function convertToMP3(fileBuffer, fileName) {
  const tempAudioFolder = path.join(__dirname, "../../storage/temp_audio");
  const audioFolder = path.join(__dirname, "../../storage/audio");

  const originalFormat = path.extname(fileName); // 파일 확장자 추출

  const getFormattedTime = () => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    return `${hours}-${minutes}-${seconds}`;
  };

  const timestamp = getFormattedTime(); // 타임스탬프 한 번만 생성

  // # 1. 원본 파일저장 (temp_audio)
  const tempFileName = `${timestamp}.wav`; // "12-23-10.wav" 형식
  const tempFilePath = path.join(tempAudioFolder, tempFileName);



  try {
    await fs.promises.writeFile(tempFilePath, fileBuffer); // 임시 파일 저장
    console.log(`Temp audio file saved: ${tempFilePath}`);

    // 2. MP3 변환 파일 저장 (audio)
    const outputFileName = `${timestamp}.mp3`; // 변환된 mp3 파일 이름
    const outputPath = path.join(audioFolder, outputFileName);
    console.log("Output path for MP3:", outputPath);

    if (originalFormat.toLowerCase() !== ".mp3") {
      // MP3로 변환
      return new Promise((resolve, reject) => {
        ffmpeg(tempFilePath)
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
      // 이미 MP3 파일인 경우 바로 저장

      await fs.promises.writeFile(outputPath, fileBuffer); // 파일 비동기 저장
      console.log(`File already in MP3 format: ${outputPath}`);
      return outputPath; // 저장된 MP3 파일 경로 반환
    }
  } catch (err) {
    console.error("Error saving MP3 file:", err.message);
    throw err;
  }
}



module.exports = {convertToMP3};