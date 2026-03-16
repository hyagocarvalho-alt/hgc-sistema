<template>
  <div>
    <div class="topo">
      <h1>🏥 HGC</h1>
      <span>Olá, {{ usuario?.nome?.split(' ')[0] }}!</span>
      <button class="btn-sair" @click="sair">Sair</button>
    </div>

    <nav class="nav">
      <router-link to="/agendamentos">📋 Minhas Consultas</router-link>
      <router-link to="/nova-consulta">➕ Nova Consulta</router-link>
      <router-link v-if="usuario?.perfil !== 'paciente'" to="/admin">⚙️ Painel Admin</router-link>
    </nav>

    <div class="pagina">
      <div class="card">
        <h2>Minhas Consultas</h2>

        <div v-if="carregando" class="vazio">Carregando...</div>

        <div v-else-if="agendamentos.length === 0" class="vazio">
          <div class="vazio-icon">📅</div>
          <p>Nenhuma consulta agendada</p>
          <router-link to="/nova-consulta" class="btn-verde" style="display:inline-block;margin-top:1rem;text-decoration:none;padding:.7rem 1.5rem;border-radius:8px">
            Agendar agora
          </router-link>
        </div>

        <div v-for="a in agendamentos" :key="a.id" class="item">
          <div class="item-data">
            <div class="dia">{{ a.data.split('-')[2] }}</div>
            <div class="mes">{{ mesAbrev(a.data) }}</div>
          </div>
          <div class="item-info">
            <div class="medico">{{ a.medico }}</div>
            <div class="espec">{{ a.especialidade }}</div>
            <div class="horario">🕐 {{ a.horario }}</div>
            <div v-if="a.chuva" class="alerta-chuva">🌧️ Previsão de chuva neste dia</div>
          </div>
          <div class="item-acoes">
            <span class="status" :class="'status-' + a.status">{{ a.status }}</span>
            <button
              v-if="a.status !== 'cancelado' && a.status !== 'realizado'"
              class="btn-cancelar"
              @click="cancelar(a.id)">
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../services/api'

const router = useRouter()
const agendamentos = ref([])
const carregando = ref(true)
const usuario = ref(JSON.parse(localStorage.getItem('hgc_usuario') || 'null'))

const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
function mesAbrev(data) { return meses[parseInt(data.split('-')[1]) - 1] }

async function carregar() {
  carregando.value = true
  try {
    const { data } = await api.get('/agendamentos')
    agendamentos.value = data.agendamentos
  } catch (e) {
    console.error(e)
  } finally {
    carregando.value = false
  }
}

async function cancelar(id) {
  if (!confirm('Deseja cancelar esta consulta?')) return
  try {
    await api.patch(`/agendamentos/${id}/status`, { status: 'cancelado' })
    carregar()
  } catch (e) {
    alert('Erro ao cancelar.')
  }
}

function sair() {
  localStorage.removeItem('hgc_token')
  localStorage.removeItem('hgc_usuario')
  router.push('/login')
}

onMounted(carregar)
</script>

<style scoped>
.topo {
  background: #1a6b4a; color: white;
  padding: 1rem 2rem;
  display: flex; align-items: center; justify-content: space-between;
}
.topo h1 { font-size: 1.3rem; }
.topo span { font-size: .9rem; opacity: .85; }
.btn-sair {
  background: rgba(255,255,255,.2); border: none;
  color: white; padding: .4rem 1rem;
  border-radius: 6px; cursor: pointer; font-size: .85rem;
}

.nav { display: flex; background: white; border-bottom: 2px solid #e0ede7; }
.nav a {
  padding: .85rem 1.5rem; text-decoration: none;
  color: #4a6357; font-size: .92rem;
  border-bottom: 3px solid transparent; margin-bottom: -2px;
  transition: all .2s;
}
.nav a.router-link-active { color: #1a6b4a; border-bottom-color: #1a6b4a; font-weight: 600; }

.pagina { max-width: 800px; margin: 2rem auto; padding: 0 1rem; }
.card { background: white; border-radius: 12px; padding: 1.5rem; box-shadow: 0 2px 12px rgba(0,0,0,.06); }
.card h2 { color: #1a6b4a; margin-bottom: 1.25rem; }

.item {
  display: flex; align-items: center;
  padding: 1rem; border: 1px solid #e0ede7;
  border-radius: 10px; margin-bottom: .75rem;
  gap: 1rem;
}
.item-data {
  width: 52px; height: 56px;
  background: #e8f5ee; border-radius: 8px;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  flex-shrink: 0;
}
.dia { font-size: 1.4rem; font-weight: 700; color: #1a6b4a; line-height: 1; }
.mes { font-size: .65rem; color: #2d9467; text-transform: uppercase; }
.item-info { flex: 1; }
.medico { font-weight: 600; font-size: .95rem; }
.espec  { font-size: .82rem; color: #7a9588; margin-top: 2px; }
.horario { font-size: .8rem; color: #4a6357; margin-top: 4px; }
.alerta-chuva { font-size: .78rem; color: #2563eb; margin-top: 3px; }

.item-acoes { display: flex; flex-direction: column; align-items: flex-end; gap: .5rem; }
.status { font-size: .75rem; font-weight: 600; padding: 3px 10px; border-radius: 99px; }
.status-agendado   { background: #eff6ff; color: #2563eb; }
.status-confirmado { background: #e8f5ee; color: #1a6b4a; }
.status-realizado  { background: #f1f5f9; color: #64748b; }
.status-cancelado  { background: #fef2f2; color: #dc2626; }

.btn-cancelar {
  background: #fef2f2; color: #dc2626;
  border: none; border-radius: 6px;
  padding: .35rem .85rem; font-size: .82rem;
  cursor: pointer;
}

.vazio { text-align: center; padding: 3rem; color: #94a3b8; }
.vazio-icon { font-size: 2.5rem; margin-bottom: .75rem; }

.btn-verde { background: #1a6b4a; color: white; }
</style>