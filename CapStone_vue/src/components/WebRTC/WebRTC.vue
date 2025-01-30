<template> 

<template> 

  <div id="app">
    <h1>WebRTC Audio Meeting</h1>
    <div v-if="!joined">
      <input v-model="roomId" placeholder="Enter Room ID" />
      <button @click="joinRoom" :disabled="joining">
        {{ joining ? "Joining..." : "Join Room" }}
      </button>
    </div>
    <div v-else>
      <h2>Room: {{ roomId }}</h2>
      <p>Connection Status: {{ connectionStatus }}</p>
      <p>Participants: {{ participants.length }}</p>

      <div class="audio-controls">
        <button @click="toggleMute">
          {{ isMuted ? "Unmute" : "Mute" }}
        </button>

        <select v-model="selectedAudioDevice" @change="changeAudioDevice">
          <option
            v-for="device in audioDevices"
            :key="device.deviceId"
            :value="device.deviceId"
          >
            {{ device.label || `Audio Device ${device.deviceId.substr(0, 5)}...` }}
          </option>
        </select>

        <div class="audio-meter">
          <div class="meter-fill" :style="{ width: `${audioLevel}%` }"></div>
        </div>
      </div>

      <!-- 음성 녹음 버튼, 회의록 보드 -->
      <div>
        <br>
        <h3> Recording </h3>
        <br>
        <div class="clovaSpeech">
          <button @click="toggleRecording">{{ isRecording ? "음성녹음 중지" : "음성녹음 시작" }}</button>
        </div>

        <br>
        <h3> Meeting Report </h3>
        <br>
        
        <div class="meeting-report" v-html="meetingContent"></div>
        
      </div>


      <!-- 음성 녹음 버튼, 회의록 보드 -->
      <div>
        <br>
        <h3> Recording </h3>
        <br>
        <div class="clovaSpeech">
          <button @click="toggleRecording">{{ isRecording ? "음성녹음 중지" : "음성녹음 시작" }}</button>
        </div>

        <br>
        <h3> Meeting Report </h3>
        <br>
        
        <div class="meeting-report" v-html="meetingContent"></div>
        
      </div>


      <div class="participants">
        <h3>Participants:</h3>
        <ul>
          <li
            v-for="id in participants"
            :key="id"
            :class="{ speaking: speakingParticipants[id] }"
          >
            {{ id }} {{ currentUserId && id === currentUserId ? "(You)" : "" }}
            <span v-if="speakingParticipants[id]" class="speaking-indicator">🎤</span>
          </li>
        </ul>
      </div>

      <button v-if="connectionStatus === 'disconnected'" @click="reconnect">
        Reconnect
      </button>
    </div>
  </div>
</template>

<script>
import io from "socket.io-client";
import AudioRecorder from "../audio/audioRecorder.js"; // 녹음 모듈 불러오기
import parseSRT from "../audio/parseSRT.js";
import AudioRecorder from "../audio/audioRecorder.js"; // 녹음 모듈 불러오기
import parseSRT from "../audio/parseSRT.js";

