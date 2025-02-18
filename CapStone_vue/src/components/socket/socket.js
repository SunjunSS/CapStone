// socket.js
import { io } from "socket.io-client";

// ✅ 소켓을 한 번만 생성하여 공유
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const socket = io(API_BASE_URL, {
  transports: ["websocket"],
});



// ✅ 로그인 후 소켓 연결 함수
export const connectSocket = () => {
  socket.on("connect", () => {
    console.log("🟢 소켓 연결됨:", socket.id);
  });

  socket.on("login_success", (data) => {
    console.log("✅ 로그인 성공:", data);
  });

  socket.on("login_error", (data) => {
    console.log("❌ 로그인 실패:", data);
  });
};


export const emitLogin = (email, password) => {
  socket.emit("login", { email, password });
};

// ✅ 로그아웃 시 소켓 연결 해제
function disconnectSocket() {
  if (socket.connected) {
    socket.disconnect();
    console.log("❌ 소켓 연결 해제됨");
  }
}

// // ✅ 방 ID 및 사용자 ID 관리
// const roomId = "room-1"; // 특정 방 ID (동적으로 설정 가능)
// const userId = Math.random().toString(36).substring(2, 7); // 랜덤한 사용자 ID

// // ✅ 방에 입장
// socket.emit("join-room", { roomId, userId });

// ✅ 소켓 객체 내보내기 (모든 컴포넌트에서 import 해서 사용)
export { socket, connectSocket, emitLogin, disconnectSocket };
