const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const path = require("path");

// 설정값: 변환할 샘플 레이트 및 채널 수
const TARGET_SAMPLE_RATE = 44100; // 44.1kHz
const TARGET_CHANNELS = 1; // 모노

// 오디오 변환 함수 (샘플 레이트 & 채널 맞추기)
function convertAudio(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioCodec("pcm_s16le")
      .audioFrequency(TARGET_SAMPLE_RATE) // 샘플 레이트 44100Hz 변환
      .audioChannels(TARGET_CHANNELS) // 모노 채널 변환
      .format("wav") // 출력 형식 유지
      .on("end", () => resolve(outputPath))
      .on("error", (err) => reject(err))
      .save(outputPath);
  });
}

// mixAudio 함수: 모든 오디오 변환 후 병렬 믹싱
async function mixAudio(folderPath, outputPath) {
  return new Promise(async (resolve, reject) => {
    fs.readdir(folderPath, async (err, files) => {
      if (err) return reject(err);

      // .wav 파일 필터링 후 알파벳순 정렬
      const inputPaths = files
        .filter((file) => path.extname(file).toLowerCase() === ".wav")
        .map((file) => path.join(folderPath, file))
        .sort((a, b) => path.basename(a).localeCompare(path.basename(b), "ko"));

      if (inputPaths.length === 0) {
        return reject(
          new Error("No .wav files found in the specified folder.")
        );
      }

      // 파일 이름 가져오기
      const fileNames = inputPaths.map((file) => path.basename(file, ".wav"));

      // 1명일 경우 변환 후 리턴
      if (inputPaths.length === 1) {
        try {
          const outputFile = path.join(folderPath, `${fileNames[0]}(1).wav`);
          await convertAudio(inputPaths[0], outputFile);
          console.log(`Converted: ${outputFile}`);
          return resolve(outputFile);
        } catch (error) {
          return reject(error);
        }
      }

      try {
        // 변환된 파일 저장
        const convertedFiles = await Promise.all(
          inputPaths.map((file) => {
            const fileName = path.basename(outputPath, ".wav");
            const outputFile = path.join(
              folderPath,
              `${fileName}_.wav`
            ); // 원래 이름 유지
            return convertAudio(file, outputFile);
          })
        );

        // 변환된 파일 확인
        convertedFiles.forEach((file) => {
          if (!fs.existsSync(file)) {
            console.log(`File does not exist: ${file}`);
          }
        });

        // 믹싱된 파일 이름 생성 (예: "기업+선준+희찬.wav")
        const outputFileName = `${fileNames.join("+")}.wav`;
        const outputFilePath = path.join(outputPath, outputFileName);

        // 병렬 믹싱 시작
        const command = ffmpeg();
        convertedFiles.forEach((file) => command.input(file));

        // 믹싱된 파일 저장
        command
          .complexFilter([
            {
              filter: "amix",
              options: {
                inputs: convertedFiles.length, // 입력 오디오 개수 지정
                duration: "longest", // 가장 긴 오디오 기준으로 믹싱
                dropout_transition: 2, // 짧은 소리의 끊김 방지
              },
            },
          ])
          .audioCodec("pcm_s16le")
          .format("wav")
          .on("end", () => {
            console.log(`Mixing finished. Output file: ${outputFilePath}`);
            resolve(outputFilePath);
          })
          .on("error", (err) => {
            console.error("Error during mixing:", err);
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
