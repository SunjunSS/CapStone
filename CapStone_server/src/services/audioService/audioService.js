const path = require("path");
const fs = require("fs");
const { convertMP3 } = require("./convertMP3");
const { mixAudio } = require("./audioMix");
const { callClovaSpeechAPI } = require("./callClovaSpeech");
const { askOpenAI } = require("./callOpenAI");
const { deleteFiles } = require("./deleteFiles");

const audioFolder = path.join(__dirname, "../../../storage/audio");
const tempAudioFolder = path.join(__dirname, "../../../storage/temp_audio");

// .wav -> .mp3 변환
exports.convertToMP3 = async (inputPath) => {
  const fileName = path.basename(inputPath, ".wav"); // 원본 파일명 가져오기
  const outputPath = path.join(audioFolder, `${fileName}.mp3`);
  try {
    return await convertToMP3(inputPath, outputPath);
  } catch (error) {
    console.error("❌ MP3 변환 오류:", error);
    throw new Error("MP3 변환 중 오류 발생");
  }
};

exports.processIndividualFile = async (roomAudioBuffers) => {
  const userSpeech = {}; // 멤버별 음성 텍스트 저장
  const speakerNames = []; // 화자 이름 목록

  try {
    if (roomAudioBuffers == null) return;

    // 각 멤버의 음성텍스트를 저장
    for (const userObject of roomAudioBuffers) {

      const outputPath = userObject.inputPath.replace(/\\temp_audio\\/g, "\\audio\\");

      const inputPath = await convertMP3(userObject.inputPath, outputPath);
      const response = await callClovaSpeechAPI(inputPath); // 음성 텍스트 얻기
      
      userSpeech[userObject.nickname] = response; // 닉네임과 음성 텍스트 매핑
      speakerNames.push(userObject.nickname); // 화자 이름 목록에 추가
    }

    // OpenAI에 전달할 데이터 준비
    const openAIResponse = await askOpenAI(userSpeech, speakerNames);

    const mixedAudioPath = await mixAudio(audioFolder, audioFolder);
    
    // 파일 삭제
    deleteFiles(tempAudioFolder);
    deleteFiles(audioFolder);

    return openAIResponse;
  } catch (error) {
    console.error("❌ 음성 인식 및 분석 오류:", error);
    throw new Error("음성 인식 및 분석 중 오류 발생");
  }
};

exports.mixAndConvertAudio = async (roomId, roomAudioBuffers) => {
  try {

    if (roomAudioBuffers.length === 1) {
      // 저장된 파일이 1개일 경우 바로 변환
      console.log(`1명입니다~`);
      // return await exports.convertToMP3(roomAudioBuffers[0]);
      return roomAudioBuffers[0];
    }

    // 2개 이상일 경우 믹싱 후 변환
    const mixedAudioPath = await mixAudio(audioFolder, audioFolder);
    return mixedAudioPath;
  } catch (error) {
    console.error("❌ 오디오 믹싱 및 변환 오류:", error);
    throw new Error("오디오 믹싱 및 변환 중 오류 발생");
  }
};

exports.processAudioFile = async (mp3Path, speakerCount) => {
  try {
    const fileName = path.basename(mp3Path, ".mp3"); // .mp3 제외한 파일명 추출
    let speakerNames = fileName.includes("+")
      ? fileName.split("+").join(", ")
      : fileName; // 화자 이름 변환

    
    // 클로바에서 화자 수 명확하게 전달 
    const clovaResponse = await callClovaSpeechAPI(mp3Path, speakerCount);

    // 클로바 응답과 함께 현재 프로젝트의 노드 데이터도 전달해주기
    const openAIResponse = await askOpenAI(clovaResponse, speakerNames);

    deleteFiles(tempAudioFolder);
    deleteFiles(audioFolder);

    return { clovaResponse, openAIResponse };
  } catch (error) {
    console.error("❌ 음성 인식 및 분석 오류:", error);
    throw new Error("음성 인식 및 분석 중 오류 발생");
  }
};

exports.processRealTimeAudio = async (mp3Path, mindMap) => {
  try {
    // deleteFiles(tempAudioFolder);
    const clovaResponse = await callClovaSpeechAPI(mp3Path);
    const nodeOpenAIResponse = await nodeOpenAI(clovaResponse, mindmap);

    // deleteFiles(audioFolder);
    return { clovaResponse, nodeOpenAIResponse };
  } catch (error) {
    console.error("❌ 음성 인식 및 분석 오류:", error);
    throw new Error("음성 인식 및 분석 중 오류 발생");
  }
};
