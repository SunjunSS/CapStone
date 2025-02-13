import { createRouter, createWebHistory } from 'vue-router'
import MainHome from './components/MindMap/MindMap.vue'
import WeBRTC from './components/WebRTC/WebRTC.vue'
import MouseTracking from './components/WebRTC/MouseTracking.vue'
import Login from './components/User/Login.vue'
import Register from './components/User/Register.vue'

const routes = [
  {
    path: '/',
    component: MainHome,
  },
  {
    path: '/RTC',
    component: WeBRTC,
  },
  {
    path: '/Mouse',
    component: MouseTracking,
  },
  {
    path: '/Login',
    component: Login,
  },
  {
    path: '/Register',
    component: Register,
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
