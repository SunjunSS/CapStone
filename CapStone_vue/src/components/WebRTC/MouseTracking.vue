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
import { socket } from "../socket/socket.js"; // ✅ 전역 소켓 사용

export default {
  props: {
    roomId: String, // ✅ MindMap.vue에서 전달된 roomId
    userId: String, // ✅ MindMap.vue에서 전달된 userId
  },
  data() {
    return {
      cursors: {}, // 다른 사용자들의 마우스 위치 저장
      mindmapBounds: { left: 0, top: 0, width: 1, height: 1 },
    };
  },
  methods: {
    // MindMap 위치 및 크기 가져오기 (마인드맵에서 제공하는 값 사용)
    getMindmapBounds() {
      return this.mindmapBounds; // 서버에서 받은 MindMap 위치 사용
    },

    // 마우스 좌표를 MindMap 기준 상대 좌표로 변환
    getRelativePosition(event) {
      const mindmapBounds = this.getMindmapBounds();
      return {
        x: (event.clientX - mindmapBounds.left) / mindmapBounds.width,
        y: (event.clientY - mindmapBounds.top) / mindmapBounds.height,
      };
    },

    // 상대 좌표를 내 화면 기준 절대 좌표로 변환
    getAbsolutePosition(relativeX, relativeY) {
      const mindmapBounds = this.getMindmapBounds();
      return {
        x: mindmapBounds.left + relativeX * mindmapBounds.width,
        y: mindmapBounds.top + relativeY * mindmapBounds.height,
      };
    },

    handleMouseMove(event) {
      const relativePosition = this.getRelativePosition(event);
      if (!this.roomId) return;

      socket.emit("mouse-move", {
        roomId: this.roomId,
        userId: this.userId,
        x: relativePosition.x,
        y: relativePosition.y,
      });
    },
  },
  beforeUnmount() {
    // Clean up all event listeners
    socket.off("update-mindmap-bounds");
    socket.off("update-mouse");
    socket.off("user-disconnected");

    // Remove the mousemove event listener
    window.removeEventListener("mousemove", this.handleMouseMove);

    this.cursors = {}; // 다른 사용자들의 마우스 위치 저장
    this.mindmapBounds = { left: 0, top: 0, width: 1, height: 1 };
  },
  created() {
    // Define handleMouseMove as a method property so we can remove it later
    this.handleMouseMove = (event) => {
      const relativePosition = this.getRelativePosition(event);
      if (!this.roomId) return;

      socket.emit("mouse-move", {
        roomId: this.roomId,
        userId: this.userId,
        x: relativePosition.x,
        y: relativePosition.y,
      });
    };
  },
  mounted() {
    socket.on("update-mindmap-bounds", (bounds) => {
      this.mindmapBounds = bounds;
    });

    // 메서드 참조로 이벤트 리스너 등록
    window.addEventListener("mousemove", this.handleMouseMove);

    // ✅ 다른 사용자들의 마우스 위치 업데이트
    socket.on("update-mouse", ({ userId, x, y }) => {
      const absolutePosition = this.getAbsolutePosition(x, y);
      this.cursors[userId] = { x: absolutePosition.x, y: absolutePosition.y };
      console.log("11111111111111111111");
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
