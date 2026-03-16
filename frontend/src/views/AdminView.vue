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
      <router-link to="/admin">⚙️ Painel Admin</router-link>
    </nav>

    <div class="pagina">

      <!-- Estatísticas -->
      <div class="stats">
        <div class="stat">
          <div class="stat-valor">{{ total }}</div>
          <div class="stat-label">Total</div>
        </div>
        <div class="stat">
          <div class="stat-valor">{{ agendados }}</div>
          <div class="stat-label">Agendados</div>
        </div>
        <div class="stat">
          <div class="stat-valor">{{ confirmados }}</div>
          <div class="stat-label">Confirmados</div>
        </div>
        <div class="stat">
          <div class="stat-valor">{{ realizados }}</div>
          <div class="stat-label">Realizados</div>
        </div>
        <div class="stat">
          <div class="stat-valor">{{ cancelados }}</div>
          <div class="stat-label">Cancelados</div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h2>⚙️ Todos os Agendamentos</h2>
          <!-- Filtro por status -->
          <select v-model="filtro" class="filtro">
            <option value="">Todos</option>
            <option value="agendado">Agendados</option>
            <option value="confirmado">Confirmados</option>
            <option value="realizado">Realizados</option>
            <option value="cancelado">Cancelados</option>
          </select>
        </div>

        <div v-if="erro" class="erro">{{ erro }}</div>
        <div v-if="sucesso" class="sucesso">{{ sucesso }}</div>

        <div v-if="carregando" class="vazio">Carregando...</div>

        <div v-else-if="agendamentosFiltrados.length === 0" class="vazio">
          <div class="vazio-icon">📋</div>
          <p>Nenhum agendamento encontrado</p>
        </div>

        <div v-for="a in agendamentosFiltrados" :key="a.id" class="item">
          <div class="item-data">
            <div class="dia">{{ a.data.split('-')[2] }}</div>
            <div class="mes">{{ mesAbrev(a.data) }}</div>
          </div>
          <div class="item-info">
            <div class="medico">{{ a.medico }}</div>
            <div class="espec">{{ a.especialidade }}</div>
            <div class="paciente">👤 {{ a.paciente_nome }}</div>
            <div class="horario">🕐 {{ a.horario }}</div>
            <div v-if="a.chuva" class="alerta-chuva">🌧️ Previsão de chuva</div>
          </div>
          <div class="item-acoes">
            <span class="status" :class="'status-' + a.status">{{ a.status }}</span>
            <div class="botoes">
              <button
                v-if="a.status === 'agendado'"
                class="btn-confirmar"
                @click="atualizar(a.id, 'confirmado')">
                Confirmar
              </button>
              <button
                v-if="a.status === 'confirmado'"
                class="btn-concluir"
                @click="atualizar(a.id, 'realizado')">
                Concluir
              </button>
              <button
                v-if="a.status !== 'cancelado' && a.status !== 'realizado'"
                class="btn-cancelar"
                @click="atualizar(a.id, 'cancelado')">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../services/api'

const router = useRouter()
const usuario = ref(JSON.parse(localStorage.getItem('hgc_usuario') || 'null'))
const agendamentos = ref([])
const carregando = ref(true)
const filtro = ref('')
const erro = ref('')
const sucesso = ref('')

const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
function mesAbrev(data) { return meses[parseInt(data.split('-')[1]) - 1] }

function msg(tipo, texto) {
  if (tipo === 'erro') erro.value = texto
  else sucesso.value = texto
  setTimeout(() => { erro.value = ''; sucesso.value = '' }, 3000)
}

const agendamentosFiltrados = computed(() => {
  if (!filtro.value) return agendamentos.value
  return agendamentos.value.filter(a => a.status === filtro.value)
})

const total      = computed(() => agendamentos.value.length)
const agendados  = computed(() => agendamentos.value.filter(a => a.status === 'agendado').length)
const confirmados = computed(() => agendamentos.value.filter(a => a.status === 'confirmado').length)
const realizados = computed(() => agendamentos.value.filter(a => a.status === 'realizado').length)
const cancelados = computed(() => agendamentos.value.filter(a => a.status === 'cancelado').length)

async function carregar() {
  carregando.value = true
  try {
    const { data } = await api.get('/agendamentos')
    agendamentos.value = data.agendamentos
  } catch (e) {
    msg('erro', 'Erro ao carregar agendamentos.')
  } finally {
    carregando.value = false
  }
}

