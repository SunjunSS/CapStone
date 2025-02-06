import { Buffer } from "buffer"; // Buffer를 가져옵니다
import axios from "axios";

export default class AudioRecorder {
  constructor(socket, localStream, roomId) {
    this.socket = socket;
    this.localStream = localStream; // localStream을 매개변수로 받도록 수정
    this.roomId = roomId; // roomId를 매개변수로 받도록 수정
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.isRecording = false;
    this.interval = null;
  }

  startRecording() {
    if (this.isRecording) return;

    if (typeof MediaRecorder === "undefined") {
      console.error("❌ MediaRecorder is not supported in this browser.");
      return;
    }

    if (!this.localStream) {
      console.error("❌ localStream is not initialized.");
      return;
    }

    this.isRecording = true;
    this.recordedChunks = [];

    try {
      this.mediaRecorder = new MediaRecorder(this.localStream, {
        mimeType: "audio/webm",
      });
    } catch (error) {
      console.error("Error creating MediaRecorder:", error);
    }

    this.mediaRecorder.ondataavailable = (event) => {
      this.recordedChunks.push(event.data);
    };

    this.mediaRecorder.onstop = () => {
      this.sendRecording();
    };

    // 녹음 상태가 inactive일 때만 시작하도록 수정
    if (this.mediaRecorder.state === "inactive") {
      this.mediaRecorder.start();
      console.log("🎙️ 녹음 시작");
    } else {
      console.error("❌ MediaRecorder 상태 오류:", this.mediaRecorder.state);
      return; // 상태 오류일 경우 함수 종료
    }

    // // 이후 15초마다 녹음 -> 전송 반복
    // this.interval = setInterval(() => {
    //   if (this.mediaRecorder.state === "recording") {
    //     this.mediaRecorder.stop(); // 녹음 중지
    //     console.log("⏹️ 녹음 중지 후 전송 준비");
    //   }
    // }, 15000);
  }

  stopRecording() {
    if (!this.isRecording) return;

    this.isRecording = false;
    clearInterval(this.interval);

    const blob = new Blob(this.recordedChunks, { type: "audio/wav" });

    if (this.mediaRecorder && this.mediaRecorder.state === "recording") {
      return new Promise((resolve) => {
        this.mediaRecorder.onstop = async () => {
          const response = await this.uploadAudio(blob); // 파일 업로드 후 응답 반환
          resolve(response); // 성공하면 response 반환
        };
        this.mediaRecorder.stop();
      });
    }
  }

  async sendRecording() {
    if (this.recordedChunks.length === 0) {
      console.log("녹음된 데이터가 없음");
      return;
    }

    console.log("녹음된 데이터 전송 시작");

    const blob = new Blob(this.recordedChunks, { type: "audio/wav" });
    const arrayBuffer = await blob.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer); // Blob을 Buffer로 변환
    this.recordedChunks = [];

    // 서버로 오디오 데이터 전송
    try {
      this.socket.emit("audio-stream", {
        roomId: this.roomId,
        audioBuffer: audioBuffer,
      });

      console.log("녹음된 오디오 서버로 전송");
    } catch (error) {
      console.error("오디오 전송 실패:", error);
    }
  }

  // WebM 파일을 서버로 전송하는 함수 / POST방식으로 한번에 데이터 파일을 보낼 때 사용함.
  async uploadAudio(blob) {
    return new Promise(async (resolve, reject) => {
      const formData = new FormData();
      formData.append("roomId", this.roomId); // ✅ roomId 추가
      formData.append("audio", blob, "audio.wav"); // ✅ audio파일 추가

      try {
        const response = await axios.post(
          "http://localhost:3000/upload",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        console.log("클로바 요청 응답: ", response.data.clovaResponse);

        resolve(response); // 성공하면 resolve로 response 반환
      } catch (error) {
        console.error("Error uploading file:", error);
        reject(error); // 에러 발생 시 reject
      }
    });
  }
}
