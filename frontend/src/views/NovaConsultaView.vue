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
        <h2>Agendar Nova Consulta</h2>

        <div v-if="erro" class="erro">{{ erro }}</div>
        <div v-if="sucesso" class="sucesso">{{ sucesso }}</div>

        <!-- CEP -->
        <div class="campo">
          <label>CEP (para buscar endereço)</label>
          <div class="cep-linha">
            <input v-model="cep" type="text" placeholder="00000-000" @input="mascararCep" />
            <button class="btn-cep" @click="buscarCep" :disabled="cepCarregando">
              {{ cepCarregando ? '...' : '🔍 Buscar' }}
            </button>
          </div>
        </div>

        <div v-if="endereco.rua" class="linha">
          <div class="campo"><label>Rua</label><input :value="endereco.rua" disabled /></div>
          <div class="campo"><label>Bairro</label><input :value="endereco.bairro" disabled /></div>
        </div>
        <div v-if="endereco.cidade" class="linha">
          <div class="campo"><label>Cidade</label><input :value="endereco.cidade" disabled /></div>
          <div class="campo"><label>Estado</label><input :value="endereco.estado" disabled /></div>
        </div>

        <hr class="divisor" />

        <!-- Especialidade e Médico -->
        <div class="linha">
          <div class="campo">
            <label>Especialidade</label>
            <select v-model="form.especialidade" @change="form.medico = ''">
              <option value="">Selecione</option>
              <option v-for="e in especialidades" :key="e">{{ e }}</option>
            </select>
          </div>
          <div class="campo">
            <label>Médico</label>
            <select v-model="form.medico" :disabled="!form.especialidade" @change="carregarHorarios">
              <option value="">Selecione</option>
              <option v-for="m in medicosPorEspec" :key="m">{{ m }}</option>
            </select>
          </div>
        </div>

        <div class="campo">
          <label>Data</label>
          <input v-model="form.data" type="date" :min="hoje" @change="carregarHorarios" />
        </div>

        <!-- Horários -->
        <div v-if="form.medico && form.data" class="campo">
          <label>Horário disponível</label>
          <div v-if="horariosCarregando" style="color:#7a9588;font-size:.88rem">Verificando horários...</div>
          <div v-else class="horarios">
            <div
              v-for="h in todosHorarios" :key="h"
              class="horario"
              :class="{ selecionado: form.horario === h, ocupado: ocupados.includes(h) }"
              @click="!ocupados.includes(h) && (form.horario = h)">
              {{ h }}
            </div>
          </div>
          <div v-if="form.horario" class="horario-selecionado">✓ Horário selecionado: {{ form.horario }}</div>
        </div>

        <!-- Alerta clima -->
        <div v-if="clima" :class="clima.temChuva ? 'alerta-chuva' : 'alerta-sol'">
          {{ clima.alerta }} — {{ clima.temperatura }}°C — {{ clima.descricao }}
        </div>

        <div class="campo" style="margin-top:1rem">
          <label>Observações (opcional)</label>
          <textarea v-model="form.observacoes" rows="3" placeholder="Sintomas, informações relevantes..."></textarea>
        </div>

        <button
          class="btn-verde"
          @click="agendar"
          :disabled="!form.medico || !form.data || !form.horario || carregando">
          {{ carregando ? 'Agendando...' : '✅ Confirmar Agendamento' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import api from '../services/api'

const router = useRouter()
const usuario = ref(JSON.parse(localStorage.getItem('hgc_usuario') || 'null'))

const erro = ref('')
const sucesso = ref('')
const carregando = ref(false)
const cepCarregando = ref(false)
const horariosCarregando = ref(false)
const cep = ref('')
const ocupados = ref([])
const clima = ref(null)
const endereco = reactive({ rua: '', bairro: '', cidade: '', estado: '' })
const form = reactive({ especialidade: '', medico: '', data: '', horario: '', observacoes: '' })
const hoje = new Date().toISOString().split('T')[0]

const todosHorarios = [
  '08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30',
  '14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30'
]

const medicos = {
  'Cardiologia':   ['Dr. Carlos Mendes','Dra. Ana Figueiredo'],
  'Dermatologia':  ['Dra. Luiza Campos','Dr. Rafael Torres'],
  'Ortopedia':     ['Dr. Marcos Vieira','Dra. Beatriz Lima'],
  'Pediatria':     ['Dra. Sandra Rocha','Dr. Felipe Gomes'],
  'Clínica Geral': ['Dr. Eduardo Nunes','Dra. Patricia Alves'],
  'Neurologia':    ['Dr. Antonio Braga'],
  'Ginecologia':   ['Dra. Fernanda Costa','Dra. Juliana Melo'],
}

const especialidades = Object.keys(medicos)
const medicosPorEspec = computed(() => medicos[form.especialidade] || [])

function msg(tipo, texto) {
  if (tipo === 'erro') erro.value = texto
  else sucesso.value = texto
  setTimeout(() => { erro.value = ''; sucesso.value = '' }, 4000)
}

function mascararCep(e) {
  cep.value = e.target.value.replace(/\D/g, '').replace(/^(\d{5})(\d)/, '$1-$2').slice(0, 9)
}

async function buscarCep() {
  const c = cep.value.replace(/\D/g, '')
  if (c.length !== 8) { msg('erro', 'CEP inválido.'); return }
  cepCarregando.value = true
  try {
    const { data } = await api.get(`/cep/${c}`)
    Object.assign(endereco, data)
    msg('sucesso', `Endereço encontrado: ${data.cidade}/${data.estado}`)
  } catch (e) {
    msg('erro', 'CEP não encontrado.')
  } finally {
    cepCarregando.value = false
  }
}

async function carregarHorarios() {
  if (!form.medico || !form.data) return
  form.horario = ''
  clima.value = null
  horariosCarregando.value = true
  try {
    const { data } = await api.get(`/agendamentos/horarios?data=${form.data}&medico=${encodeURIComponent(form.medico)}`)
    ocupados.value = data.ocupados || []
  } catch (e) {
    console.error(e)
  } finally {
    horariosCarregando.value = false
  }

  // Consulta clima se tiver cidade
  if (endereco.cidade) {
    try {
      const { data } = await api.get(`/clima?cidade=${encodeURIComponent(endereco.cidade)}&data=${form.data}`)
      clima.value = data
    } catch (e) {}
  }
}

async function agendar() {
  carregando.value = true
  erro.value = ''
  try {
    const { data } = await api.post('/agendamentos', { ...form, cidade: endereco.cidade })
    msg('sucesso', data.mensagem)
    setTimeout(() => router.push('/agendamentos'), 1500)
  } catch (e) {
    msg('erro', e.response?.data?.erro || 'Erro ao agendar.')
  } finally {
    carregando.value = false
  }
}

function sair() {
  localStorage.removeItem('hgc_token')
  localStorage.removeItem('hgc_usuario')
  router.push('/login')
}
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

.pagina { max-width: 800px; margin: 2rem auto; padding: 0 1rem; }
.card { background: white; border-radius: 12px; padding: 1.5rem; box-shadow: 0 2px 12px rgba(0,0,0,.06); }
.card h2 { color: #1a6b4a; margin-bottom: 1.25rem; }

.campo { margin-bottom: 1rem; }
.campo label { display: block; font-size: .8rem; font-weight: 600; color: #4a6357; margin-bottom: .35rem; text-transform: uppercase; }
.campo input, .campo select, .campo textarea {
  width: 100%; padding: .65rem .9rem;
  border: 1.5px solid #d4e6da; border-radius: 8px;
  font-size: .95rem; outline: none; transition: border-color .2s;
  font-family: inherit;
}
.campo input:focus, .campo select:focus { border-color: #1a6b4a; }
.campo input:disabled { background: #f8faf9; color: #7a9588; }
.linha { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }

.cep-linha { display: grid; grid-template-columns: 1fr auto; gap: .75rem; }
.btn-cep {
  height: 40px; background: #e8f5ee; color: #1a6b4a;
  border: 1.5px solid #b8deca; border-radius: 8px;
  padding: 0 1rem; cursor: pointer; white-space: nowrap;
}

.divisor { border: none; border-top: 1px solid #e0ede7; margin: 1.25rem 0; }

.horarios { display: grid; grid-template-columns: repeat(4, 1fr); gap: .5rem; margin-top: .5rem; }
.horario {
  padding: .5rem; text-align: center;
  border: 1.5px solid #d4e6da; border-radius: 8px;
  cursor: pointer; font-size: .85rem; transition: all .2s;
}
.horario:hover:not(.ocupado) { border-color: #1a6b4a; color: #1a6b4a; }
.horario.selecionado { background: #1a6b4a; color: white; border-color: #1a6b4a; }
.horario.ocupado { background: #f1f5f9; color: #94a3b8; cursor: not-allowed; text-decoration: line-through; }
.horario-selecionado { font-size: .83rem; color: #1a6b4a; margin-top: .5rem; }

.alerta-chuva { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: .85rem; margin-top: .75rem; font-size: .88rem; color: #1d4ed8; }
.alerta-sol   { background: #e8f5ee; border: 1px solid #b8deca; border-radius: 8px; padding: .85rem; margin-top: .75rem; font-size: .88rem; color: #1a6b4a; }

.btn-verde {
  width: 100%; padding: .8rem;
  background: #1a6b4a; color: white;
  border: none; border-radius: 8px;
  font-size: 1rem; font-weight: 500;
  cursor: pointer; margin-top: 1rem;
}
.btn-verde:hover { background: #2d9467; }
.btn-verde:disabled { opacity: .6; cursor: not-allowed; }

.erro   { background: #fef2f2; color: #dc2626; padding: .75rem; border-radius: 8px; margin-bottom: 1rem; font-size: .88rem; }
.sucesso { background: #e8f5ee; color: #1a6b4a; padding: .75rem; border-radius: 8px; margin-bottom: 1rem; font-size: .88rem; }
</style>