export default {
  name: "AudioMeetingApp",
  data() {
    return {
      socket: null,
      currentUserId: null,
      peerConnections: {},
      localStream: null,
      remoteStreams: {},
      audioElements: {},
      roomId: "",
      participants: [],
      joined: false,
      joining: false,
      isMuted: false,
      audioDevices: [],
      selectedAudioDevice: "",
      audioLevel: 0,
      speakingParticipants: {},
      connectionStatus: "disconnected",
      audioContext: null,
      audioAnalyser: null,
      retryAttempts: {},
      maxRetries: 3,

      // 음성녹음 (kiup - test)
      isRecording: false, // 녹음 상태 관리
      mediaRecorder: null, // MediaRecorder 인스턴스
      audioRecorder: null,
      recordedChunks: [], // 녹음된 데이터
      meetingContent: "<p style='color: #bbb;'>아직 회의록이 없습니다.</p>", // 기본 텍스트

      // 음성녹음 (kiup - test)
      isRecording: false, // 녹음 상태 관리
      mediaRecorder: null, // MediaRecorder 인스턴스
      audioRecorder: null,
      recordedChunks: [], // 녹음된 데이터
      meetingContent: "<p style='color: #bbb;'>아직 회의록이 없습니다.</p>", // 기본 텍스트
    };
  },
  methods: {
    async joinRoom() {
      try {
        this.joining = true;
        console.log("Joining room:", this.roomId);

        // 아래 두 함수가 끝날때까지 대기

        // 아래 두 함수가 끝날때까지 대기
        await this.setupAudioStream();
        await this.setupSignaling();

        //his.audioRecorder = new AudioRecorder(this.socket, this.localStream, this.roomId); // 녹음 인스턴스 생성

        //his.audioRecorder = new AudioRecorder(this.socket, this.localStream, this.roomId); // 녹음 인스턴스 생성
        this.joined = true;
        this.connectionStatus = "connected";
        
        
      } catch (error) {
        console.error("Failed to join room:", error);
        alert(`Failed to join room: ${error.message}`);
      } finally {
        this.joining = false;
      }
    },

    async setupAudioStream() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        this.audioDevices = devices.filter((device) => device.kind === "audioinput");
        
        

        const constraints = {
          audio: this.selectedAudioDevice
            ? { deviceId: { exact: this.selectedAudioDevice } }
            : true,
          video: false,
        };

        this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
        console.log(`this.localStream : ${this.localStream}`);
        console.log(`this.localStream : ${this.localStream}`);

        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const audioSource = this.audioContext.createMediaStreamSource(this.localStream);
        this.audioAnalyser = this.audioContext.createAnalyser();
        audioSource.connect(this.audioAnalyser);

        this.startAudioLevelMonitoring();
      } catch (error) {
        console.error("Error setting up audio stream:", error);
        throw new Error(`Microphone access denied: ${error.message}`);
      }
    },

    startAudioLevelMonitoring() {
      if (!this.audioAnalyser) return;

      const dataArray = new Uint8Array(this.audioAnalyser.frequencyBinCount);
      const monitor = () => {
        this.audioAnalyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        this.audioLevel = (average / 255) * 100;
        requestAnimationFrame(monitor);
      };
      monitor();
    },

    async setupSignaling() {
      this.socket = io("http://172.30.1.93:3000", {
        transports: ["websocket"],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      console.log(`this.socket: ${this.socket}`);

      console.log(`this.socket: ${this.socket}`);

      return new Promise((resolve, reject) => {
        this.socket.on("connect", () => {
          this.connectionStatus = "connected";
          this.currentUserId = this.socket.id;
          this.socket.emit("join-room", this.roomId);
          resolve();
        });

        this.socket.on("connect_error", (error) => {
          this.connectionStatus = "error";
          reject(new Error(`Connection failed: ${error.message}`));
        });


        
        // 녹음 상태 동기화 (누군가 녹음을 시작했을 때, 종료했을때)
        this.socket.on("sync-recording", (isRecording) => {
          this.isRecording = isRecording;

          console.log(`녹음상태 변화 : ${isRecording}`)
          //녹음 시작 or 녹음 중지함수를 실행
          this.checkRecording();

        });


        // 서버에서 변환된 텍스트를 받는 부분
        this.socket.on("return-recording", (response) => {
          console.log("Received recording file", response);
          
          // 텍스트를 줄바꿈으로 구분하여 추가
          if (this.meetingContent === "<p style='color: #bbb;'>아직 회의록이 없습니다.</p>") {
            this.meetingContent = ""; // 기본 텍스트 제거
          }
          // 기존 텍스트에 변환된 텍스트를 추가 (줄바꿈을 추가하여)
          this.meetingContent = parseSRT(response.data.clovaResponse);
          
        }),



        
        // 녹음 상태 동기화 (누군가 녹음을 시작했을 때, 종료했을때)
        this.socket.on("sync-recording", (isRecording) => {
          this.isRecording = isRecording;

          console.log(`녹음상태 변화 : ${isRecording}`)
          //녹음 시작 or 녹음 중지함수를 실행
          this.checkRecording();

        });


        // 서버에서 변환된 텍스트를 받는 부분
        this.socket.on("return-recording", (response) => {
          console.log("Received recording file", response);
          
          // 텍스트를 줄바꿈으로 구분하여 추가
          if (this.meetingContent === "<p style='color: #bbb;'>아직 회의록이 없습니다.</p>") {
            this.meetingContent = ""; // 기본 텍스트 제거
          }
          // 기존 텍스트에 변환된 텍스트를 추가 (줄바꿈을 추가하여)
          this.meetingContent = parseSRT(response.data.clovaResponse);
          
        }),


        // 기존 참가자 목록을 받았을 때
        this.socket.on("existing-participants", async ({ participants }) => {
          console.log("Received existing participants:", participants);
          for (const userId of participants) {
            if (userId !== this.currentUserId) {
              await this.createPeerConnection(userId, true);
            }
          }
        });

        // 새로운 참가자가 들어왔을 때
        this.socket.on("new-participant", async ({ participantId }) => {
          console.log("New participant joined:", participantId);
          if (participantId !== this.currentUserId) {
            await this.createPeerConnection(participantId, false);
          }
        });

        this.socket.on("room-update", ({ participants }) => {
          this.participants = participants;
        });

        this.socket.on("signal", this.handleSignal);
        this.socket.on("user-disconnected", this.handleUserDisconnected);
      });
    },

    // 녹음 시작/중지 처리 함수
    toggleRecording() {
      this.isRecording = !this.isRecording;

      // 클라이언트에서 녹음 시작/중지 처리
      if (this.isRecording) {

        // 녹음 상태를 서버로 전송
        this.socket.emit("start-recording", this.roomId);
        console.log("녹음 시작");

      } else {

        // 녹음 상태를 서버로 전송
        this.socket.emit("stop-recording", this.roomId);
        console.log("녹음 중지");

      }
    },

    async checkRecording() {
        // 클라이언트에서 녹음 시작/중지 처리
        if (this.isRecording) {
          // 녹음 시작 함수
          console.log(`녹음시작 - WebRTC.vue:270`);
          this.startRecording(); // 녹음 시작

        }else {
          // 녹음 중지 함수
          console.log(`녹음중지 - WebRTC.vue:275`);
          try {
            const response =await this.stopRecording(); // 응답 대기

            console.log("🎧 서버 응답:", response); // 서버 응답 출력
          } catch (error) {
            console.error("🚨 녹음 종료 또는 업로드 실패:", error);
          }
        }
    },


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
        const blob = new Blob(this.recordedChunks, { type: "audio/wav" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "audio-meeting.wav";
        link.click();

        // 서버로 audio파일을 업로드함
        this.uploadAudio(blob);
      };

    // 녹음 상태가 inactive일 때만 시작하도록 수정
    if (this.mediaRecorder.state === "inactive") {
      this.mediaRecorder.start();
      console.log("🎙️ 녹음 시작");
    } else {
      console.error("❌ MediaRecorder 상태 오류:", this.mediaRecorder.state);
      return; // 상태 오류일 경우 함수 종료
    }
  },

  stopRecording() {
    if (!this.isRecording) return;

    if (this.mediaRecorder) {
        this.mediaRecorder.stop();
      }
      this.isRecording = false;
  },

  async uploadAudio(blob) {
    return new Promise(async (resolve, reject) => {
      const formData = new FormData();
      //formData.append("roomId", this.roomId); // ✅ roomId 추가
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

        console.log("서버 응답:", response); // 응답 전체를 출력하여 구조를 확인
        console.log("클로바 요청 응답: ", response.data.clovaResponse);
        this.meetingContent = parseSRT(response);
       
      } catch (error) {
        console.error("Error uploading file:", error);
        reject(error); // 에러 발생 시 reject
      }
    });
  },


    async createPeerConnection(userId, isInitiator = false) {
      if (this.peerConnections[userId]) {
        await this.handlePeerConnectionFailure(userId);
      }

      const configuration = {
        iceServers: [
          {
            urls: [
              "stun:stun1.l.google.com:19302",
              "stun:stun2.l.google.com:19302",
            ],
          },
          {
            urls: "turn:your-turn-server.com",
            username: "username",
            credential: "credential",
          },
        ],
        iceTransportPolicy: "all",
        iceCandidatePoolSize: 10,
        bundlePolicy: "max-bundle",
      };

      const peerConnection = new RTCPeerConnection(configuration);
      this.peerConnections[userId] = peerConnection;

      this.localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, this.localStream);
      });

      peerConnection.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          const remoteStream = event.streams[0];
          this.remoteStreams[userId] = remoteStream;
          
          const audio = new Audio();
          audio.srcObject = remoteStream;
          audio.autoplay = true;
          this.audioElements[userId] = audio;
        }
      };

      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          this.socket.emit("signal", {
            targetId: userId,
            signal: {
              type: "candidate",
              candidate: event.candidate,
            },
          });
        }
      };

      peerConnection.onnegotiationneeded = async () => {
        try {
          if (isInitiator) {
            const offer = await peerConnection.createOffer({
              offerToReceiveAudio: true,
              offerToReceiveVideo: false,
            });
            await peerConnection.setLocalDescription(offer);
            this.socket.emit("signal", {
              targetId: userId,
              signal: offer,
            });
          }
        } catch (error) {
          console.error("Negotiation failed:", error);
        }
      };

      peerConnection.onconnectionstatechange = () => {
        console.log(`Connection state with ${userId}:`, peerConnection.connectionState);
        if (peerConnection.connectionState === "failed") {
          this.handlePeerConnectionFailure(userId);
          
          if (!this.retryAttempts[userId]) {
            this.retryAttempts[userId] = 0;
          }
          
          if (this.retryAttempts[userId] < this.maxRetries) {
            this.retryAttempts[userId]++;
            setTimeout(() => this.createPeerConnection(userId, isInitiator), 1000);
          } else {
            delete this.retryAttempts[userId];
          }
        } else if (peerConnection.connectionState === "connected") {
          delete this.retryAttempts[userId];
        }
      };

      if (isInitiator) {
        try {
          const offer = await peerConnection.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: false,
          });
          await peerConnection.setLocalDescription(offer);
          this.socket.emit("signal", {
            targetId: userId,
            signal: offer,
          });
        } catch (error) {
          console.error("Error creating offer:", error);
          this.handlePeerConnectionFailure(userId);
        }
      }

      return peerConnection;
    },

    async handleSignal({ senderId, signal }) {
      try {
        let peerConnection = this.peerConnections[senderId];
        
        if (!peerConnection) {
          peerConnection = await this.createPeerConnection(senderId, false);
        }

        if (signal.type === "candidate" && signal.candidate) {
          await peerConnection.addIceCandidate(new RTCIceCandidate(signal.candidate));
        } else if (signal.type === "offer") {
          if (peerConnection.signalingState !== "stable") {
            await Promise.all([
              peerConnection.setLocalDescription({ type: "rollback" }),
              peerConnection.setRemoteDescription(new RTCSessionDescription(signal))
            ]);
          } else {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(signal));
          }
          
          const answer = await peerConnection.createAnswer();
          await peerConnection.setLocalDescription(answer);
          
          this.socket.emit("signal", {
            targetId: senderId,
            signal: answer,
          });
        } else if (signal.type === "answer") {
          if (peerConnection.signalingState === "have-local-offer") {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(signal));
          }
        }
      } catch (error) {
        console.error("Error handling signal:", error);
        this.handlePeerConnectionFailure(senderId);
      }
    },

    handlePeerConnectionFailure(userId) {
      if (this.peerConnections[userId]) {
        this.peerConnections[userId].close();
        delete this.peerConnections[userId];
      }
      if (this.remoteStreams[userId]) {
        this.remoteStreams[userId].getTracks().forEach(track => track.stop());
        delete this.remoteStreams[userId];
      }
      if (this.audioElements[userId]) {
        this.audioElements[userId].srcObject = null;
        delete this.audioElements[userId];
      }
    },

    handleUserDisconnected(userId) {
      this.handlePeerConnectionFailure(userId);
      this.participants = this.participants.filter(id => id !== userId);
    },

    async toggleMute() {
      this.isMuted = !this.isMuted;
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = !this.isMuted;
      });
    },

    async changeAudioDevice() {
      if (this.selectedAudioDevice) {
        try {
          if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
          }

          const newStream = await navigator.mediaDevices.getUserMedia({
            audio: { deviceId: { exact: this.selectedAudioDevice } },
            video: false
          });

          Object.values(this.peerConnections).forEach(pc => {
            const sender = pc.getSenders().find(s => s.track.kind === "audio");
            if (sender) {
              sender.replaceTrack(newStream.getAudioTracks()[0]);
            }
          });

          this.localStream = newStream;
          
          if (this.audioContext) {
            const audioSource = this.audioContext.createMediaStreamSource(newStream);
            audioSource.connect(this.audioAnalyser);
          }
        } catch (error) {
          console.error("Error changing audio device:", error);
          alert("Failed to switch audio device");
        }
      }
    },

    async reconnect() {
      Object.keys(this.peerConnections).forEach(userId => {
        this.handlePeerConnectionFailure(userId);
      });
      
      this.joined = false;
      this.connectionStatus = "disconnected";
      await this.joinRoom();
    }
  },
  beforeDestroy() {
    if (this.socket) {
      this.socket.disconnect();
    }
    
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
    }
    
    Object.keys(this.peerConnections).forEach(userId => {
      this.handlePeerConnectionFailure(userId);
    });
    
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
};
</script>

