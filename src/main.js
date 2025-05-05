import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import mitt from 'mitt'
const app = createApp(App)
app.config.globalProperties.$bus = mitt()
app.use(store)
app.use(router)
app.use(ElementPlus)

app.mount('#app')
