<template>
  <div class="mouse-tracking-container">
    <!-- 다른 사용자들의 마우스를 손가락 모양으로 표시 -->
    <div
      v-for="(cursor, userId) in cursors"
      :key="userId"
      class="cursor"
      :style="{ left: cursor.x + 'px', top: cursor.y + 'px' }"
    >
      👆
    </div>
  </div>
</template>

<script>
import { io } from "socket.io-client";

export default {
  data() {
    return {
      socket: null,
      userId: "",
      roomId: "room-1", // 특정 방 ID (필요시 동적으로 설정 가능)
      room: [],
      cursors: {} // 다른 사용자들의 마우스 위치 저장
    };
  },
  mounted() {
    // 소켓 초기화
    const API_BASE_URL = `http://54.180.153.199:3000`;
    this.socket = io("http://54.180.32.202:3000", { transports: ["websocket"] });

    // 랜덤 ID 생성 (4~5글자)
    this.userId = Math.random().toString(36).substring(2, 7);
    
    // 서버에 참가 알림
    this.socket.emit("join-room", { roomId: this.roomId, userId: this.userId });

    this.socket.on("room-update", ({room}) => {
      this.room = room;
    });

    // 마우스 이동 이벤트 감지 후 서버로 전송
    window.addEventListener("mousemove", (event) => {
      this.socket.emit("mouse-move", {
        roomId: this.roomId,
        userId: this.userId,
        x: event.clientX,
        y: event.clientY,
      });
    });

    // 다른 사용자들의 마우스 위치 업데이트
    this.socket.on("update-mouse", ({ userId, x, y }) => {
      this.cursors[userId] = {x,y};
    });

    // 사용자 퇴장 시 마우스 표시 제거
    this.socket.on("user-disconnected", (userId) => {
      if (this.cursors[userId]) {
        const updatedCursors = { ...this.cursors };
        delete updatedCursors[userId];
        this.cursors = updatedCursors; // 반응성을 유지하기 위해 새 객체 할당
      }
    });
  },
  beforeDestroy() {
    // 사용자가 나갈 때 서버에 알림
    this.socket.emit("leave-room", { roomId: this.roomId, userId: this.userId });
    this.socket.disconnect();
  }
};
</script>

<style scoped>
.tracking-area {
  width: 100vw;
  height: 100vh;
  background-color: transparent;
  position: relative;
}
.mouse-tracking-container {
  position: relative;
  width: 100%;
  height: 100%;
  background-color: transparent; /* 투명 배경 */
}

.mouse-tracking-layer {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none; /* 클릭 방해 X */
  z-index: 9999; /* 최상위 레이어 */
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


.finger-cursor {
  font-size: 100px; /* 손가락 크기 */
  color: red; /* 손가락 색상 */
}
</style>

