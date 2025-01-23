import { createRouter, createWebHistory } from 'vue-router'
import MainHome from './components/MindMap/MindMap.vue'
import WeBRTC from './components/WebRTC/WebRTC.vue'

const routes = [
  {
    path: '/',
    component: MainHome
  },
  {
    path: '/RTC',
    component: WeBRTC
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
