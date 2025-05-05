import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/Home.vue'
import LoginView from '@/views/Login.vue'
import ProfileView from '@/views/Profile.vue'
import CrawlerView from '@/views/Crawler.vue'
import KnowledgeGraph from '@/views/KnowledgeGraph.vue'
import LiteratureDetail from '@/views/LiteratureDetail.vue'
import SearchView from '@/views/Search.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
  },
  {
    path: '/profile',
    name: 'profile',
    component: ProfileView,
  },
  {
    path: '/crawler',
    name: 'crawler',
    component: CrawlerView,
  },
  {
    path: '/knowledge-graph',
    name: 'knowledge-graph',
    component: KnowledgeGraph,
  },
  {
    path: '/literature/:id',
    name: 'literature-detail',
    component: LiteratureDetail,
    props: true,
  },
  {
    path: '/search',
    name: 'search',
    component: SearchView,
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
