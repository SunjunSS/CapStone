const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

/**
 * 여러 개의 음성 파일을 믹싱하여 하나의 8초짜리 오디오 파일로 변환하는 함수
 * @param {Array} audioBuffers - 각 참가자의 음성 데이터 (Buffer 배열)
 * @returns {Promise<string>} - 믹싱된 오디오 파일의 버퍼 반환
 */
async function mixAudio(audioBuffers) {
  return new Promise((resolve, reject) => {
    if (audioBuffers.length === 0) {
      return reject(new Error("오디오 버퍼가 제공되지 않았습니다."));
    }

    

    // 임시 폴더 생성 (없으면 생성)
    const tempDir = path.resolve(__dirname, "../../storage/temp_audio");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // 입력 파일 경로 저장
    const inputFiles = [];

    // 음성 데이터를 임시 파일로 저장
    audioBuffers.forEach((buffer, index) => {
      const tempFilePath = path.join(tempDir, `audio_${index}_${uuidv4()}.wav`);
      fs.writeFileSync(tempFilePath, buffer);
      inputFiles.push(tempFilePath);
    });

    // 믹싱된 오디오 저장 폴더 경로
    const mixedDir = path.resolve(__dirname, "../../storage/audio");

    // 믹싱된 오디오의 출력 경로
    const outputFileName = `mixed_audio_${uuidv4()}.wav`;
    const outputFilePath = path.join(mixedDir, outputFileName);

    // FFmpeg 믹싱 처리
    let command = ffmpeg();

    inputFiles.forEach((file) => {
      command = command.input(file);
    });

    command
      .complexFilter("amix=inputs=" + inputFiles.length + ":duration=longest")
      .output(outputFilePath)
      .on("end", () => {
        console.log("✔ 믹싱 완료:", outputFilePath);

        // 믹싱된 오디오 파일을 버퍼로 변환하여 반환
        fs.readFile(outputFilePath, (err, data) => {
          if (err) {
            reject(new Error("믹싱된 오디오 파일을 읽는 중 오류 발생"));
          } else {
            resolve(data); // 버퍼 반환
          }
        });

      })
      .on("error", (err) => {
        console.error("❌ 믹싱 오류:", err);
        reject(err);
      })
      .run();
  });
}

module.exports = { mixAudio };
