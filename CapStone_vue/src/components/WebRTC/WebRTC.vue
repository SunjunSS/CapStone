<template>
  <div id="app">
    <div v-if="!joined" class="login-container">
      <div class="login-box">
        <h1 class="title">음성 회의실</h1>
        <p class="subtitle">음성 회의방에 참여하세요</p>

        <div class="input-group">
          <!-- 방 번호 입력 필드 제거 -->
          <button @click="joinRoom" :disabled="joining" class="join-button">
            {{ joining ? "입장중..." : "회의실 입장하기" }}
          </button>
        </div>

        <div class="features">
          <div class="feature-item">
            <span class="feature-icon">🎧</span>
            <span class="feature-text"
              >실시간 <br />
              음성대화</span
            >
          </div>
          <div class="feature-item">
            <span class="feature-icon">📝</span>
            <span class="feature-text"
              >회의록 <br />
              자동기록</span
            >
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
        <h2 class="room-title">Room: {{ displayRoomId }}</h2>
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
            <!-- 여기를 수정하여 닉네임 표시 -->
            {{ getUserDisplayName(id) }}
            {{ id === currentUserId ? "(나)" : "" }}
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
            :disabled="isProcessingRecording"
          >
            <v-icon v-if="isRecording" icon="mdi-microphone-off"></v-icon>
            <v-icon v-else icon="mdi-microphone"></v-icon>
          </button>
        </div>
      </div>

      <div class="report-section">
        <h3 class="section-title">회의 기록</h3>

        <!-- 🔹 처리 중 로딩 오버레이 -->
        <div v-if="isLoading" class="loading-overlay-in-card">
          <div class="processing-container">
            <div class="loading-spinner">
              <DotLottieVue
                style="height: 130px; width: 130px"
                autoplay
                loop
                speed="1.2"
                :src="lottieUrl"
              />
            </div>

            <div class="processing-text">회의록 생성 중</div>

            <div class="progress-bar-container">
              <div class="progress-bar"></div>
            </div>

            <!-- status-dots 부분을 제거 -->
          </div>
        </div>

        <!-- 회의 내용이 있을 경우 -->
        <div class="meeting-report" v-else v-html="meetingContent"></div>

        <div class="download-buttons-centered" v-if="!isLoading">
          <button class="download-button" @click="downloadAudio">
            음성파일 다운로드
          </button>
          <button class="download-button" @click="downloadPDF">
            PDF 다운로드
          </button>
        </div>
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
import uploadAudio from "../audio/uploadAudio";
import meetingContent from "../audio/meetingContent";
import meetingPDF from "../audio/meetingPDF";
import { fetchHeaderBlob } from "../audio/fetchHeaderBlob";
import { DotLottieVue } from "@lottiefiles/dotlottie-vue";