async function atualizar(id, status) {
  try {
    await api.patch(`/agendamentos/${id}/status`, { status })
    msg('sucesso', 'Status atualizado com sucesso!')
    carregar()
  } catch (e) {
    msg('erro', 'Erro ao atualizar status.')
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
  border-radius: 6px; cursor: pointer;
}

.nav { display: flex; background: white; border-bottom: 2px solid #e0ede7; }
.nav a {
  padding: .85rem 1.5rem; text-decoration: none;
  color: #4a6357; font-size: .92rem;
  border-bottom: 3px solid transparent; margin-bottom: -2px;
}
.nav a.router-link-active { color: #1a6b4a; border-bottom-color: #1a6b4a; font-weight: 600; }

.pagina { max-width: 900px; margin: 2rem auto; padding: 0 1rem; }

.stats {
  display: grid; grid-template-columns: repeat(5, 1fr);
  gap: 1rem; margin-bottom: 1.5rem;
}
.stat {
  background: white; border-radius: 12px;
  padding: 1.25rem; text-align: center;
  box-shadow: 0 2px 12px rgba(0,0,0,.06);
}
.stat-valor { font-size: 2rem; font-weight: 700; color: #1a6b4a; }
.stat-label { font-size: .8rem; color: #7a9588; margin-top: .25rem; }

.card { background: white; border-radius: 12px; padding: 1.5rem; box-shadow: 0 2px 12px rgba(0,0,0,.06); }
.card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem; }
.card-header h2 { color: #1a6b4a; }
.filtro {
  padding: .5rem .75rem; border: 1.5px solid #d4e6da;
  border-radius: 8px; font-size: .88rem; color: #4a6357; outline: none;
}

.item {
  display: flex; align-items: center;
  padding: 1rem; border: 1px solid #e0ede7;
  border-radius: 10px; margin-bottom: .75rem; gap: 1rem;
}
.item-data {
  width: 52px; height: 56px;
  background: #e8f5ee; border-radius: 8px;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center; flex-shrink: 0;
}
.dia { font-size: 1.4rem; font-weight: 700; color: #1a6b4a; line-height: 1; }
.mes { font-size: .65rem; color: #2d9467; text-transform: uppercase; }
.item-info { flex: 1; }
.medico  { font-weight: 600; font-size: .95rem; }
.espec   { font-size: .82rem; color: #7a9588; margin-top: 2px; }
.paciente { font-size: .82rem; color: #4a6357; margin-top: 2px; }
.horario { font-size: .8rem; color: #4a6357; margin-top: 4px; }
.alerta-chuva { font-size: .78rem; color: #2563eb; margin-top: 3px; }

.item-acoes { display: flex; flex-direction: column; align-items: flex-end; gap: .5rem; }
.status { font-size: .75rem; font-weight: 600; padding: 3px 10px; border-radius: 99px; }
.status-agendado   { background: #eff6ff; color: #2563eb; }
.status-confirmado { background: #e8f5ee; color: #1a6b4a; }
.status-realizado  { background: #f1f5f9; color: #64748b; }
.status-cancelado  { background: #fef2f2; color: #dc2626; }

.botoes { display: flex; gap: .4rem; flex-wrap: wrap; justify-content: flex-end; }
.btn-confirmar { background: #e8f5ee; color: #1a6b4a; border: none; border-radius: 6px; padding: .35rem .85rem; font-size: .82rem; cursor: pointer; }
.btn-concluir  { background: #eff6ff; color: #2563eb; border: none; border-radius: 6px; padding: .35rem .85rem; font-size: .82rem; cursor: pointer; }
.btn-cancelar  { background: #fef2f2; color: #dc2626; border: none; border-radius: 6px; padding: .35rem .85rem; font-size: .82rem; cursor: pointer; }

.vazio { text-align: center; padding: 3rem; color: #94a3b8; }
.vazio-icon { font-size: 2.5rem; margin-bottom: .75rem; }

.erro   { background: #fef2f2; color: #dc2626; padding: .75rem; border-radius: 8px; margin-bottom: 1rem; font-size: .88rem; }
.sucesso { background: #e8f5ee; color: #1a6b4a; padding: .75rem; border-radius: 8px; margin-bottom: 1rem; font-size: .88rem; }
</style>