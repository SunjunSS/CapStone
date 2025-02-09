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

// 오디오 길이 측정 함수
function getAudioDuration(filePath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);
      resolve(metadata.format.duration); // 오디오 길이(초)
    });
  });
}

// mixAudio 함수: 모든 오디오 변환 후 병렬 믹싱
async function mixAudio(folderPath, outputPath) {
  return new Promise(async (resolve, reject) => {
    fs.readdir(folderPath, async (err, files) => {
      if (err) return reject(err);

      // .wav 파일 필터링
      const inputPaths = files
        .filter((file) => path.extname(file).toLowerCase() === ".wav")
        .map((file) => path.join(folderPath, file));

      if (inputPaths.length === 0) {
        return reject(
          new Error("No .wav files found in the specified folder.")
        );
      }

      if (inputPaths.length === 1) {

        const outputFile = path.join(folderPath, `converted_${index}.wav`);
        console.log(`audioMix.js 55라인  : 변환된 파일 경로: ${outputFile}`);

        return convertAudio(inputPaths[0], outputFile);
      }


      
      try {
        // 변환된 파일 저장 경로
        const convertedFiles = await Promise.all(
          inputPaths.map((file, index) => {
            const outputFile = path.join(folderPath, `converted_${index}.wav`);
            console.log(
              `audioMix.js 55라인  : 변환된 파일 경로: ${outputFile}`
            );
            return convertAudio(file, outputFile);
          })
        );

        

        convertedFiles.forEach((file) => {
          if (!fs.existsSync(file)) {
            console.log(`File does not exist: ${file}`);
          }
        });

        // 병렬 믹싱 시작
        const command = ffmpeg();
        convertedFiles.forEach((file) => command.input(file));

        convertedFiles.forEach((file) => console.log(file)); // 각 파일 경로 출력

        // 믹싱된 파일 저장 경로 설정
        const outputFileName = `audioMixed${Date.now()}.wav`;
        const outputFilePath = path.join(outputPath, outputFileName);
        console.log(`합성된 음성 저장경로: ${outputFilePath}`);

        // 병렬 믹싱 (amix 필터 적용)
        command
          .complexFilter('amerge')
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
          .save(outputFilePath); // 믹싱된 오디오를 파일로 저장
      } catch (error) {
        reject(error);
      }
    });
  });
}

module.exports = { mixAudio };