<style scoped>
#app {
  font-family: Arial, sans-serif;
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background-color: #f4f4f9;
}

.audio-controls {
  margin-top: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.audio-meter {
  width: 100px;
  height: 10px;
  background-color: #ddd;
  border-radius: 5px;
  margin-left: 10px;
  position: relative;
}

.meeting-report {
  width: 700px;
  height: 500px;
  border: 1px solid #ccc;
  padding: 10px;
  overflow-y: auto; /* 내용이 많아지면 스크롤 가능 */
  font-size: 16px;
  color: #888; /* 기본 텍스트 희미한 색상 */
  background-color: #f9f9f9; /* 배경색 */
}


.meeting-report {
  width: 700px;
  height: 500px;
  border: 1px solid #ccc;
  padding: 10px;
  overflow-y: auto; /* 내용이 많아지면 스크롤 가능 */
  font-size: 16px;
  color: #888; /* 기본 텍스트 희미한 색상 */
  background-color: #f9f9f9; /* 배경색 */
}


.meter-fill {
  height: 100%;
  background-color: green;
  border-radius: 5px;
}

.participants {
  margin-top: 30px;
}

.speaking-indicator {
  color: red;
  font-weight: bold;
}

.connection-status {
  margin-top: 20px;
  font-size: 16px;
  color: green;
}

select {
  padding: 5px;
  font-size: 14px;
}

input {
  padding: 10px;
  font-size: 16px;
}

button {
  padding: 10px 15px;
  background-color: #4CAF50;
  color: white;
  border: none;
  cursor: pointer;
  font-size: 16px;
}

button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
</style>
