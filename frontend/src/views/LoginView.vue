<template>
  <div class="login-wrap">
    <div class="login-box">

      <div class="logo">
        <span class="logo-icon">🏥</span>
        <h1>HGC</h1>
        <p>Sistema de Agendamentos</p>
      </div>

      <!-- Abas -->
      <div class="abas">
        <button :class="{ ativa: aba === 'login' }" @click="aba = 'login'">Entrar</button>
        <button :class="{ ativa: aba === 'cadastro' }" @click="aba = 'cadastro'">Cadastrar</button>
      </div>

      <div v-if="erro" class="erro">{{ erro }}</div>
      <div v-if="sucesso" class="sucesso">{{ sucesso }}</div>

      <!-- LOGIN -->
      <form v-if="aba === 'login'" @submit.prevent="fazerLogin">
        <div class="campo">
          <label>Email</label>
          <input v-model="loginForm.email" type="email" placeholder="seu@email.com" required />
        </div>
        <div class="campo">
          <label>Senha</label>
          <input v-model="loginForm.senha" type="password" placeholder="••••••" required />
        </div>
        <button type="submit" class="btn-verde" :disabled="carregando">
          {{ carregando ? 'Entrando...' : 'Entrar' }}
        </button>
        <p class="dica">Teste: <b>joao@email.com</b> / <b>123456</b></p>
      </form>

      <!-- CADASTRO -->
      <form v-if="aba === 'cadastro'" @submit.prevent="fazerCadastro">
        <div class="campo">
          <label>Nome completo</label>
          <input v-model="cadForm.nome" type="text" placeholder="João da Silva" required />
        </div>
        <div class="linha">
          <div class="campo">
            <label>Email</label>
            <input v-model="cadForm.email" type="email" placeholder="seu@email.com" required />
          </div>
          <div class="campo">
            <label>Telefone</label>
            <input v-model="cadForm.telefone" type="tel" placeholder="(11) 99999-9999" />
          </div>
        </div>
        <div class="linha">
          <div class="campo">
            <label>CPF</label>
            <input v-model="cadForm.cpf" type="text" placeholder="000.000.000-00" />
          </div>
          <div class="campo">
            <label>Perfil</label>
            <select v-model="cadForm.perfil">
              <option value="paciente">Paciente</option>
              <option value="secretario">Secretário(a)</option>
            </select>
          </div>
        </div>
        <div class="campo">
          <label>Senha</label>
          <input v-model="cadForm.senha" type="password" placeholder="Mínimo 6 caracteres" required />
        </div>
        <button type="submit" class="btn-verde" :disabled="carregando">
          {{ carregando ? 'Cadastrando...' : 'Criar conta' }}
        </button>
      </form>

    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import api from '../services/api'

const router = useRouter()
const aba = ref('login')
const erro = ref('')
const sucesso = ref('')
const carregando = ref(false)

const loginForm = reactive({ email: '', senha: '' })
const cadForm = reactive({ nome: '', email: '', senha: '', telefone: '', cpf: '', perfil: 'paciente' })

function msg(tipo, texto) {
  if (tipo === 'erro') erro.value = texto
  else sucesso.value = texto
  setTimeout(() => { erro.value = ''; sucesso.value = '' }, 4000)
}

async function fazerLogin() {
  carregando.value = true
  erro.value = ''
  try {
    const { data } = await api.post('/auth/login', loginForm)
    localStorage.setItem('hgc_token', data.token)
    localStorage.setItem('hgc_usuario', JSON.stringify(data.usuario))
    router.push('/agendamentos')
  } catch (e) {
    msg('erro', e.response?.data?.erro || 'Erro ao conectar ao servidor.')
  } finally {
    carregando.value = false
  }
}

async function fazerCadastro() {
  carregando.value = true
  erro.value = ''
  try {
    const { data } = await api.post('/auth/register', cadForm)
    localStorage.setItem('hgc_token', data.token)
    localStorage.setItem('hgc_usuario', JSON.stringify(data.usuario))
    router.push('/agendamentos')
  } catch (e) {
    msg('erro', e.response?.data?.erro || 'Erro ao conectar ao servidor.')
  } finally {
    carregando.value = false
  }
}
</script>

<style scoped>
.login-wrap {
  min-height: 100vh;
  background: #f0f7f4;
  display: flex;
  align-items: center;
  justify-content: center;
}
.login-box {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  width: 100%;
  max-width: 440px;
  box-shadow: 0 4px 24px rgba(0,0,0,.08);
}
.logo { text-align: center; margin-bottom: 1.5rem; }
.logo-icon { font-size: 2.5rem; }
.logo h1 { color: #1a6b4a; font-size: 2rem; margin-top: .25rem; }
.logo p  { color: #7a9588; font-size: .9rem; }

.abas { display: flex; background: #e8f5ee; border-radius: 10px; padding: 4px; margin-bottom: 1.5rem; }
.abas button {
  flex: 1; padding: .6rem; border: none;
  background: none; border-radius: 8px;
  font-size: .92rem; color: #4a6357; cursor: pointer;
  transition: all .2s;
}
.abas button.ativa {
  background: white; color: #1a6b4a;
  font-weight: 600; box-shadow: 0 2px 6px rgba(0,0,0,.08);
}

.campo { margin-bottom: 1rem; }
.campo label { display: block; font-size: .8rem; font-weight: 600; color: #4a6357; margin-bottom: .35rem; text-transform: uppercase; }
.campo input, .campo select {
  width: 100%; padding: .65rem .9rem;
  border: 1.5px solid #d4e6da; border-radius: 8px;
  font-size: .95rem; outline: none; transition: border-color .2s;
}
.campo input:focus, .campo select:focus { border-color: #1a6b4a; }
.linha { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }

.btn-verde {
  width: 100%; padding: .8rem;
  background: #1a6b4a; color: white;
  border: none; border-radius: 8px;
  font-size: 1rem; font-weight: 500;
  cursor: pointer; transition: background .2s;
}
.btn-verde:hover { background: #2d9467; }
.btn-verde:disabled { opacity: .6; cursor: not-allowed; }

.dica { text-align: center; margin-top: .75rem; font-size: .82rem; color: #7a9588; }
.dica b { color: #1a6b4a; }

.erro   { background: #fef2f2; color: #dc2626; padding: .75rem; border-radius: 8px; margin-bottom: 1rem; font-size: .88rem; }
.sucesso { background: #e8f5ee; color: #1a6b4a; padding: .75rem; border-radius: 8px; margin-bottom: 1rem; font-size: .88rem; }
</style>