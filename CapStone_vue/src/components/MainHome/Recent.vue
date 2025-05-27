<template>
  <div class="recent-container">
    <!-- 사이드바 -->
    <MainHomeSideBar />

    <!-- 콘텐츠 영역 -->
    <main class="content slide-up-animation">
      <header
        class="content-header slide-up-animation"
        style="animation-delay: 0.1s"
      >
        <h2>내 지도</h2>
      </header>

      <section
        class="map-list slide-up-animation"
        style="animation-delay: 0.2s"
      >
        <!-- mapItems가 있을 때 테이블 표시 -->
        <div v-if="mapItems.length > 0">
          <div class="map-list-header">
            <h3>지도 탐색</h3>
            <span v-if="selectedItemsCount > 0" class="selected-count">
              {{ selectedItemsCount }}개 선택됨
            </span>
          </div>
          <table>
            <thead>
              <tr>
                <th class="name-column">이름</th>
                <th class="creator-column">만든 사람</th>
                <th class="date-column">수정</th>
                <th class="action-column"></th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(item, index) in mapItems"
                :key="index"
                :class="{ 'selected-row': item.selected }"
              >
                <td class="name-column">
                  <div
                    class="hover-checkbox"
                    :class="{ 'show-checkbox': hasSelectedItems }"
                  >
                    <input
                      type="checkbox"
                      v-model="item.selected"
                      @change="handleCheckboxChange"
                    />
                  </div>
                  <span class="map-icon">🌟</span>
                  <span
                    @click="openMindMap(item.project_id)"
                    style="cursor: pointer"
                    >{{ item.name }}</span
                  >
                </td>
                <td class="creator-column">{{ item.creator }}</td>
                <td class="date-column">{{ item.date }}</td>
                <td class="action-column">
                  <button class="menu-button" @click="showMenu(index, $event)">
                    ⋯
                  </button>
                  <teleport to="body">
                    <div
                      v-if="item.showMenu"
                      class="menu-dropdown"
                      :style="getDropdownPosition(index)"
                    >
                      <ul>
                        <li @click="openMindMap(item.project_id)">🗝️ 열기</li>
                        <li @click="moveToFavorite(index)">📌 즐겨찾기</li>
                        <li
                          @click="moveToTrash(item.project_id, index)"
                          class="delete-option"
                        >
                          🗑️ 휴지통으로 이동
                        </li>
                      </ul>
                    </div>
                  </teleport>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- mapItems가 비어있을 때 빈 상태 UI 표시 -->
        <div v-else class="empty-recent-container">
          <div class="empty-recent-icon">
            <svg
              width="80"
              height="80"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                stroke="#9AA0A6"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>
          <h3 class="empty-recent-title">최근 지도가 여기에 표시됩니다.</h3>
          <p class="empty-recent-description">
            최근 지도에 쉽게 액세스하여<br />
            중단한 부분부터 빠르게 시작하세요.
          </p>
        </div>
      </section>
    </main>
  </div>
</template>

<script>
import { ref, onMounted, onBeforeUnmount } from "vue";
import MainHomeSideBar from "./MainHomeSideBar.vue";
import { getCurrentUser, getProject, connectSocket } from "../socket/socket";
import {
  createProject,
  getUserProjects,
  softDeleteProject,
  updateProjectBookmark,
} from "../../api/projectApi";
import { useRouter } from "vue-router";

