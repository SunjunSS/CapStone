const path = require("path");
const fs = require("fs");
const { convertToMP3 } = require("./convertToMP3");
const { mixAudio } = require("./audioMix");
const { callClovaSpeechAPI } = require("./callClovaSpeech");
const { askOpenAI } = require("./callOpenAI");
const { deleteFiles } = require("./deleteFiles");

const audioFolder = path.join(__dirname, "../../../storage/audio");
const tempAudioFolder = path.join(__dirname, "../../../storage/temp_audio");

// .wav -> .mp3 변환
exports.convertToMP3 = async (inputPath) => {
  const outputPath = path.join(audioFolder, `${Date.now()}.mp3`);
  try {
    return await convertToMP3(inputPath, outputPath);
  } catch (error) {
    console.error("❌ MP3 변환 오류:", error);
    throw new Error("MP3 변환 중 오류 발생");
  }
};

exports.mixAndConvertAudio = async (roomId, roomAudioBuffers) => {
  try {
    const mixedAudioPath = await mixAudio(tempAudioFolder, audioFolder);
    deleteFiles(roomAudioBuffers[roomId]); // 원본 파일 삭제
    const mp3Path = await exports.convertToMP3(mixedAudioPath);
    return mp3Path;
  } catch (error) {
    console.error("❌ 오디오 믹싱 및 변환 오류:", error);
    throw new Error("오디오 믹싱 및 변환 중 오류 발생");
  }
};

exports.processAudioFile = async (mp3Path) => {
  try {
    const clovaResponse = await callClovaSpeechAPI(mp3Path);
    const openAIResponse = await askOpenAI(clovaResponse);
    return { clovaResponse, openAIResponse };
  } catch (error) {
    console.error("❌ 음성 인식 및 분석 오류:", error);
    throw new Error("음성 인식 및 분석 중 오류 발생");
  }
};
