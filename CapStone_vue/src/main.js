import { createApp } from 'vue'
import { registerPlugins } from "./plugins/index.js";
import App from './App.vue'
import router from "./router.js"

const app = createApp(App)
app.use(router)

registerPlugins(app)

app.mount('#app')