export default {
  name: "Recent",
  components: {
    MainHomeSideBar,
  },
  data() {
    return {
      // mapItems: [],
      isProjectDialogOpen: false,
      teamName: "",
      teamDescription: "",
      teamTopic: "",
      topics: [], // 예시 주제
      currentUser: null,
      email: null,
    };
  },
  computed: {
    hasSelectedItems() {
      return this.mapItems.some((item) => item.selected);
    },
    selectedItemsCount() {
      return this.mapItems.filter((item) => item.selected).length;
    },
  },
  watch: {
    currentUser: {
      handler(newUser) {
        console.log("실행됨 --- 유저");
        if (newUser && newUser.email) {
          console.log(`프로젝트 요청 실행 --`);
          this.loadProjects();
        }
      },
      deep: true,
    },
  },
  methods: {
    handleLogout() {
      emitLogout(() => {
        console.log("✔️ 로그아웃 후 UI 업데이트");

        this.currentUser = null; // 로그인한 사용자 정보 초기화
        this.email = null; // 이메일 초기화
        this.mapItems = []; // 지도 아이템 목록 초기화

        this.$router.push("/"); // 홈 화면으로 이동
      });
    },

    loadProjects() {
      if (this.currentUser) {
        getProject(this.currentUser.email, (projects) => {
          console.log(`프로젝트 내부`);
          this.mapItems = projects.map((project) => ({
            project_id: project.project_id,
            name: project.name,
            description: project.description,
            topic: project.topic,
            tema_id: project.team_id,
            selected: false,
            showMenu: false,
          }));
          console.log(`프로젝트 개수: ${this.mapItems.length}`);
        });
      }
    },

    loadCurrentUser() {
      this.currentUser = getCurrentUser(); // 로그인된 유저 정보를 받아옴
      if (this.currentUser) {
        this.email = this.currentUser.email;
        console.log("현재 로그인된 유저:", this.email);
      } else {
        console.log("로그인된 유저가 없습니다.");
      }
    },

    openProjectDialog() {
      this.$router.push("/Project");
    },
    close() {
      this.isProjectDialogOpen = false;
    },

    handleCheckboxChange() {
      // 체크박스 변경 핸들러 (기존과 동일)
    },
    showMenu(index, event) {
      // 다른 메뉴 모두 닫기
      this.mapItems.forEach((item, i) => {
        if (i !== index) {
          item.showMenu = false;
          item.selected = false; // 다른 항목들의 체크박스 해제
        }
      });

      // 현재 항목만 체크박스 선택
      this.mapItems[index].selected = true;

      // 선택한 메뉴 토글
      this.mapItems[index].showMenu = !this.mapItems[index].showMenu;
      event.stopPropagation(); // 이벤트 버블링 방지
    },
    closeAllMenus() {
      this.mapItems.forEach((item) => {
        item.showMenu = false;
      });
    },
    openMindMap(projectId) {
      console.log("🔗 MindMap으로 이동:", projectId);
      this.$router.push(`/MindMap/${projectId}`);
      this.closeAllMenus();
    },
    moveToFavorite(index) {
      const item = this.mapItems[index];
      const userId = sessionStorage.getItem("userId");

      if (!userId) {
        alert("로그인이 필요합니다.");
        return;
      }

      updateProjectBookmark(userId, item.project_id, 1)
        .then(() => {
          alert(`📌 ${item.name}을(를) 즐겨찾기에 추가했습니다.`);
          this.closeAllMenus();
        })
        .catch((error) => {
          console.error("❌ 즐겨찾기 추가 실패:", error);
          alert("즐겨찾기 추가 중 오류가 발생했습니다.");
        });
    },
    moveToTrash(projectId, index) {
      // 휴지통으로 이동 기능 구현
      if (
        confirm(
          `${this.mapItems[index].name}을(를) 휴지통으로 이동하시겠습니까?`
        )
      ) {
        this.closeAllMenus();
        softDeleteProject(projectId)
          .then(() => {
            console.log(
              `🗑️ 프로젝트(${projectId})가 휴지통으로 이동되었습니다.`
            );
            this.mapItems.splice(index, 1);
          })
          .catch((error) => {
            console.error("❌ 프로젝트 휴지통 이동 중 오류:", error);
            alert("프로젝트를 휴지통으로 이동하는 중 오류가 발생했습니다.");
          });
      }
    },
  },
  setup() {
    const router = useRouter(); // Vue Router 인스턴스 가져오기
    const mapItems = ref([]); // 프로젝트 목록을 ref로 선언

    // 세션에서 userId 가져오기
    const userId = sessionStorage.getItem("userId");

    // 서버에서 프로젝트 목록 불러오기
    const loadProjects = async () => {
      try {
        if (!userId) {
          console.error("❌ 사용자 ID가 없습니다.");
          return;
        }

        const projects = await getUserProjects(userId);

        mapItems.value = projects.map((p) => ({
          project_id: p.project_id,
          name: p.name,
          creator: p.creator, // 서버에서 만든 사람 정보
          date: p.date, // 서버에서 수정 날짜 정보
          selected: false,
          showMenu: false,
        }));

        console.log("🟢 프로젝트 불러오기 성공:", mapItems.value);
      } catch (error) {
        console.error("❌ 프로젝트 목록 불러오기 오류:", error);
      }
    };

    // 휠 이벤트 처리를 위한 변수
    let isScrolling = false;
    let scrollTimeout;

    // 휠 이벤트 핸들러
    const handleWheel = (event) => {
      // 이미 스크롤 중이면 추가 이벤트 무시
      if (isScrolling) return;

      // 아래로 스크롤하는 경우 (deltaY가 양수)
      if (event.deltaY > 50) {
        isScrolling = true;

        // 연속된 스크롤 이벤트 방지를 위한 디바운싱
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          console.log("아래로 스크롤 감지, Favorite 페이지로 이동합니다");
          router.push("/Favorite");

          // 스크롤 상태 초기화 (다음 페이지에서 정상 작동하도록)
          setTimeout(() => {
            isScrolling = false;
          }, 500);
        }, 300);
      }
      // 위로 스크롤하는 경우 (deltaY가 음수)
      else if (event.deltaY < -50) {
        isScrolling = true;

        // 연속된 스크롤 이벤트 방지를 위한 디바운싱
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          console.log("위로 스크롤 감지, MyMap 페이지로 이동합니다");
          router.push("/MyMap");

          // 스크롤 상태 초기화 (다음 페이지에서 정상 작동하도록)
          setTimeout(() => {
            isScrolling = false;
          }, 500);
        }, 300);
      }
    };

    // Add this method to the setup function in Recent.vue
    const getDropdownPosition = (index) => {
      const button = document.querySelectorAll(".menu-button")[index];
      if (!button) return {};
      const rect = button.getBoundingClientRect();
      return {
        position: "fixed",
        top: `${rect.bottom}px`,
        left: `${rect.left - 140}px`,
      };
    };

    onMounted(() => {
      connectSocket(() => {
        loadProjects();
      });

      // 휠 이벤트 리스너 등록
      window.addEventListener("wheel", handleWheel, { passive: false });
    });

    onBeforeUnmount(() => {
      // 컴포넌트 언마운트 시 이벤트 리스너 제거 및 타이머 정리
      window.removeEventListener("wheel", handleWheel);
      clearTimeout(scrollTimeout);
    });

    return {
      mapItems,
      getDropdownPosition,
    };
  },
  mounted() {
    // 페이지 로드 시 소켓 연결 및 사용자 정보 복구
    connectSocket(() => {
      this.loadCurrentUser();
    });

    // 메뉴 외부 클릭 시 메뉴 닫기
    document.addEventListener("click", this.closeAllMenus);
  },
  beforeDestroy() {
    document.removeEventListener("click", this.closeAllMenus);
  },
};
</script>

