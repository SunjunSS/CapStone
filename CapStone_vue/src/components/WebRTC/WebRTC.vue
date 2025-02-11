<template>
  <div id="app">
    <div v-if="!joined" class="login-container">
      <div class="login-box">
        <h1 class="title">음성 회의실</h1>
        <p class="subtitle">
          방 번호를 입력하여<br />
          회의에 참여하세요
        </p>

        <div class="input-group">
          <input
            v-model="roomId"
            placeholder="방 번호를 입력하세요"
            class="room-input"
            :class="{ 'input-filled': roomId.length > 0 }"
          />
          <button
            @click="joinRoom"
            :disabled="joining || !roomId"
            class="join-button"
          >
            {{ joining ? "입장중..." : "회의실 입장하기" }}
          </button>
        </div>

        <div class="features">
          <div class="feature-item">
            <span class="feature-icon">🎧</span>
            <span class="feature-text">실시간 음성대화</span>
          </div>
          <div class="feature-item">
            <span class="feature-icon">📝</span>
            <span class="feature-text">회의록 자동기록</span>
          </div>
          <div class="feature-item">
            <span class="feature-icon">👥</span>
            <span class="feature-text">
              다중<br />
              참여자
            </span>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="meeting-container">
      <div class="meeting-header">
        <h2 class="room-title">Room: {{ roomId }}</h2>
        <div class="connection-info">
          <span
            class="status-badge"
            :class="connectionStatus"
            @click="leaveRoom()"
            style="cursor: pointer"
          >
            <span class="status-text">{{ connectionStatus }}</span>
            <v-icon class="status-icon" icon="mdi-phone-off"></v-icon>
          </span>
        </div>
      </div>

      <div class="participants-section">
        <h3 class="section-title">
          참여자 목록
          <span class="participants-count">
            ({{ participants.length }}명 참가)
          </span>
        </h3>
        <ul class="participants-list">
          <li
            v-for="id in participants"
            :key="id"
            class="participant-item"
            :class="{ speaking: speakingParticipants[id] }"
          >
            <div class="icon-wrapper">
              <v-icon icon="mdi-account-circle" size="28px"></v-icon>
              <span class="status-dot"></span>
            </div>
            {{ id }} {{ currentUserId && id === currentUserId ? "(나)" : "" }}
            <span v-if="speakingParticipants[id]" class="speaking-indicator"
              >🎤</span
            >
          </li>
        </ul>
      </div>

      <div class="audio-controls">
        <button @click="toggleMute" class="control-button">
          <v-icon v-if="isMuted" icon="mdi-volume-off"></v-icon>
          <v-icon v-else icon="mdi-volume-high"></v-icon>
        </button>

        <select
          v-model="selectedAudioDevice"
          @change="changeAudioDevice"
          :disabled="isRecording"
          class="device-select"
        >
          <option
            v-for="device in audioDevices"
            :key="device.deviceId"
            :value="device.deviceId"
          >
            {{
              device.label || `오디오 장치 ${device.deviceId.substr(0, 5)}...`
            }}
          </option>
        </select>

        <div class="audio-meter">
          <div class="meter-fill" :style="{ width: `${audioLevel}%` }"></div>
        </div>
      </div>

      <div class="recording-section">
        <h3 class="section-title">녹음</h3>
        <div class="recording-controls">
          <button
            @click="toggleRecording"
            class="recording-button"
            :class="{ 'recording-active': isRecording }"
          >
            <v-icon v-if="isRecording" icon="mdi-microphone-off"></v-icon>
            <v-icon v-else icon="mdi-microphone"></v-icon>
          </button>
        </div>
      </div>

      <div class="report-section">
        <h3 class="section-title">회의 기록</h3>
        <div class="meeting-report" v-html="meetingContent"></div>
      </div>

      <button
        v-if="connectionStatus === 'disconnected'"
        @click="reconnect"
        class="reconnect-button"
      >
        재연결
      </button>
    </div>
  </div>
</template>

