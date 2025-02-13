<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="10" md="8" lg="6">
        <v-card class="elevation-12 pa-8 custom-card" rounded="lg">
          <div class="text-center mb-6">
            <v-img :src="headerImage2" alt="Header Image" height="45" contain class="mb-4"></v-img>
            <h1 class="welcome-text">환영합니다!</h1>
          </div>

          <v-form ref="form" v-model="valid" @submit="handleSubmit">
            <v-text-field
              v-model="email"
              :rules="emailRules"
              label="이메일"
              prepend-icon="mdi-email"
              required
              outlined
              dense
            ></v-text-field>

            <v-text-field
              v-model="password"
              :rules="passwordRules"
              label="비밀번호"
              prepend-icon="mdi-lock"
              type="password"
              required
              outlined
              dense
            ></v-text-field>

            <div class="text-center">
              <v-btn
                :disabled="!valid"
                color="primary"
                type="submit"
                x-large
                class="mt-6 custom-btn"
                elevation="2"
                @click="login"
              >
                로그인
              </v-btn>
            </div>
          </v-form>

          <div class="text-center mt-6">
            <v-btn text color="secondary" class="custom-btn" @click="goToRegister">
              회원가입
            </v-btn>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <v-snackbar v-model="snackbar" :timeout="3000" color="info" rounded="pill">
      <span class="snackbar-text">{{ snackbarText }}</span>
      <template v-slot:action="{ attrs }">
        <v-btn color="white" text v-bind="attrs" @click="snackbar = false"> 닫기 </v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script>

import axios from 'axios'


export default {
  data() {
    return {
      email: '',
      password: '',
      valid: false,
      snackbar: false,
      snackbarText: '',
      emailRules: [
        (v) => !!v || '이메일을 입력하세요.',
        (v) => /.+@.+\..+/.test(v) || '유효한 이메일을 입력하세요.'
      ],
      passwordRules: [(v) => !!v || '비밀번호를 입력하세요.']
    }
  },
  created() {
    // 로컬 스토리지 초기화
    localStorage.removeItem('chatMessages')
  },
  methods: {
    handleSubmit(e) {
      e.preventDefault()
      this.login()
    },
    async login() {
      try {
        // 로그인 요청
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL; // ✅ 환경변수 사용
        const response = await axios.post(`http://${API_BASE_URL}/api/login`, {
          email: this.email,
          password: this.password
        })

        if (response.data.message === '로그인 성공!') {
          this.snackbarText = '로그인 성공!'
          this.snackbar = true

          // 상태 업데이트 요청은 더 이상 필요하지 않음 (서버에서 자동으로 처리)

          // 0.7초 후 홈으로 이동
          setTimeout(() => {
            router.push('/')
          }, 700)
        } else {
          this.snackbarText = response.data.message
          this.snackbar = true
        }
      } catch (error) {
        this.snackbarText = error.response?.data.message || '로그인 실패'
        this.snackbar = true
      }
    },
    goToRegister() {
      router.push('/register')
    }
  }
}
</script>

<style scoped>
.v-card {
  background: linear-gradient(135deg, #fffdfd 0%, #f7f2f2 100%);
}

.custom-card {
  max-width: 600px;
  width: 100%;
  margin: 0 auto;
}

.custom-btn {
  min-width: 200px !important;
  width: auto !important;
}

.welcome-text {
  color: #ff8c42;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
}

.v-btn {
  text-transform: none;
  font-weight: bold;
}

.v-text-field :deep(.v-input__slot) {
  background-color: rgba(255, 255, 255, 0.8) !important;
}

.snackbar-text {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  text-align: center;
}
</style>