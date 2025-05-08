import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import mitt from "mitt";
import AiAssistant from "./components/AiAssistant.vue";
// import mavonEditor from 'mavon-editor'
// import 'mavon-editor/dist/css/index.css'

const app = createApp(App);
app.config.globalProperties.$bus = mitt();
app.component("AiAssistant", AiAssistant);
app.use(store);
app.use(router);
app.use(ElementPlus);
// app.use(mavonEditor)

app.mount("#app");
