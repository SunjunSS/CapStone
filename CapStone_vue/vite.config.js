import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";
import fs from "node:fs"; // 'node:' 접두사 사용

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    https: {
      key: fs.readFileSync("cert/192.168.0.9+3-key.pem"), // 파일 이름 확인 필요
      cert: fs.readFileSync("cert/192.168.0.9+3.pem"), // 파일 이름 확인 필요
    },
    host: "0.0.0.0", // 도메인 고정
    port: 5276, // 포트 번호 고정
    strictPort: true, // 포트가 이미 사용 중일 때 에러 발생
    proxy: {
      "/api": {
        target: "http://www.aladin.co.kr",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, "/ttb/api"),
      },
      "/socket.io": {
        target: "https://192.168.0.9:3000",
        changeOrigin: true,
        ws: true, // WebSocket 지원 활성화
      },
    },
  },
});
