const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const path = require("path");

// mixAudio 함수: 오디오 믹싱 후 바로 MP3로 변환
async function mixAudio(folderPath, outputPath) {
  return new Promise(async (resolve, reject) => {
    fs.readdir(folderPath, async (err, files) => {
      if (err) return reject(err);

      // .mp3 파일 필터링 후 알파벳순 정렬
      const inputPaths = files
        .filter((file) => path.extname(file).toLowerCase() === ".mp3")
        .map((file) => path.join(folderPath, file))
        .sort((a, b) => path.basename(a).localeCompare(path.basename(b), "ko"));

      if (inputPaths.length === 0) {
        return reject(
          new Error("No audio files found in the specified folder.")
        );
      }

      // 🎯 오디오 파일이 1개라면 믹싱 없이 그대로 반환
      if (inputPaths.length === 1) {
        console.log(
          `🎵 Only one audio file found. Skipping mixing: ${inputPaths[0]}`
        );
        return resolve(inputPaths[0]);
      }

      // 파일 이름 가져오기
      const fileNames = inputPaths.map((file) => path.basename(file, ".mp3"));

      // 믹싱된 파일 이름 생성 (예: "기업+선준+희찬.mp3")
      const outputFileName = `${fileNames.join("+")}.mp3`;
      const outputFilePath = path.join(outputPath, outputFileName);

      console.log(`🔹 Mixing files: ${inputPaths.join(", ")}`);
      console.log(`🔹 Output file: ${outputFilePath}`);

      try {
        // 병렬 믹싱 시작
        const command = ffmpeg();
        inputPaths.forEach((file) => command.input(file));

        command
          .complexFilter([
            {
              filter: "amix",
              options: {
                inputs: inputPaths.length, // 입력 오디오 개수 지정
                duration: "longest", // 가장 긴 오디오 기준으로 믹싱
                dropout_transition: 2, // 짧은 소리의 끊김 방지
              },
            },
          ])
          .audioCodec("libmp3lame") // MP3 변환을 위한 적절한 코덱 설정
          .audioBitrate("192k") // MP3 품질 설정 (128k ~ 320k 가능)
          .format("mp3") // MP3 포맷으로 저장
          .on("end", () => {
            console.log(`✅ Mixing finished. Output file: ${outputFilePath}`);
            resolve(outputFilePath);
          })
          .on("error", (err) => {
            console.error("❌ Error during mixing:", err);
            reject(err);
          })
          .save(outputFilePath);
      } catch (error) {
        reject(error);
      }
    });
  });
}

module.exports = { mixAudio };
