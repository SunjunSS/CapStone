<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="10" md="8" lg="6">
        <v-card class="elevation-12 pa-8 custom-card" rounded="lg">
          <div class="text-center mb-6">
          
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
import io from 'socket.io-client'
import { socket, connectSocket, emitLogin } from "../socket/socket.js"; // ✅ 소켓 연결 함수 가져오기


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
      passwordRules: [(v) => !!v || '비밀번호를 입력하세요.'],
      socket: null
    }
  },
  created() {
    
    // 소켓 연결
    connectSocket();

    // 로컬 스토리지 초기화
    localStorage.removeItem('chatMessages')
  },
  methods: {
    handleSubmit(e) {
      e.preventDefault()
      this.login()
    },
    login() {
      // 소켓을 사용한 로그인 요청
      emitLogin(this.email, this.password, this.handleLoginSuccess);
    },
    goToRegister() {
      this.$router.push('/register')
    },
    handleLoginSuccess() {
      // 로그인 성공 후 /MyMap으로 이동
      this.$router.push('/MyMap');
    }
  },
  beforeDestroy() {
    // 컴포넌트가 파괴될 때 소켓 연결 해제
    if (this.socket) {
      disconnectSocket();
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
  color: #42A5F5;
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
