import { createRouter, createWebHistory } from "vue-router";
import MainHome from "./components/MainHome/MainHomeSideBar.vue";
import MindMap from "./components/MindMap/MindMap.vue";
import WeBRTC from "./components/WebRTC/WebRTC.vue";
import MouseTracking from "./components/WebRTC/mouseTracking.vue";
import MyMap from "./components/MainHome/MyMap.vue";
import Register from "./components/User/Register.vue";
import Login from "./components/User/Login.vue";
import Recent from "./components/MainHome/Recent.vue";
import Project from "./components/MainHome/Project.vue";
import TrashPage from "./components/MainHome/TrashPage.vue";
import Favorite from "./components/MainHome/Favorite.vue";
import LoginRequired from "./components/MainHome/LoginRequired.vue";
import Drawing from "./components/MainHome/Drawing.vue";

const routes = [
  {
    path: "/",
    component: MainHome,
  },
  {
    path: "/MindMap/:project_id?",
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
  {
    path: "/Recent",
    component: Recent,
  },
  {
    path: "/Project",
    component: Project,
  },
  {
    path: "/TrashPage",
    component: TrashPage,
  },
  {
    path: "/Favorite",
    component: Favorite,
  },
  {
    path: "/LoginRequired",
    component: LoginRequired,
  },
  {
    path: "/Drawing",
    component: Drawing,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