<style scoped>
/* 기존 스타일 유지 */
.map-icon {
  margin-right: 5px;
}

/* 나머지 스타일은 동일하게 유지 */
.selected-row {
  background-color: #e3f2fd;
}

.recent-container {
  display: flex;
  min-height: 100vh;
}

.content {
  flex: 1;
  padding-top: 20px;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding-top: 30px;
  padding-bottom: 20px;
  border-radius: 8px;
}

.map-list {
  background: white;
  padding: 15px;
  margin-bottom: 40px;
  border-radius: 8px;
  min-height: 70vh; /* 뷰포트 높이의 70%를 최소 높이로 설정 */
  display: flex; /* 내부 콘텐츠를 유연하게 배치 */
  flex-direction: column; /* 세로 방향으로 배치 */
}

.map-list table {
  margin-top: 30px;
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.map-list-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.selected-count {
  font-size: 14px;
  color: #666;
  font-weight: normal;
}

.map-list th,
.map-list td {
  padding: 10px;
  border-bottom: 1px solid #ddd;
}

.map-list th {
  font-weight: bold;
  background: #f5f5f5;
}

/* 기존 레이아웃 유지를 위한 컬럼 스타일 설정 */
.name-column {
  width: 50%;
  text-align: left;
  position: relative;
}

.creator-column {
  text-align: center;
  width: 20%;
}

.date-column {
  text-align: center;
  width: 20%;
}

.action-column {
  width: 10%;
  padding-right: 20px;
  text-align: right;
  position: relative;
}

/* 메뉴 버튼 스타일 */
.menu-button {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 20px;
  color: #555;
  padding: 5px;
  line-height: 1;
  vertical-align: middle;
  transition: all 0.2s;
}

.menu-button:hover {
  color: #1976d2;
}

.menu-dropdown {
  position: absolute;
  right: 0px;
  top: 100%;
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  z-index: 100;
  width: 180px;
}

.menu-dropdown ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.menu-dropdown li {
  padding: 10px 15px;
  cursor: pointer;
  transition: background 0.2s;
  text-align: left;
}

.menu-dropdown li:hover {
  background: #f5f5f5;
}

.menu-dropdown li.delete-option {
  color: #e53935;
}

.menu-dropdown li.delete-option:hover {
  background: #ffebee;
}

.hover-checkbox {
  position: absolute;
  left: -30px;
  top: 50%;
  transform: translateY(-50%);
  display: none;
  padding: 10px;
}

.map-list tr:hover .hover-checkbox {
  display: block;
}

.hover-checkbox.show-checkbox {
  display: block !important;
}

.hover-checkbox input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  border: 1.5px solid #ccc;
  border-radius: 4px;
  background-color: white;
  position: relative;
}

