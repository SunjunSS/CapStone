const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const path = require("path");

// mixAudio 함수: 주어진 폴더 경로 내의 모든 .wav 파일을 하나로 믹싱
async function mixAudio(folderPath, outputPath) {
  return new Promise((resolve, reject) => {
    // 폴더 내의 모든 .wav 파일 찾기
    fs.readdir(folderPath, (err, files) => {
      if (err) {
        console.error("Error reading folder:", err);
        reject(err);
      }

      // .wav 파일만 필터링
      const inputPaths = files
        .filter((file) => path.extname(file).toLowerCase() === ".wav")
        .map((file) => path.join(folderPath, file));

      // .wav 파일이 없으면 에러
      if (inputPaths.length === 0) {
        reject(new Error("No .wav files found in the specified folder."));
      }

      // ffmpeg를 사용하여 오디오 파일들을 믹싱
      const command = ffmpeg();

      // 각 오디오 파일을 입력으로 추가
      inputPaths.forEach((inputPath) => {
        command.input(inputPath);
      });

      // 믹싱된 오디오를 outputPath에 저장
      const outputFileName = `audioMixed${Date.now()}.wav`;
      const outputFilePath = path.join(outputPath, outputFileName);

      command
        .audioCodec("pcm_s16le") // 오디오 코덱 설정
        .on("end", () => {
          console.log(`Mixing finished. Output file: ${outputFilePath}`);
          resolve(outputFilePath); // 믹싱된 파일 경로 반환
        })
        .on("error", (err) => {
          console.error("Error during audio mixing:", err);
          reject(err); // 에러 발생 시 reject
        })
        .mergeToFile(outputFilePath); // 믹싱된 오디오를 파일로 저장
    });
  });
}

module.exports = { mixAudio };
