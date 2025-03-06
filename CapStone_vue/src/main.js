import { createApp } from "vue";
import { registerPlugins } from "./plugins/index.js";
import App from "./App.vue";
import router from "./router.js";

const app = createApp(App);
app.use(router);

registerPlugins(app);

app.mount("#app");

// 뒤로가기 버튼 클릭 시 페이지 새로고침을 위한 이벤트 리스너 추가
window.addEventListener("popstate", () => {
  window.location.reload();
});