.hover-checkbox input[type="checkbox"]:checked {
  background-color: #1976d2;
  border-color: #1976d2;
}

.hover-checkbox input[type="checkbox"]:checked::after {
  content: "✓";
  position: absolute;
  color: white;
  font-size: 12px;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}

/* 빈 최근 맵 상태 스타일 */
.empty-recent-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: 60px 20px;
  text-align: center;
  min-height: 50vh;
}

.empty-recent-icon {
  margin-bottom: 20px;
  background-color: #f5f5f5;
  width: 160px;
  height: 160px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-recent-title {
  margin-bottom: 5px; /* 제목과 설명 사이 간격 */
}

.empty-recent-description {
  font-size: 14px;
  color: #5f6368;
  max-width: 400px;
  margin-bottom: 24px;
  line-height: 1.5;
}

/* 콘텐츠 영역 애니메이션 */
.slide-up-animation {
  animation: slideUp 0.6s ease-out forwards;
  animation-delay: 0.4s;
  transform: translateY(30px);
  opacity: 0;
}

@keyframes slideUp {
  0% {
    transform: translateY(30px);
    opacity: 0;
  }
  100% {
    transform: translateY(0);
    opacity: 1;
  }
}

/* 테이블 행에 지연된 애니메이션 적용 */
.map-list table tr {
  animation: fadeInUp 0.5s ease-out forwards;
  opacity: 0;
  transform: translateY(20px);
}

.map-list table tr:nth-child(1) {
  animation-delay: 0.5s;
}
.map-list table tr:nth-child(2) {
  animation-delay: 0.6s;
}
.map-list table tr:nth-child(3) {
  animation-delay: 0.7s;
}
.map-list table tr:nth-child(4) {
  animation-delay: 0.8s;
}
.map-list table tr:nth-child(5) {
  animation-delay: 0.9s;
}
.map-list table tr:nth-child(6) {
  animation-delay: 1s;
}
.map-list table tr:nth-child(7) {
  animation-delay: 1.1s;
}
.map-list table tr:nth-child(8) {
  animation-delay: 1.2s;
}
.map-list table tr:nth-child(9) {
  animation-delay: 1.3s;
}
.map-list table tr:nth-child(10) {
  animation-delay: 1.4s;
}

@keyframes fadeInUp {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 빈 상태 애니메이션 */
.empty-recent-container {
  animation: fadeIn 0.8s ease-out forwards;
  opacity: 0;
}

@keyframes fadeIn {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}
</style>
