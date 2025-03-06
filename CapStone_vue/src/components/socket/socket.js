import { io } from "socket.io-client";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const socket = io(API_BASE_URL, {
  transports: ["websocket"],
  autoConnect: false, // 자동 연결 비활성화
});

let currentUser = null;
let projects = {};

// 소켓 연결 함수 수정
export const connectSocket = (callback) => {
  if (!socket.connected) {
    socket.connect();
    socket.on("connect", () => {
      console.log("🟢 소켓 연결됨:", socket.id);

      // localStorage에서 이메일 가져오기
      const storedEmail = sessionStorage.getItem("userEmail");

      if (storedEmail) {
        // 자동 재연결 시 사용자 정보 복구 ( 현재로그인한 사용자 )
        currentUser = { email: storedEmail };
        if (callback) callback();
      }
    });
  } else if (callback) {
    callback();
  }
};

// 로그인 함수 수정
export const emitLogin = (email, password, onLoginSuccess, onLoginError) => {
  socket.off("login_success");
  socket.off("login_error");

  socket.on("login_success", (data) => {
    currentUser = data.user;

    sessionStorage.setItem("userId", data.user.user_id); // ✅ 세션 스토리지에 저장

    console.log("✅ 로그인 성공");
    if (onLoginSuccess) onLoginSuccess(data.user);
  });

  socket.on("login_error", (data) => {
    console.log("❌ 로그인 실패:", data);
    const errorMessage = data.message || "로그인에 실패했습니다.";
    if (onLoginError) onLoginError(errorMessage);
  });

  socket.emit("login", { email, password });
};
// 로그아웃 함수 수정
export const disconnectSocket = () => {
  // 모든 리스너 제거
  socket.off("login_success");
  socket.off("login_error");
  socket.off("return_project");

  // 현재 유저 정보 초기화
  currentUser = null;
  projects = {};

  // ✅ 세션 스토리지에서 userId 제거
  sessionStorage.removeItem("userId");

  // 소켓 연결 해제
  if (socket.connected) {
    socket.disconnect();
    console.log("❌ 소켓 연결 해제됨");
  }
};

export const getCurrentUser = () => {
  return currentUser;
};

export const getProject = (email, callback) => {
  // 기존 리스너 제거
  socket.off("return_project");

  // 새로운 리스너 등록
  socket.on("return_project", (data) => {
    console.log("📂 받은 프로젝트 데이터:", data.message);
    callback(data.projects);
  });

  socket.emit("get_project", { email });
};

export { socket };
