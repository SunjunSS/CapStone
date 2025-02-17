import { createRouter, createWebHistory } from "vue-router";
import MainHome from "./components/MainHome/MainHome.vue";
import MindMap from "./components/MindMap/MindMap.vue";
import WeBRTC from "./components/WebRTC/WebRTC.vue";
import MouseTracking from "./components/WebRTC/mouseTracking.vue";

const routes = [
  {
    path: "/",
    component: MainHome,
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
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
