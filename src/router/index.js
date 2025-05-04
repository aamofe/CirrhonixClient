import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/Home.vue'
import LoginView from '@/views/Login.vue'
import ProfileView from '@/views/Profile.vue'
const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
  },
  {
    path: '/login',
    component: LoginView,
  },
  {
    path: '/profile',
    component: ProfileView,
  },
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
})
// router.beforeEach((to, from, next) => {
//   if (VueCookies.get("jwt") && to.path === "/login") {
//     next("/login");
//   }
// });

export default router