<script>
import io from "socket.io-client";
import axios from "axios";
import { updateMeetingReport } from "../audio/updateMeetingReport";
import uploadAudio from "../audio/uploadAudio";
import thisMeetingContent from "../audio/meetingContent";

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
        this.isMuted = false;
        await this.setupAudioStream();
        await this.setupSignaling();
        this.joined = true;
        this.connectionStatus = "Connected";
      } catch (error) {
        console.error("Failed to join room:", error);
        alert(`Failed to join room: ${error.message}`);
      } finally {
        this.joining = false;
      }
    },

    async setupAudioStream() {
      try {
        // 먼저 기본 오디오 스트림을 얻어 권한 확보
        const initialStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });

        // 권한을 얻은 후 디바이스 목록 조회
        const devices = await navigator.mediaDevices.enumerateDevices();
        this.audioDevices = devices.filter(
          (device) => device.kind === "audioinput"
        );

        // 현재 사용 중인 디바이스 찾기
        const currentTrack = initialStream.getAudioTracks()[0];
        const currentDevice = this.audioDevices.find(
          (device) => device.label === currentTrack.label
        );

        // 현재 디바이스 선택
        if (currentDevice) {
          this.selectedAudioDevice = currentDevice.deviceId;
        }

        // 초기 스트림 정리
        initialStream.getTracks().forEach((track) => track.stop());

        // 선택된 디바이스로 새 스트림 생성
        const constraints = {
          audio: this.selectedAudioDevice
            ? { deviceId: { exact: this.selectedAudioDevice } }
            : true,
          video: false,
        };

        this.localStream = await navigator.mediaDevices.getUserMedia(
          constraints
        );

        // 오디오 분석기 설정
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

      this.mediaRecorder.onstop = async () => {
        if (this.recordedChunks.length === 0) {
          console.error("❌ 녹음 데이터가 없습니다.");
          return;
        }

        const blob = new Blob(this.recordedChunks, { type: "audio/wav" });
        console.log("🎤 녹음 데이터 준비 완료, 업로드 시작...");
        

        // 서버로 audio파일을 업로드함
        try {
          await uploadAudio(blob, this.roomId);
          console.log("✅ 업로드 성공!");
        } catch (error) {
          console.error("❌ 업로드 실패:", error.message);
        }
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


    updateMousePosition(userId, x, y, nickname) {
      let cursor = document.getElementById(`cursor-${userId}`);
      if (!cursor) {
        cursor = document.createElement("div");
        cursor.id = `cursor-${userId}`;
        cursor.classList.add("mouse-cursor");
        cursor.innerHTML = `<span class="cursor-label">${nickname}</span>`;
        document.body.appendChild(cursor);
      }
      cursor.style.left = `${x}px`;
      cursor.style.top = `${y}px`;
    },

    async setupSignaling() {
      const API_BASE_URL = `http://13.125.88.168:3000`;
      this.socket = io("http://localhost:3000", {
        transports: ["websocket"],
        reconnection: true,

        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      return new Promise((resolve, reject) => {

        const customId = Math.random().toString(36).substring(2, 7); // 4~5글자 ID 생성

        this.socket.on("connect", () => {
          this.connectionStatus = "Connected";
          this.currentUserId = customId;
          this.socket.emit("join-room", { roomId: this.roomId, userId: this.currentUserId });
          resolve();
        });


        // 마우스 위치 업데이트 수신
        this.socket.on("update-mouse", ({ userId, x, y, nickname }) => {
          this.updateMousePosition(userId, x, y, nickname);
        });

        // 마우스 이동 이벤트 감지
        window.addEventListener("mousemove", (event) => {
          this.socket.emit("mouse-move", {
            roomId: this.roomId,
            x: event.clientX,
            y: event.clientY,
          });
        });

        // 녹음 상태 동기화 (누군가 녹음을 시작했을 때, 종료했을때)
        this.socket.on("sync-recording", (isRecording) => {
          this.isRecording = isRecording;

          console.log(`녹음상태 변화 : ${isRecording}`);
          //녹음 시작 or 녹음 중지함수를 실행
          this.checkRecording();
        });

        this.socket.on("return-recording", (recordingData) => {
          console.log("🟢 서버에서 녹음 데이터 수신:", recordingData);

          // Object 타입인지 확인 후 문자열로 변환
          let processedData;
          if (typeof recordingData === "object") {
            try {
              processedData = JSON.stringify(recordingData, null, 2); // JSON 포맷 변환
            } catch (error) {
              console.error("❌ JSON 변환 오류:", error);
              processedData = "[오류] 데이터를 변환할 수 없습니다.";
            }
          } else {
            processedData = recordingData; // 기존 문자열 그대로 유지
          }

          // 회의록 업데이트
          const report = thisMeetingContent(processedData);

          console.log("🟢 변환된 응답값:", report);
          this.meetingContent = report;
        });

        this.socket.on("connect_error", (error) => {
          this.connectionStatus = "Error";
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
          // 현재 음소거 상태 저장
          const currentMuteState = this.isMuted;

          if (this.localStream) {
            this.localStream.getTracks().forEach((track) => track.stop());
          }

          const newStream = await navigator.mediaDevices.getUserMedia({
            audio: { deviceId: { exact: this.selectedAudioDevice } },
            video: false,
          });

          // 새 스트림에 음소거 상태 적용
          newStream.getAudioTracks().forEach((track) => {
            track.enabled = !currentMuteState;
          });

          // isMuted 상태 업데이트
          this.isMuted = currentMuteState;

          Object.values(this.peerConnections).forEach((pc) => {
            const sender = pc
              .getSenders()
              .find((s) => s.track.kind === "audio");
            if (sender) {
              sender.replaceTrack(newStream.getAudioTracks()[0]);
            }
          });

          this.localStream = newStream;

          // 오디오 컨텍스트 및 분석기 업데이트
          if (this.audioContext) {
            // 기존 연결 해제
            this.audioContext.close();

            // 새로운 오디오 컨텍스트 및 분석기 생성
            this.audioContext = new (window.AudioContext ||
              window.webkitAudioContext)();
            const audioSource =
              this.audioContext.createMediaStreamSource(newStream);
            this.audioAnalyser = this.audioContext.createAnalyser();
            audioSource.connect(this.audioAnalyser);
            this.startAudioLevelMonitoring();
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
      this.connectionStatus = "Disconnected";
      await this.joinRoom();
    },

    leaveRoom() {
      // 모든 미디어 트랙 중지
      if (this.localStream) {
        this.localStream.getTracks().forEach((track) => track.stop());
      }

      // 모든 피어 연결 종료
      Object.keys(this.peerConnections).forEach((userId) => {
        this.handlePeerConnectionFailure(userId);
      });

      // 녹음 중이라면 중지
      if (this.isRecording) {
        this.stopRecording();
      }

      // 소켓 연결 종료
      if (this.socket) {
        this.socket.emit("leave-room", this.roomId);
        this.socket.disconnect();
      }

      // 오디오 컨텍스트 종료
      if (this.audioContext) {
        this.audioContext.close();
      }

      // 상태 초기화
      this.joined = false;
      this.connectionStatus = "Disconnected";
      this.participants = [];
      this.peerConnections = {};
      this.remoteStreams = {};
      this.audioElements = {};
      this.roomId = "";
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
  font-family: "Noto Sans KR", sans-serif;
  min-height: 100vh; /* height: 100vh를 min-height로 변경 */
  margin: 0;
  padding: 0;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  background: white;
  transition: width 0.3s ease;
  overflow: hidden;
  width: 60px;
}

.sidebar-collapsed {
  width: 60px;
}

.sidebar-content {
  width: 400px;
  height: 100%;
  min-width: 400px;
  transform: translateX(0);
  transition: transform 0.3s ease;
}

.sidebar-collapsed .sidebar-content {
  transform: translateX(-340px);
}

/* 로그인 화면 스타일 */
.login-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.login-box {
  background: white;
  padding: 40px;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  width: 300px;
  max-width: none;
  flex-shrink: 0;
  text-align: center;
}

.title {
  font-size: 2.5em;
  color: #2c3e50;
  margin-bottom: 10px;
  font-weight: 700;
}

.subtitle {
  color: #7f8c8d;
  margin-bottom: 30px;
  font-size: 1.1em;
}

.input-group {
  margin-bottom: 30px;
}

.room-input {
  width: 100%;
  padding: 15px;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 1.1em;
  margin-bottom: 15px;
  transition: all 0.3s ease;
}

.room-input:focus {
  border-color: #3498db;
  outline: none;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.2);
}

.input-filled {
  border-color: #3498db;
}

.join-button {
  width: 100%;
  padding: 15px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 1.1em;
  cursor: pointer;
  transition: all 0.3s ease;
}

.join-button:hover {
  background: #2980b9;
  transform: translateY(-2px);
}

.join-button:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
  transform: none;
}

.features {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-top: 40px;
}

.feature-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.feature-icon {
  font-size: 2em;
}

.feature-text {
  color: #7f8c8d;
  font-size: 0.9em;
}

/* 회의실 화면 스타일 */
.meeting-container {
  width: 360px;
  max-width: none;
  flex-shrink: 0;
  margin: 20px auto;
  padding: 24px;
  background: white;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  min-height: calc(100vh - 40px);
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.meeting-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 2px solid #f0f0f0;
}

.mouse-cursor {
  position: absolute;
  width: 15px;
  height: 15px;
  background-color: red;
  border-radius: 50%;
  pointer-events: none;
  transition: transform 0.05s linear;
}

.cursor-label {
  position: absolute;
  top: -20px;
  left: 5px;
  background-color: black;
  color: white;
  padding: 2px 5px;
  border-radius: 5px;
  font-size: 12px;
}

.room-title {
  font-size: 1.8em;
  color: #2c3e50;
  margin: 0;
}

.connection-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.status-badge {
  padding: 8px 15px;
  border-radius: 20px;
  font-size: 0.9em;
  font-weight: 500;
}

.Connected {
  background: #27ae60;
  color: white;
}

.Disconnected {
  background: #e74c3c;
  color: white;
}

.Error {
  background: #f1c40f;
  color: white;
}

.participants-count {
  color: #7f8c8d;
  font-size: 0.9em;
}

.content-grid {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 24px;
  flex-grow: 1;
}

.main-controls {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.audio-controls {
  width: 300px;
  max-width: none;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: #f6f6f6;
  border-radius: 12px;
}

.control-button {
  width: 100%;
  padding: 12px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
  font-weight: 500;
}

.control-button:hover {
  background: #2980b9;
}

.device-select {
  width: 100%;
  padding: 10px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 11px;
  transition: all 0.3s ease;
  outline: none;
  background-color: white;
}

.device-select:hover {
  border-color: #ababab;
}

.audio-meter {
  width: 100%;
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.meter-fill {
  height: 100%;
  background: #2ecc71;
  transition: width 0.1s ease;
}

.content-panels {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.recording-section,
.report-section,
.participants-section {
  width: 300px;
  max-width: none;
  flex-shrink: 0;
  padding: 20px;
  background: #f6f6f6;
  border-radius: 10px;
}

.report-section {
  flex-grow: 1;
  min-height: 400px;
}

.section-title {
  color: #2c3e50;
  margin-bottom: 20px;
  font-size: 1.5em;
}

.recording-button {
  padding: 11px 30px;
  background: #e74c3c;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;
}

.recording-button.recording-active {
  background: #c0392b;
  animation: pulse 2s infinite;
}

.meeting-report {
  background: white;
  padding: 16px;
  border-radius: 8px;
  border: 2px solid #e0e0e0;
  height: calc(100% - 60px);
  min-height: 300px;
  overflow-y: auto;
  font-size: 14px;
  line-height: 1.6;
}

.participants-section {
  width: 300px;
  max-width: none;
  flex-shrink: 0;
  padding: 20px;
  background: #f6f6f6;
  border-radius: 10px;
  min-height: 100px;
  height: auto;
}

.participants-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.participant-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: white;
  border-radius: 8px;
  margin-bottom: 8px;
  font-size: 14px;
}

.speaking-indicator {
  color: #e74c3c;
  animation: bounce 0.5s infinite;
}

.reconnect-button {
  width: 100%;
  padding: 15px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  margin-top: 20px;
  transition: all 0.3s ease;
}

.reconnect-button:hover {
  background: #2980b9;
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}

@keyframes bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-3px);
  }
}

.icon-wrapper {
  position: relative;
  display: inline-block;
}

.status-dot {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 12px;
  height: 12px;
  background-color: #22c55e;
  border-radius: 50%;
  border: 2px solid white;
}

.status-badge {
  padding: 8px 15px;
  border-radius: 20px;
  font-size: 0.9em;
  font-weight: 500;
  position: relative;
  overflow: hidden;
}

.status-text {
  display: inline-block;
  transition: opacity 0.3s ease;
}

.status-icon {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.status-badge:hover .status-text {
  opacity: 0;
}

.status-badge:hover .status-icon {
  opacity: 1;
}

.status-badge:hover {
  transform: scale(1.05);
}

.Connected:hover {
  background: #219a52;
}

.Disconnected:hover {
  background: #c0392b;
}

.Error:hover {
  background: #d4ac0d;
}
</style>
