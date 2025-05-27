--Register.vue--

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
              :rules="[(v) => !!v || '닉네임을 입력하세요.']"
              label="닉네임"
              prepend-icon="mdi-account"
              required
              outlined
              dense
            ></v-text-field>

            <!-- 이메일 입력 필드 + 인증 버튼 한 줄로 정렬 -->
            <v-row dense class="align-center mb-2">
              <!-- 이메일 입력 필드: 유연하게 늘어나게 -->
              <v-col cols="auto" class="flex-grow-1">
                <v-text-field
                  v-model="email"
                  :rules="[
                    (v) => !!v || '이메일을 입력하세요.',
                    (v) =>
                      /.+@(gmail\.com|naver\.com)$/.test(v) ||
                      'gmail 또는 naver 이메일만 가능합니다.',
                  ]"
                  label="이메일 (gmail.com 또는 naver.com)"
                  prepend-icon="mdi-email"
                  outlined
                  dense
                />
              </v-col>

              <!-- 버튼: 고정된 너비로, 오른쪽 정렬 -->
              <v-col cols="auto" class="d-flex justify-end">
                <v-btn
                  color="#1E88E5"
                  class="email-verify-btn"
                  @click="sendVerificationCode"
                >
                  인증 코드
                </v-btn>
              </v-col>
            </v-row>

            <!-- 인증 코드 입력 필드 (버튼 클릭 시 표시) -->
            <v-text-field
              v-if="showVerificationField"
              v-model="verificationCode"
              label="인증 코드 입력"
              prepend-icon="mdi-shield-key-outline"
              required
              outlined
              dense
            ></v-text-field>

            <v-text-field
              v-model="password"
              :rules="[(v) => !!v || '비밀번호를 입력하세요.']"
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

    <v-snackbar
      v-model="snackbar"
      :timeout="3000"
      :color="snackbarColor"
      rounded="pill"
      location="top"
    >
      <div class="snackbar-text">
        {{ snackbarText }}
      </div>
      <template v-slot:action="{ attrs }">
        <v-btn color="white" text v-bind="attrs" @click="snackbar = false">
          닫기
        </v-btn>
      </template>
    </v-snackbar>

    <!-- 처리 중 UI 오버레이 -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>처리 중...</p>
    </div>
  </v-container>
</template>

<script>
// Register.vue의 script 부분
import axios from "axios";
import { useRouter } from "vue-router";

export default {
  data() {
    return {
      name: "",
      email: "",
      password: "",
      snackbar: false,
      snackbarText: "",
      snackbarColor: "info", // Default color
      valid: false,

      // 인증 코드 관련
      showVerificationField: false, // 인증 입력창 표시 여부
      verificationCode: "", // 사용자가 입력할 인증 코드
      isLoading: false, // 로딩 표시 여부

      // 누락된 상태 변수들 추가
      emailVerified: false, // 이메일 인증 완료 여부
      verifyingCode: false, // 인증 코드 검증 중 여부
      registering: false, // 회원가입 처리 중 여부
    };
  },
  methods: {
    async register() {
      // 인증 코드가 입력되어 있지만 검증은 안된 상태
      if (
        this.showVerificationField &&
        this.verificationCode &&
        !this.emailVerified
      ) {
        // 먼저 인증 코드 검증 진행
        await this.verifyCode();

        // 인증에 실패했다면 회원가입 진행하지 않음
        if (!this.emailVerified) {
          return;
        }
      } else if (this.showVerificationField && !this.verificationCode) {
        // 인증 코드가 보여지지만 입력되지 않은 경우
        this.snackbarColor = "error";
        this.snackbarText = "인증 코드를 입력해주세요.";
        this.snackbar = true;
        return;
      } else if (!this.showVerificationField) {
        // 인증 코드 요청 자체를 하지 않은 경우
        this.snackbarColor = "error";
        this.snackbarText =
          "이메일 인증이 필요합니다. 인증 코드 버튼을 클릭해주세요.";
        this.snackbar = true;
        return;
      }

      this.isLoading = true; // 회원가입 시작할 때 로딩 UI 표시
      this.registering = true;
      try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
        const response = await axios.post(`${API_BASE_URL}/api/user/register`, {
          name: this.name,
          email: this.email,
          password: this.password,
        });

        this.snackbarColor = "info";
        this.snackbarText =
          response.data.message || "회원가입이 완료되었습니다!";
        this.snackbar = true;

        // 회원가입 성공 후 로그인 페이지로 이동
        setTimeout(() => {
          this.$router.push("/Login");
        }, 1500);
      } catch (error) {
        console.error("서버 응답 오류:", error.response);

        this.snackbarColor = "error";
        this.snackbarText =
          error.response?.data.message || "회원가입 중 오류가 발생했습니다.";
        this.snackbar = true;
      } finally {
        this.registering = false;
        this.isLoading = false; // 회원가입 완료 후 로딩 UI 숨김
      }
    },

    goToLogin() {
      this.$router.push("/Login");
    },

    // 인증 코드 발송 API 호출
    async sendVerificationCode() {
      if (!this.email || !/.+@(gmail\.com|naver\.com)$/.test(this.email)) {
        this.snackbarColor = "error";
        this.snackbarText = "올바른 이메일을 먼저 입력해주세요.";
        this.snackbar = true;
        return;
      }

      this.isLoading = true; // 로딩 시작
      try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
        const response = await axios.post(
          `${API_BASE_URL}/api/mail/send-code`,
          {
            email: this.email,
          }
        );

        this.showVerificationField = true;
        this.snackbarColor = "info";
        this.snackbarText =
          response.data.message || "인증 코드가 이메일로 전송되었습니다.";
        this.snackbar = true;
      } catch (error) {
        console.error("인증 코드 전송 오류:", error.response);
        this.snackbarColor = "error";
        this.snackbarText =
          error.response?.data.message ||
          "인증 코드 전송 중 오류가 발생했습니다.";
        this.snackbar = true;
      } finally {
        this.isLoading = false; // 로딩 종료
      }
    },

    // 인증 코드 확인 API 호출
    async verifyCode() {
      if (!this.verificationCode) {
        this.snackbarColor = "error";
        this.snackbarText = "인증 코드를 입력해주세요.";
        this.snackbar = true;
        return;
      }

      this.isLoading = true; // 인증 코드 확인 시작할 때 로딩 UI 표시
      this.verifyingCode = true;
      try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
        const response = await axios.post(
          `${API_BASE_URL}/api/mail/verify-code`,
          {
            email: this.email,
            code: this.verificationCode,
          }
        );

        this.emailVerified = true;
        this.snackbarColor = "info";
        this.snackbarText =
          response.data.message || "이메일 인증이 완료되었습니다.";
        this.snackbar = true;
      } catch (error) {
        console.error("인증 코드 확인 오류:", error.response);
        this.snackbarColor = "error";
        this.snackbarText =
          error.response?.data.message || "인증 코드가 올바르지 않습니다.";
        this.snackbar = true;
      } finally {
        this.verifyingCode = false;
        this.isLoading = false; // 인증 코드 확인 완료 후 로딩 UI 숨김
      }
    },
  },
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
  color: #42a5f5; /* 파란색으로 변경 */
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

.email-verify-btn {
  height: 57px; /* dense v-text-field와 맞춤 */
  min-height: 40px;
  font-size: 14px;
  margin-bottom: 20px; /* 버튼 하단 약간 보정 */
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 5px solid #f3f3f3;
  border-top: 5px solid #42a5f5;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 10px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