export default {
  name: "AudioMeetingApp",
  components: {
    DotLottieVue,
  },
  props: {
    // roomId props 추가
    autoJoinRoomId: {
      type: String,
      default: "",
    },
  },
  data() {
    return {
      lottieUrl:
        "https://lottie.host/40e2218d-5c55-4588-908a-02eb89cdb36a/7109HrIh1Q.lottie",
      socket: null,
      activeBufferIndex: null,
      currentUserId: null,
      peerConnections: {},
      localStream: null,
      isPoliteMap: [],
      isCreatingOfferMap: {},
      remoteStreams: {},
      audioElements: {},
      roomId: "",
      participants: [],
      joined: false,
      joining: false,
      isMuted: false,
      audioDevices: [],
      selectedAudioDevice: "",
      sttProcess: null,
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
      temporaryChunks: [],
      uploadInterval: null,
      meetingContent: "<p style='color: #bbb;'>아직 회의록이 없습니다.</p>", // 기본 텍스트
      participantNicknames: {}, // 참가자 닉네임 저장용 객체 추가
      rootNode: null,
      audioBlob: null,
      headerBlob: null,
      pdfBlob: null,
      isProcessingRecording: false, // 녹음 처리 중이면 true
      isLoading: false,
    };
  },

  // autoJoinRoomId가 있으면 컴포넌트 마운트 시 자동으로 방에 참여
  async mounted() {
    // 🔥 Lottie 애니메이션 사전 로딩 추가
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = this.lottieUrl;
    document.head.appendChild(link);

    if (this.autoJoinRoomId) {
      // props로 받은 roomId를 바로 설정
      this.roomId = this.autoJoinRoomId;
      // 자동 참가는 하지 않고, 사용자가 버튼을 클릭할 때만 참가
    }

    window.addEventListener("popstate", this.handlePopState);
  },

  beforeUnmount() {
    window.removeEventListener("popstate", this.handlePopState);
    this.leaveRoom(); // 컴포넌트가 파괴될 때도 방 떠나기
  },

  computed: {
    // 현재 사용자의 닉네임 (MainHomeSideBar와 유사한 방식)
    userNickname() {
      return (
        sessionStorage.getItem("userNickname") ||
        sessionStorage.getItem("userEmail") ||
        "익명 사용자"
      );
    },

    // 사용자가 로그인 상태인지 확인
    isLoggedIn() {
      return (
        sessionStorage.getItem("isLoggedIn") === "true" &&
        sessionStorage.getItem("userEmail") !== null
      );
    },

    // 표시용 방 번호 (숫자만)
    displayRoomId() {
      return this.roomId.replace("project-audio-", "");
    },
  },
  methods: {
    handlePopState() {
      console.log("뒤로가기 감지");
      this.leaveRoom();
    },

    // 사용자의 닉네임을 가져오는 함수
    getUserDisplayName(userId) {
      // 현재 사용자인 경우 세션 스토리지에서 닉네임 가져오기
      if (userId === this.currentUserId) {
        return this.userNickname;
      }
      // 다른 참가자의 경우 저장된 닉네임 사용하거나 ID 표시
      return this.participantNicknames[userId] || userId;
    },

    // joinRoom 메서드에서 방 번호 검증 부분 수정
    async joinRoom() {
      try {
        // autoJoinRoomId를 사용
        if (this.autoJoinRoomId) {
          this.roomId = this.autoJoinRoomId;
        }

        // 방 번호가 있는지 확인
        if (!this.roomId) {
          alert("방 번호가 필요합니다.");
          return;
        }

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
        this.socket.emit("start-recording", this.roomId);

        console.log("🎙️ 녹음 시작");
      } else {
        this.socket.emit("stop-recording", this.roomId);

        console.log("🎙️ 녹음 중지");
      }
    },

    async checkRecording() {
      // 클라이언트에서 녹음 시작/중지 처리
      if (this.isRecording) {
        // 녹음 시작 함수
        console.log(`🎙️ 녹음시작 - WebRTC.vue:270`);
        this.startRecording(); // 녹음 시작
      } else {
        // 녹음 중지 함수
        console.log(`🎙️ 녹음중지 - WebRTC.vue:275`);
        this.stopRecording();
      }
    },

    // 녹음 시작 메서드
    async startRecording() {
      if (!this.localStream) return;

      this.recordedChunks = [];

      try {
        // 헤더 블롭을 한 번만 설정

        if (this.headerBlob == null) {
          const headerAudio = await fetchHeaderBlob();

          this.headerBlob = headerAudio;
          console.log("✅ 헤더오디오 저장완료!");

          // this.recordedChunks.push(this.headerBlob);
        }
      } catch (error) {
        console.error("헤더 오디오 로드실패:", error);
      }

      this.mediaRecorder = new MediaRecorder(this.localStream, {
        mimeType: "audio/webm; codecs=opus;",
        bitrateMode: "variable",
        audioBitsPerSecond: 64000,
      });

      this.mediaRecorder.ondataavailable = async (event) => {
        const blob = new Blob([this.headerBlob, event.data], {
          type: "audio/webm", // Blob의 MIME 타입을 설정 (여기서는 예시로 webm을 사용)
        });

        console.log(`🔄 ondataavailable: ${blob.size}bytes`);

        this.recordedChunks.push(event.data);

        if (blob.size > 0 && this.mediaRecorder.state === "recording") {
          try {
            await uploadAudio(blob, this.roomId, this.userNickname, "realTime");
            console.log("✅ 업로드 성공");
          } catch (err) {
            console.error("❌ 업로드 실패:", err.message);
          }
        } else {
          console.warn("🚫 실시간 종료");
        }
      };

      this.uploadInterval = setInterval(async () => {
        if (this.mediaRecorder.state === "recording") {
          this.mediaRecorder.requestData(); // => 이때 ondataavailable 이벤트 발생
        }
      }, 15000);

      this.mediaRecorder.onstop = async () => {
        if (this.recordedChunks.length === 0) {
          console.error("❌ 녹음 데이터가 없습니다.");
          return;
        }

        clearInterval(this.uploadInterval);

        const blob = new Blob(this.recordedChunks, { type: "audio/webm" });
        console.log("🎤 녹음 데이터 준비 완료, 업로드 시작...");

        // 서버로 audio파일을 업로드함
        try {
          console.log(`🔄 ondataavailable: ${blob.size}bytes`);
          await uploadAudio(blob, this.roomId, this.userNickname, "meeting");
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
        this.isProcessingRecording = true;
        this.isLoading = true; // 🔹 로딩 시작
        this.mediaRecorder.stop();
      }
      this.isRecording = false;
    },

    async setupSignaling() {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL; // ✅ 환경변수 사용

      this.socket = io(`${API_BASE_URL}`, {
        transports: ["websocket"],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      return new Promise((resolve, reject) => {
        // WebRTC.vue의 setupSignaling 메서드 내에서 수정
        this.socket.on("connect", () => {
          this.connectionStatus = "Connected";
          this.currentUserId = this.socket.id;

          // 닉네임 정보를 방 참가 이벤트와 함께 전송
          this.socket.emit("join-room", {
            roomId: this.roomId,
            userId: this.currentUserId,
            nickname: this.userNickname, // 닉네임 정보 포함
          });

          // 추가: 입장 후 즉시 닉네임 정보를 방 전체에 공유
          this.socket.emit("update-nickname", {
            roomId: this.roomId,
            userId: this.currentUserId,
            nickname: this.userNickname,
          });

          resolve();
        });

        // 닉네임 정보 동기화를 위한 이벤트 리스너 추가
        this.socket.on("sync-nicknames", (nicknames) => {
          this.participantNicknames = nicknames;
        });

        // 녹음 상태 동기화 (누군가 녹음을 시작했을 때, 종료했을때)
        this.socket.on("sync-recording", (isRecording) => {
          this.isRecording = isRecording;

          console.log(`녹음상태 변화 : ${isRecording}`);
          //녹음 시작 or 녹음 중지함수를 실행
          this.checkRecording();
        });

        this.socket.on("return-recording", async (data) => {
          const { recordingData, fileBuffer } = data;

          console.log("🟢 서버에서 녹음 데이터 수신:", recordingData);

          this.rootNode = recordingData.rootNode;

          // base64로 전달된 MP3 파일을 Blob으로 변환
          const audioBlob = new Blob(
            [
              new Uint8Array(
                atob(fileBuffer)
                  .split("")
                  .map((c) => c.charCodeAt(0))
              ),
            ],
            { type: "audio/mp3" }
          );

          // 파일을 URL로 변환
          const audioUrl = URL.createObjectURL(audioBlob);

          this.audioBlob = audioBlob;

          // 회의록 업데이트
          const report = meetingContent(recordingData);

          // 📄 회의록 PDF 생성
          const doc = await meetingPDF(recordingData);
          const pdfBlob = await doc.output("blob");
          this.pdfBlob = pdfBlob;

          const node = recordingData.rootNode;
          console.log("테스트 루트 노드: " + node);

          console.log("📄PDF 생성완료");

          const nodes = recordingData.minutes.recommendNodes;

          console.log("🟢 반환된 추천 노드: ", nodes);
          this.meetingContent = report;

          this.isProcessingRecording = false; // 🔹 완료 시 녹음 버튼 다시 활성화
          this.isLoading = false; // 🔹 회의록 수신 후 로딩 종료
        });

        this.socket.on("return-keyword", (data) => {
          const { recordingData } = data;
          const jsonString = JSON.stringify(recordingData, null, 2);
          console.log(`반환된 키워드: ${jsonString}`);
        });

        this.socket.on("connect_error", (error) => {
          this.connectionStatus = "Error";
          reject(new Error(`Connection failed: ${error.message}`));
        });

        // 기존 참가자 목록을 받았을 때
        this.socket.on(
          "existing-participants",
          async ({ participants, nicknames }) => {
            console.log("Received existing participants:", nicknames);

            // 닉네임 정보가 있으면 저장
            if (nicknames) {
              this.participantNicknames = nicknames;
            }

            this.isPoliteMap[this.currentUserId] = false;

            for (const userId of participants) {
              if (userId !== this.currentUserId) {
                console.log(
                  `협상요청 ${this.participantNicknames[userId]}님에게 진행`
                );
                await this.createPeerConnection(userId, true);
              }
            }
          }
        );

        // 새로운 참가자가 들어왔을 때
        this.socket.on(
          "new-participant",
          async ({ participantId, nickname }) => {
            console.log("New participant joined:", participantId);

            // 새 참가자의 닉네임 저장
            if (nickname) {
              this.participantNicknames[participantId] = nickname;
            }

            // 새 참가자에게는 협상요청을 안함, 새 참가자가 기존 참가자들에게 해야함.
            if (participantId !== this.currentUserId) {
              this.isPoliteMap[participantId] = true;
              //await this.createPeerConnection(participantId, false);
            }
          }
        );

        this.socket.on("room-update", ({ participants }) => {
          this.participants = participants;
        });

        // signal요청을 받게된다. handleSignal함수로 처리해줌
        this.socket.on("signal", this.handleSignal);

        this.socket.on("user-disconnected", this.handleUserDisconnected);
      });
    },

    async createPeerConnection(userId, isInitiator = false) {
      if (this.peerConnections[userId]) {
        await this.handlePeerConnectionFailure(userId);
      }

      // 새로운 유저라면 isInitiator = true이다.
      // 새 유저가 아니면 imPolite로 설정(false)
      this.isPoliteMap[userId] = isInitiator;

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

      // creatingOfferMap 객체를 통해서 각 peerConnction에 대한 상태 관리
      if (!this.isCreatingOfferMap) this.isCreatingOfferMap = {};
      this.isCreatingOfferMap[userId] = false;

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
          if (
            this.isPoliteMap[userId] &&
            peerConnection.signalingState === "stable" &&
            !this.isCreatingOfferMap[userId]
          ) {
            console.log(
              `🌟 ${this.participantNicknames[userId]} is polite: Creating an offer.`
            );
            this.isCreatingOfferMap[userId] = true;

            const offer = await peerConnection.createOffer({
              offerToReceiveAudio: true,
              offerToReceiveVideo: false,
            });

            await peerConnection.setLocalDescription(offer);

            this.socket.emit("signal", {
              targetId: userId,
              signal: offer,
            });

            console.log("✅ Offer created and sent successfully.");
          } else {
            console.warn(
              "🚫 Negotiation skipped: Not in stable state or polite."
            );
          }
        } catch (error) {
          console.error("Negotiation failed:", error);
        } finally {
          this.isCreatingOfferMap[userId] = false;
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

      // if (isInitiator) {
      //   try {
      //     if (peerConnection.signalingState === "stable") {
      //         const offer = await peerConnection.createOffer({
      //           offerToReceiveAudio: true,
      //           offerToReceiveVideo: false,
      //         });
      //       await peerConnection.setLocalDescription(offer);
      //       this.socket.emit("signal", {
      //         targetId: userId,
      //         signal: offer,
      //       });
      //     }
      //   } catch (error) {
      //     console.error("Error creating offer:", error);
      //     this.handlePeerConnectionFailure(userId);
      //   }
      // }

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
      console.warn(`🚫 Cleaning up failed connection with ${userId}`);

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

      console.log(`🔄 Connection with ${userId} has been cleaned up.`);
    },

    handleUserDisconnected(userId) {
      this.handlePeerConnectionFailure(userId);
      this.participants = this.participants.filter((id) => id !== userId);
      // 닉네임 정보도 제거
      delete this.participantNicknames[userId];
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

    downloadAudio() {
      if (!this.audioBlob) {
        alert("아직 음성 녹음이 존재하지 않습니다.");
        return;
      }
      const audioUrl = URL.createObjectURL(this.audioBlob);
      const link = document.createElement("a");
      link.href = audioUrl;
      link.download = `${this.roomId}_audio.mp3`;
      link.click();
      URL.revokeObjectURL(audioUrl);
    },

    downloadPDF() {
      if (!this.pdfBlob) {
        alert("아직 PDF 회의록이 존재하지 않습니다.");
        return;
      }
      const pdfUrl = URL.createObjectURL(this.pdfBlob);
      const link = document.createElement("a");

      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const day = String(today.getDate()).padStart(2, "0");
      const date = `${year}.${month}.${day}`;

      link.href = pdfUrl;
      link.download = `${date}-${this.rootNode}.pdf`;
      link.click();
      URL.revokeObjectURL(pdfUrl);
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
      this.participantNicknames = {}; // 참가자 닉네임 초기화 추가

      // 회의 기록 초기화 추가
      this.meetingContent =
        "<p style='color: #bbb;'>아직 회의록이 없습니다.</p>";
    },
  },
  beforeDestroy() {
    if (this.socket) {
      this.socket.disconnect();
      this.leaveRoom();
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

.mouse-tracking-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.cursor {
  position: absolute;
  width: 5px;
  height: 5px;
  pointer-events: none; /* 클릭 이벤트가 발생하지 않도록 설정 */
  transform: translate(-50%, -50%); /* 커서가 정확히 마우스 위치에 놓이도록 */
  background-color: none;
  font-size: 20px;
  border-radius: 50%; /* 원형으로 만들기 */
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

.download-button {
  padding: 10px 16px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 13.9px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.download-button:hover {
  background: #2980b9;
}

.download-buttons-centered {
  display: flex;
  justify-content: center; /* 중앙 정렬 */
  gap: 10px;
  margin-top: 20px;
}

.recording-button:disabled {
  background: #bdc3c7; /* 회색 배경 */
  color: white; /* 텍스트 색 유지 */
  cursor: not-allowed; /* 금지 표시 커서 */
  opacity: 0.7; /* 시각적으로 흐리게 */
  animation: none !important; /* pulse 애니메이션 비활성화 */
}

.loading-overlay-in-card {
  position: relative;
  width: 100%;
  height: 300px;
  background-color: rgba(245, 245, 250, 0.05);
  backdrop-filter: blur(5px);
  border-radius: 12px;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  z-index: 10;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.processing-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
}

.loading-spinner {
  position: relative;
  width: 150px;
  height: 150px;
  margin-bottom: 5px;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* 처리 중 텍스트 */
.processing-text {
  font-family: "Noto Sans KR", sans-serif;
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin-top: -15px;
  opacity: 0.9;
  animation: text-pulse 2s ease-in-out infinite;
}

/* 진행 상태 표시줄 */
.progress-bar-container {
  width: 200px;
  height: 4px;
  background-color: rgba(200, 200, 220, 0.3);
  border-radius: 2px;
  overflow: hidden;
  margin-top: 5px;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #00c6ff, #0072ff, #7c3aed);
  border-radius: 2px;
  animation: progress-animation 2.5s ease-in-out infinite;
}

/* 텍스트 펄스 애니메이션 */
@keyframes text-pulse {
  0%,
  100% {
    opacity: 0.9;
  }
  50% {
    opacity: 0.6;
  }
}

/* 진행 상태 표시줄 애니메이션 */
@keyframes progress-animation {
  0% {
    width: 10%;
    background-position: 0% 50%;
  }
  50% {
    width: 70%;
    background-position: 100% 50%;
  }
  100% {
    width: 10%;
    background-position: 0% 50%;
  }
}
</style>
