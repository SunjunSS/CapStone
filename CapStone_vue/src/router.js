import { createRouter, createWebHistory } from "vue-router";
import MainHome from "./components/MainHome/MainHomeSideBar.vue";
import MindMap from "./components/MindMap/MindMap.vue";
import WeBRTC from "./components/WebRTC/WebRTC.vue";
import MouseTracking from "./components/WebRTC/mouseTracking.vue";
import MyMap from "./components/MainHome/MyMap.vue";
import Recent from "./components/MainHome/Recent.vue";
import TrashPage from "./components/MainHome/TrashPage.vue";
import Favorite from "./components/MainHome/Favorite.vue";

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
  {
    path: "/MyMap",
    component: MyMap,
  },
  {
    path: "/Recent",
    component: Recent,
  },
  {
    path: "/TrashPage",
    component: TrashPage,
  },
  {
    path: "/Favorite",
    component: Favorite,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
