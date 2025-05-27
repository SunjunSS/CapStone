<template>
  <div class="mouse-tracking-container">
    <!-- 다른 사용자들의 마우스를 손가락 모양으로 표시 -->
    <div
      v-if="!is3DMode"
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
import { socket } from "../socket/socket.js";

export default {
  props: {
    roomId: String,
    userId: String,
    is3DMode: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      cursors: {},
      mindmapBounds: { left: 0, top: 0, width: 1, height: 1 },
      mouseEventRegistered: false,
    };
  },
  methods: {
    getMindmapBounds() {
      return this.mindmapBounds;
    },

    getRelativePosition(event) {
      const mindmapBounds = this.getMindmapBounds();
      return {
        x: (event.clientX - mindmapBounds.left) / mindmapBounds.width,
        y: (event.clientY - mindmapBounds.top) / mindmapBounds.height,
      };
    },

    getAbsolutePosition(relativeX, relativeY) {
      const mindmapBounds = this.getMindmapBounds();
      return {
        x: mindmapBounds.left + relativeX * mindmapBounds.width,
        y: mindmapBounds.top + relativeY * mindmapBounds.height,
      };
    },

    handleMouseMove(event) {
      // 3D 모드이면 무시
      if (this.is3DMode) return;

      const relativePosition = this.getRelativePosition(event);
      if (!this.roomId || !this.userId) return;

      socket.emit("mouse-move", {
        roomId: this.roomId,
        userId: this.userId,
        x: relativePosition.x,
        y: relativePosition.y,
      });
    },

    // 이벤트 리스너 등록 및 제거 관리
    updateMouseTrackingStatus() {
      if (this.is3DMode) {
        // 3D 모드일 때는 이벤트 리스너 제거
        if (this.mouseEventRegistered) {
          console.log("3D 모드로 전환: 마우스 이벤트 리스너 제거");
          window.removeEventListener("mousemove", this.handleMouseMove);
          this.mouseEventRegistered = false;

          // 다른 사용자에게 커서 숨김 알림
          socket.emit("hide-cursor", {
            roomId: this.roomId,
            userId: this.userId,
          });
        }
      } else {
        // 2D 모드일 때는 이벤트 리스너 등록
        if (!this.mouseEventRegistered) {
          console.log("2D 모드로 전환: 마우스 이벤트 리스너 등록");
          window.addEventListener("mousemove", this.handleMouseMove);
          this.mouseEventRegistered = true;
        }
      }
    },
  },

  watch: {
    is3DMode: {
      immediate: true, // 컴포넌트 초기화 시에도 실행
      handler(newValue) {
        if (!this.roomId || !this.userId) return;

        console.log("모드 변경 감지:", newValue ? "3D" : "2D");

        // 이벤트 리스너 관리
        this.updateMouseTrackingStatus();

        // 모드 변경 이벤트 발송
        socket.emit("mode-change", {
          roomId: this.roomId,
          userId: this.userId,
          is3DMode: newValue,
        });
      },
    },
  },

  mounted() {
    // 초기 세팅 (컴포넌트 마운트 시 현재 모드에 맞게 설정)
    this.updateMouseTrackingStatus();

    socket.on("update-mindmap-bounds", (bounds) => {
      this.mindmapBounds = bounds;
    });

    socket.on("update-mouse", ({ userId, x, y }) => {
      const absolutePosition = this.getAbsolutePosition(x, y);
      this.cursors[userId] = { x: absolutePosition.x, y: absolutePosition.y };
    });

    socket.on("user-disconnected", (disconnectedUserId) => {
      if (this.cursors[disconnectedUserId]) {
        delete this.cursors[disconnectedUserId];
      }
    });

    socket.on("user-mode-changed", ({ userId, is3DMode }) => {
      if (is3DMode && this.cursors[userId]) {
        delete this.cursors[userId];
      }
    });

    socket.on("hide-user-cursor", (userId) => {
      if (this.cursors[userId]) {
        delete this.cursors[userId];
      }
    });
  },

  beforeUnmount() {
    // 이벤트 리스너 정리
    if (this.mouseEventRegistered) {
      window.removeEventListener("mousemove", this.handleMouseMove);
      this.mouseEventRegistered = false;
    }

    // 소켓 이벤트 리스너 정리
    socket.off("update-mindmap-bounds");
    socket.off("update-mouse");
    socket.off("user-disconnected");
    socket.off("user-mode-changed");
    socket.off("hide-user-cursor");

    // 컴포넌트 언마운트 시 커서 제거 알림
    if (this.roomId && this.userId) {
      socket.emit("leave-mouse-tracking", {
        roomId: this.roomId,
        userId: this.userId,
      });
    }

    this.cursors = {};
    this.mindmapBounds = { left: 0, top: 0, width: 1, height: 1 };
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
