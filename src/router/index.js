import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/Home.vue'
import LoginView from '@/views/Login.vue'
import ProfileView from '@/views/Profile.vue'
import CrawlerView from '@/views/Crawler.vue'
import KnowledgeGraph from '@/views/KnowledgeGraph.vue'
import LiteratureDetail from '@/views/LiteratureDetail.vue'
import LiteratureListPage from '@/views/LiteratureListPage.vue'
import AboutPage from '@/views/AboutPage.vue'
import NotFound from '@/views/NotFound.vue'
// import AuthorsPage from '@/views/AuthorsPage.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
  },
  {
    path: '/404',
    name: 'NotFound',
    component: NotFound,
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404'
  },

  {
    path: '/about',
    name: 'about',
    component: AboutPage,
  },
  {
    path: '/guide',
    redirect: '/about#user-guide',
  },
  {
    path: '/feedback',
    redirect: '/about#feedback',
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
    redirect: '/404',
    // name: 'knowledge-graph',
    // component: KnowledgeGraph,
  },
  {
    path: '/literature/:id',
    name: 'literature-detail',
    component: LiteratureDetail,
    props: true,
  },
  {
    path: '/literature',
    name: 'literature-list',
    component: LiteratureListPage,
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
