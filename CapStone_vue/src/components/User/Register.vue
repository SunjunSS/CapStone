<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="10" md="8" lg="6">
        <v-card class="elevation-12 pa-8 custom-card" rounded="lg">
          <div class="text-center mb-6">
            
            <h1 class="welcome-text">회원가입</h1>
          </div>

          <v-form ref="form" v-model="valid" @submit.prevent="register">
            <v-text-field
              v-model="name"
              :rules="[v => !!v || '닉네임을 입력하세요.']"
              label="닉네임"
              prepend-icon="mdi-account"
              required
              outlined
              dense
            ></v-text-field>

            <v-text-field
              v-model="email"
              :rules="[v => !!v || '이메일을 입력하세요.', v => /.+@.+\..+/.test(v) || '유효한 이메일을 입력하세요.']"
              label="이메일"
              prepend-icon="mdi-email"
              required
              outlined
              dense
            ></v-text-field>

            <v-text-field
              v-model="user_password"
              :rules="[v => !!v || '비밀번호를 입력하세요.']"
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
                @click="register"
              >
                회원가입
              </v-btn>
            </div>
          </v-form>

          <div class="text-center mt-6">
            <v-btn text color="secondary" class="custom-btn" @click="goToLogin">
              이미 계정이 있으신가요? 로그인
            </v-btn>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <v-snackbar v-model="snackbar" :timeout="3000" color="info" rounded="pill">
      <div class="snackbar-text">
        {{ snackbarText }}
      </div>
      <template v-slot:action="{ attrs }">
        <v-btn color="white" text v-bind="attrs" @click="snackbar = false">
          닫기
        </v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script>
import axios from 'axios';
import { useRouter } from 'vue-router';

export default {
  data() {
    return {
      name: '',
      email: '',
      user_password: '',
      snackbar: false,
      snackbarText: '',
      valid: false,
    };
  },
  methods: {
    async register() {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
        const response = await axios.post(`http://${API_BASE_URL}/api/user/register`, {
          name: this.name,
          email: this.email,
          user_password: this.user_password,
        });
        this.snackbarText = response.data.message;


        // 회원가입 성공 시 로그인 화면으로 이동
        setTimeout(() => {
          this.$router.push('/Login');
        }, 700); // 700ms 후 이동
        
      } catch (error) {
        this.snackbarText = error.response?.data.message || '오류가 발생했습니다.';
      }
      this.snackbar = true;
    },
    goToLogin() {
      this.$router.push('/Login');
    }
  }
};
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
  color: #42A5F5; /* 파란색으로 변경 */
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
  align-items: center;
  justify-content: center;
  width: 100%;
  text-align: center;
}
</style>
