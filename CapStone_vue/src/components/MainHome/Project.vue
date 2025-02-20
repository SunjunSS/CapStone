<template>
  <v-container class="d-flex justify-center align-center" style="min-height: 100vh;">
    <v-card class="pa-4" max-width="500px">
      <v-card-title class="headline">프로젝트 생성</v-card-title>
      <v-card-text>
        <v-text-field v-model="projectName" label="프로젝트 이름" required></v-text-field>
        <v-textarea v-model="projectDescription" label="프로젝트 설명" required></v-textarea>
        <v-text-field
          v-model="projectTopic"
          :items="topics"
          label="프로젝트 주제"
          required
        ></v-text-field>
      </v-card-text>
      <v-card-actions class="justify-end">
        <v-btn color="red" text @click="reset">취소</v-btn>
        <v-btn color="blue" text @click="createProject">생성</v-btn>
      </v-card-actions>
    </v-card>
  </v-container>
</template>

<script>
import { getCurrentUser } from '../socket/socket';
import axios from 'axios';

export default {
  name: "ProjectCreation",
  data() {
    return {
      projectName: "",
      projectDescription: "",
      projectTopic: "",
      topics: "",  // 예시 주제
      currentUser: null,
    };
  },
  mounted() {
    this.loadCurrentUser();
  },
  methods: {

    loadCurrentUser() {
      this.currentUser = getCurrentUser(); // 로그인된 유저 정보를 받아옴
      if (this.currentUser) {
        console.log("현재 로그인된 유저:", this.currentUser);
      } else {
        console.log("로그인된 유저가 없습니다.");
      }
    },
    reset() {
      this.projectName = "";
      this.projectDescription = "";
      this.projectTopic = "";
      this.$router.push('/MyMap');
    },
    async createProject() {
      console.log("팀 생성:", this.projectName, this.projectDescription, this.projectTopic);

      try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
        const response = await axios.post(`${API_BASE_URL}/api/project`, {
          user_id: this.currentUser.user_id, // 실제 로그인된 사용자의 ID로 변경 필요
          name: this.projectName,
          description: this.projectDescription,
          topic: this.projectTopic,
        });

        alert(`프로젝트 생성 완료: ${response.data.project.name}`);
        this.$router.push('/MyMap');

      } catch (error) {
        console.error("프로젝트 생성 실패:", error);
        alert("프로젝트 생성에 실패했습니다.");
      }

    },
  },
};
</script>

<style scoped>
.v-container {
  min-height: 100vh;
}
.v-card {
  max-width: 500px;
  margin: 0 auto;
}
</style>
