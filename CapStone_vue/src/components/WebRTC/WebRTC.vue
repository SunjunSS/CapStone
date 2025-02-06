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

        <select
          v-model="selectedAudioDevice"
          @change="changeAudioDevice"
          :disabled="isRecording"
        >
          <option
            v-for="device in audioDevices"
            :key="device.deviceId"
            :value="device.deviceId"
          >
            {{
              device.label || `Audio Device ${device.deviceId.substr(0, 5)}...`
            }}
          </option>
        </select>

        <div class="audio-meter">
          <div class="meter-fill" :style="{ width: `${audioLevel}%` }"></div>
        </div>
      </div>

      <div>
        <br />
        <h3>Recording</h3>
        <br />
        <div class="clovaSpeech">
          <button @click="toggleRecording">
            {{ isRecording ? "음성녹음 중지" : "음성녹음 시작" }}
          </button>
        </div>

        <br />
        <h3>Meeting Report</h3>
        <br />

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
            <span v-if="speakingParticipants[id]" class="speaking-indicator"
              >🎤</span
            >
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
import axios from "axios";
import { updateMeetingReport } from "../audio/updateMeetingReport";
import uploadAudio from "../audio/uploadAudio";

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
      isRecording: false, // 녹음 상태 관리
      mediaRecorder: null, // MediaRecorder 인스턴스
      recordedChunks: [], // 녹음된 데이터
      meetingContent: "<p style='color: #bbb;'>아직 회의록이 없습니다.</p>", // 기본 텍스트
    };
  },
  methods: {
    async joinRoom() {
      try {
        this.joining = true;
        console.log("Joining room:", this.roomId);
        await this.setupAudioStream();
        await this.setupSignaling();
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
        this.audioDevices = devices.filter(
          (device) => device.kind === "audioinput"
        );

        const constraints = {
          audio: this.selectedAudioDevice
            ? { deviceId: { exact: this.selectedAudioDevice } }
            : true,
          video: false,
        };

        this.localStream = await navigator.mediaDevices.getUserMedia(
          constraints
        );

        this.audioContext = new (window.AudioContext ||
          window.webkitAudioContext)();
        const audioSource = this.audioContext.createMediaStreamSource(
          this.localStream
        );
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

    // 음성 녹음 시작
    // 녹음 시작/중지 토글 메서드
    toggleRecording() {
      this.isRecording = !this.isRecording;

      if (this.isRecording) {
        //this.startRecording();
        this.socket.emit("start-recording", this.roomId);
        console.log("녹음 시작");
      } else {
        //this.stopRecording();
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
      } else {
        // 녹음 중지 함수
        console.log(`녹음중지 - WebRTC.vue:275`);
        this.stopRecording();
      }
    },

    // 녹음 시작 메서드
    startRecording() {
      if (!this.localStream) return;

      this.recordedChunks = [];
      this.mediaRecorder = new MediaRecorder(this.localStream);

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
        uploadAudio(blob, this.roomId);
      };

      this.mediaRecorder.start();
      this.isRecording = true;
    },

    // 녹음 중지 메서드
    stopRecording() {
      if (this.mediaRecorder) {
        this.mediaRecorder.stop();
      }
      this.isRecording = false;
    },

    updateMeetingReport(content) {
      if (typeof content !== "string") {
        console.error(
          "Expected content to be a string, but got:",
          typeof content
        );
        this.meetingContent = "<p style='color: #bbb;'>응답 형식 오류</p>";
        return;
      }

      try {
        // SRT 데이터를 줄 단위로 분리
        const lines = content.trim().split("\n");
        const formattedContent = [];
        let block = { index: null, time: null, text: "" };

        lines.forEach((line) => {
          if (/^\d+$/.test(line)) {
            // 번호 라인
            if (block.index) {
              // 이전 블록이 있다면 저장
              formattedContent.push(block);
            }
            block = { index: line, time: null, text: "" };
          } else if (line.includes("-->")) {
            // 시간 정보 라인
            block.time = line.replace(",", ".");
          } else if (line.trim()) {
            // 텍스트 라인
            block.text += `${line.trim()} `;
          }
        });

        // 마지막 블록 추가
        if (block.index) {
          formattedContent.push(block);
        }

        // HTML로 변환
        this.meetingContent = formattedContent
          .map(
            (block) => `
            <p><strong>${block.index}번 음성</strong> (${block.time})</p>
            <p>${block.text.trim()}</p>
          `
          )
          .join("");
      } catch (error) {
        console.error("Error parsing SRT data:", error);
        this.meetingContent =
          "<p style='color: #bbb;'>파싱 중 오류가 발생했습니다.</p>";
      }
    },

    // WebM 파일을 서버로 전송하는 함수
    // async uploadAudio(blob) {
    //   const formData = new FormData();
    //   formData.append("audio", blob, "audio.wav");
    //   formData.append("roomId", this.roomId); // roomId 추가

    //   try {
    //     const response = await axios.post("http://localhost:3000/upload", formData, {
    //       headers: {
    //         "Content-Type": "multipart/form-data",
    //       },
    //     });
    //     console.log(response.data.message);
    //     //console.log("클로바 요청 응답: ",response.data.clovaResponse);
    //     //this.updateMeetingReport(response.data.clovaResponse);

    //   } catch (error) {
    //     console.error("Error uploading file:", error.message);
    //   }
    // },

    async setupSignaling() {
      this.socket = io("http://localhost:3000", {
        transports: ["websocket"],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      return new Promise((resolve, reject) => {
        this.socket.on("connect", () => {
          this.connectionStatus = "connected";
          this.currentUserId = this.socket.id;
          this.socket.emit("join-room", this.roomId);
          resolve();
        });

        // 녹음 상태 동기화 (누군가 녹음을 시작했을 때, 종료했을때)
        this.socket.on("sync-recording", (isRecording) => {
          this.isRecording = isRecording;

          console.log(`녹음상태 변화 : ${isRecording}`);
          //녹음 시작 or 녹음 중지함수를 실행
          this.checkRecording();
        });

        this.socket.on("return-recording", (recordingData) => {
          console.log(recordingData);
          const report = updateMeetingReport(recordingData);

          console.log(`파싱된 응답값: ${report}`);
          this.meetingContent = report;
        });

        this.socket.on("connect_error", (error) => {
          this.connectionStatus = "error";
          reject(new Error(`Connection failed: ${error.message}`));
        });

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
        console.log(
          `Connection state with ${userId}:`,
          peerConnection.connectionState
        );
        if (peerConnection.connectionState === "failed") {
          this.handlePeerConnectionFailure(userId);

          if (!this.retryAttempts[userId]) {
            this.retryAttempts[userId] = 0;
          }

          if (this.retryAttempts[userId] < this.maxRetries) {
            this.retryAttempts[userId]++;
            setTimeout(
              () => this.createPeerConnection(userId, isInitiator),
              1000
            );
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
          await peerConnection.addIceCandidate(
            new RTCIceCandidate(signal.candidate)
          );
        } else if (signal.type === "offer") {
          if (peerConnection.signalingState !== "stable") {
            await Promise.all([
              peerConnection.setLocalDescription({ type: "rollback" }),
              peerConnection.setRemoteDescription(
                new RTCSessionDescription(signal)
              ),
            ]);
          } else {
            await peerConnection.setRemoteDescription(
              new RTCSessionDescription(signal)
            );
          }

          const answer = await peerConnection.createAnswer();
          await peerConnection.setLocalDescription(answer);

          this.socket.emit("signal", {
            targetId: senderId,
            signal: answer,
          });
        } else if (signal.type === "answer") {
          if (peerConnection.signalingState === "have-local-offer") {
            await peerConnection.setRemoteDescription(
              new RTCSessionDescription(signal)
            );
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
        this.remoteStreams[userId].getTracks().forEach((track) => track.stop());
        delete this.remoteStreams[userId];
      }
      if (this.audioElements[userId]) {
        this.audioElements[userId].srcObject = null;
        delete this.audioElements[userId];
      }
    },

    handleUserDisconnected(userId) {
      this.handlePeerConnectionFailure(userId);
      this.participants = this.participants.filter((id) => id !== userId);
    },

    async toggleMute() {
      this.isMuted = !this.isMuted;
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = !this.isMuted;
      });
    },

    async changeAudioDevice() {
      if (this.isRecording) {
        alert(
          "현재 녹음 중입니다. 녹음을 중지한 후 오디오 장치를 변경할 수 있습니다."
        );
        return;
      }

      if (this.selectedAudioDevice) {
        try {
          if (this.localStream) {
            this.localStream.getTracks().forEach((track) => track.stop());
          }

          const newStream = await navigator.mediaDevices.getUserMedia({
            audio: { deviceId: { exact: this.selectedAudioDevice } },
            video: false,
          });

          Object.values(this.peerConnections).forEach((pc) => {
            const sender = pc
              .getSenders()
              .find((s) => s.track.kind === "audio");
            if (sender) {
              sender.replaceTrack(newStream.getAudioTracks()[0]);
            }
          });

          this.localStream = newStream;

          if (this.audioContext) {
            const audioSource =
              this.audioContext.createMediaStreamSource(newStream);
            audioSource.connect(this.audioAnalyser);
          }
        } catch (error) {
          console.error("Error changing audio device:", error);
          alert("Failed to switch audio device");
        }
      }
    },

    async reconnect() {
      Object.keys(this.peerConnections).forEach((userId) => {
        this.handlePeerConnectionFailure(userId);
      });

      this.joined = false;
      this.connectionStatus = "disconnected";
      await this.joinRoom();
    },
  },
  beforeDestroy() {
    if (this.socket) {
      this.socket.disconnect();
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
    }

    Object.keys(this.peerConnections).forEach((userId) => {
      this.handlePeerConnectionFailure(userId);
    });

    if (this.audioContext) {
      this.audioContext.close();
    }
  },
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

.meter-fill {
  height: 100%;
  background-color: green;
  border-radius: 5px;
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
  background-color: #4caf50;
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
