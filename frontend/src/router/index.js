import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import AgendamentosView from '../views/AgendamentosView.vue'
import NovaConsultaView from '../views/NovaConsultaView.vue'
import AdminView from '../views/AdminView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/login' },
    { path: '/login', component: LoginView },
    {
      path: '/agendamentos',
      component: AgendamentosView,
      meta: { requiresAuth: true }
    },
    {
      path: '/nova-consulta',
      component: NovaConsultaView,
      meta: { requiresAuth: true }
    },
    {
      path: '/admin',
      component: AdminView,
      meta: { requiresAuth: true, adminOnly: true }
    }
  ]
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('hgc_token')
  const usuario = JSON.parse(localStorage.getItem('hgc_usuario') || 'null')

  if (to.meta.requiresAuth && !token) {
    next('/login')
  } else if (to.meta.adminOnly && usuario?.perfil === 'paciente') {
    next('/agendamentos')
  } else {
    next()
  }
})

export default router