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
import { socket, roomId, userId } from "../socket/socket.js"; // ✅ 전역 소켓 사용

export default {
  data() {
    return {
      cursors: {}, // 다른 사용자들의 마우스 위치 저장
    };
  },
  mounted() {
    // ✅ 방 참가 알림은 `socket.js`에서 이미 실행됨

    // ✅ 마우스 이동 이벤트 감지 후 서버로 전송
    window.addEventListener("mousemove", (event) => {
      socket.emit("mouse-move", {
        roomId,
        userId,
        x: event.clientX,
        y: event.clientY,
      });
    });

    // ✅ 다른 사용자들의 마우스 위치 업데이트
    socket.on("update-mouse", ({ userId, x, y }) => {
      this.cursors[userId] = { x, y };
    });

    // ✅ 사용자 퇴장 시 마우스 표시 제거
    socket.on("user-disconnected", (disconnectedUserId) => {
      if (this.cursors[disconnectedUserId]) {
        delete this.cursors[disconnectedUserId];
      }
    });
  },
};
</script>

<style scoped>
.tracking-area {
  width: 100vw;
  height: 100vh;
  background-color: transparent;
  position: relative;
}

.mouse-tracking-layer {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none; /* 클릭 방해 X */
  z-index: 998; /* 최상위 레이어 */
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
  z-index: 999;
}

.finger-cursor {
  font-size: 100px; /* 손가락 크기 */
  color: red; /* 손가락 색상 */
}
</style>
