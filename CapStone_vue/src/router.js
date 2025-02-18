import { createRouter, createWebHistory } from "vue-router";
import MainHome from "./components/MainHome/MainHomeSideBar.vue";
import MindMap from "./components/MindMap/MindMap.vue";
import WeBRTC from "./components/WebRTC/WebRTC.vue";
import MouseTracking from "./components/WebRTC/mouseTracking.vue";
import MyMap from "./components/MainHome/MyMap.vue";
import Register from "./components/User/Register.vue"
import Login from "./components/User/Login.vue"

const routes = [
  {
    path: "/",
    component: Login,
  },
  {
    path: "/MindMap",
    component: MindMap,
  },
  {
    path: "/RTC",
    component: WeBRTC,
  },
  {
    path: "/Mouse",
    component: MouseTracking,
  },
  {
    path: "/MyMap",
    component: MyMap,
  },
  {
    path: "/Register",
    component: Register,
  },
  {
    path: "/Login",
    component: Login,
  },

];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
