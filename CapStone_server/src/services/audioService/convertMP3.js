const fs = require("fs");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");

async function convertMP3(inputPath, outputPath) {
  console.log("입력 경로 확인:", inputPath);
  console.log("출력 경로 확인:", outputPath);

  // 파일이 존재하는지 확인
  if (!fs.existsSync(inputPath)) {
    console.error("❌ 입력 파일이 존재하지 않습니다:", inputPath);
    throw new Error("입력 파일이 존재하지 않습니다.");
  }

  // 출력 폴더 생성 (없으면 생성)
  const outputDir = path.dirname(outputPath); // 경로에서 폴더 부분만 추출
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true }); // 부모 폴더까지 생성 가능하게
    console.log(`📁 폴더 생성 완료: ${outputDir}`);
  }

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioCodec("libmp3lame") // MP3 코덱 유지
      .output(outputPath)
      .on("end", () => {
        console.log(`✅ MP3 변환 완료: ${outputPath}`);
        resolve(outputPath);
      })
      .on("error", (err) => {
        console.error("❌ MP3 변환 중 오류 발생:", err.message);
        reject(err);
      })
      .run();
  });
}

module.exports = { convertMP3 };
