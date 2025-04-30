<template>
  <div class="mymap-container">
    <!-- 사이드바 -->
    <MainHomeSideBar />

    <!-- 콘텐츠 영역 -->
    <main class="content slide-up-animation">
      <header
        class="content-header slide-up-animation"
        style="animation-delay: 0.1s"
      >
        <h2>휴지통에 버린 지도</h2>
        <button
          class="clear-trash-button"
          @click="clearTrash"
          v-if="mapItems.length > 0"
        >
          휴지통 비우기
        </button>
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
                  {{ item.name }}
                </td>
                <td class="creator-column">{{ item.creator || "너" }}</td>
                <td class="date-column">{{ item.date || "-" }}</td>
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
                        <li @click="restoreMap(item.project_id, index)">
                          ♻️ 복구
                        </li>
                        <li
                          @click="deleteMapPermanently(item.project_id, index)"
                          class="delete-option"
                        >
                          🗑️ 완전히 삭제
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
        <div v-else class="empty-trash-container">
          <div class="empty-trash-icon">
            <svg
              width="80"
              height="80"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M8 6L9 3H15L16 6M3 6H21V8H20L19 21H5L4 8H3V6Z"
                stroke="#9AA0A6"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>
          <h3 class="empty-trash-title">삭제된 지도가 여기에 표시됩니다.</h3>
          <p class="empty-trash-description">
            마음이 바뀌었나요? 지도를 복원할 수 있습니다.
          </p>
        </div>
      </section>
    </main>

    <!-- 로딩 오버레이 -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>처리 중...</p>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed, onBeforeUnmount } from "vue";
import MainHomeSideBar from "./MainHomeSideBar.vue";
import { useRouter } from "vue-router";
import {
  getTrashProjects,
  restoreProject,
  deleteProject,
} from "../../api/projectApi";

export default {
  name: "TrashPage", // 컴포넌트 이름을 TrashPage로 수정
  components: {
    MainHomeSideBar,
  },
  setup() {
    const router = useRouter();
    const mapItems = ref([]);
    const isLoading = ref(false);

    // 세션에서 userId 가져오기
    const userId = sessionStorage.getItem("userId");

    // 휠 이벤트 처리를 위한 변수
    let isScrolling = false;
    let scrollTimeout;

    // 휠 이벤트 핸들러
    const handleWheel = (event) => {
      // 이미 스크롤 중이면 추가 이벤트 무시
      if (isScrolling) return;

      // 위로 스크롤하는 경우 (deltaY가 음수)
      if (event.deltaY < -50) {
        isScrolling = true;

        // 연속된 스크롤 이벤트 방지를 위한 디바운싱
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          console.log("위로 스크롤 감지, Favorite 페이지로 이동합니다");
          router.push("/Favorite");

          // 스크롤 상태 초기화 (다음 페이지에서 정상 작동하도록)
          setTimeout(() => {
            isScrolling = false;
          }, 500);
        }, 300);
      }
    };

    // 휴지통에 있는 프로젝트 목록 로드
    const loadTrashProjects = async () => {
      if (!userId) {
        console.error("❌ 사용자 ID가 없습니다.");
        return;
      }

      isLoading.value = true;
      try {
        const trashProjects = await getTrashProjects(userId);
        console.log("🟢 휴지통 프로젝트 로드 성공:", trashProjects);

        mapItems.value = trashProjects.map((project) => ({
          project_id: project.project_id,
          name: project.name,
          creator: project.creator,
          date: project.date,
          selected: false,
          showMenu: false,
        }));
      } catch (error) {
        console.error("❌ 휴지통 프로젝트 로드 오류:", error);
      } finally {
        isLoading.value = false;
      }
    };

    // 프로젝트 복원
    const restoreMap = async (projectId, index) => {
      if (index < 0 || index >= mapItems.value.length) {
        console.error("❌ 유효하지 않은 인덱스:", index);
        return;
      }

      const mapName = mapItems.value[index].name;

      if (confirm(`${mapName}을(를) 복구하시겠습니까?`)) {
        isLoading.value = true;
        try {
          await restoreProject(projectId);
          console.log(`♻️ 프로젝트(${projectId}) 복원 완료`);
          mapItems.value.splice(index, 1);
          alert(`${mapName}이(가) 복구되었습니다.`);
        } catch (error) {
          console.error("❌ 프로젝트 복원 오류:", error);
          alert("프로젝트 복원 중 오류가 발생했습니다.");
        } finally {
          isLoading.value = false;
        }
      }
    };

    // 프로젝트 완전 삭제
    const deleteMapPermanently = async (projectId, index) => {
      if (index < 0 || index >= mapItems.value.length) {
        console.error("❌ 유효하지 않은 인덱스:", index);
        return;
      }

      const mapName = mapItems.value[index].name;

      if (
        confirm(
          `${mapName}을(를) 완전히 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다!`
        )
      ) {
        isLoading.value = true;
        try {
          await deleteProject(projectId);
          console.log(`🚮 프로젝트(${projectId}) 완전 삭제 완료`);
          mapItems.value.splice(index, 1);
        } catch (error) {
          console.error("❌ 프로젝트 완전 삭제 오류:", error);
          alert("프로젝트 삭제 중 오류가 발생했습니다.");
        } finally {
          isLoading.value = false;
        }
      }
    };

    // 휴지통 비우기 (선택된 모든 항목 완전 삭제)
    const clearTrash = async () => {
      if (confirm("휴지통을 비우시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
        const selectedItems = mapItems.value.filter((item) => item.selected);

        if (selectedItems.length === 0) {
          // 선택된 항목이 없으면 모든 항목 삭제
          if (confirm("모든 항목을 완전히 삭제하시겠습니까?")) {
            isLoading.value = true;
            try {
              const deletePromises = mapItems.value.map((item) =>
                deleteProject(item.project_id)
              );
              await Promise.all(deletePromises);
              console.log("🚮 모든 프로젝트 완전 삭제 완료");
              mapItems.value = [];
            } catch (error) {
              console.error("❌ 휴지통 비우기 오류:", error);
              alert("휴지통 비우기 중 오류가 발생했습니다.");
            } finally {
              isLoading.value = false;
            }
          }
        } else {
          // 선택된 항목만 삭제
          isLoading.value = true;
          try {
            const deletePromises = selectedItems.map((item) =>
              deleteProject(item.project_id)
            );
            await Promise.all(deletePromises);

            // 선택된 항목들을 mapItems에서 제거
            mapItems.value = mapItems.value.filter((item) => !item.selected);
            console.log("🚮 선택된 프로젝트 완전 삭제 완료");
          } catch (error) {
            console.error("❌ 선택된 항목 삭제 오류:", error);
            alert("선택된 항목 삭제 중 오류가 발생했습니다.");
          } finally {
            isLoading.value = false;
          }
        }
      }
    };

    // 체크박스 처리
    const handleCheckboxChange = () => {
      // 체크박스 변경 핸들러
    };

    // 메뉴 표시
    const showMenu = (index, event) => {
      // 다른 메뉴 모두 닫기
      mapItems.value.forEach((item, i) => {
        if (i !== index) {
          item.showMenu = false;
        }
      });

      // 선택한 메뉴 토글
      mapItems.value[index].showMenu = !mapItems.value[index].showMenu;
      event.stopPropagation(); // 이벤트 버블링 방지
    };

    // 모든 메뉴 닫기
    const closeAllMenus = () => {
      mapItems.value.forEach((item) => {
        item.showMenu = false;
      });
    };

    // 계산된 속성들
    const hasSelectedItems = computed(() => {
      return mapItems.value.some((item) => item.selected);
    });

    const selectedItemsCount = computed(() => {
      return mapItems.value.filter((item) => item.selected).length;
    });
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
      loadTrashProjects();
      // 메뉴 외부 클릭 시 메뉴 닫기
      document.addEventListener("click", closeAllMenus);
      // 휠 이벤트 리스너 등록
      window.addEventListener("wheel", handleWheel, { passive: false });
    });

    onBeforeUnmount(() => {
      // 컴포넌트 언마운트 시 휠 이벤트 리스너 제거 및 타이머 정리
      window.removeEventListener("wheel", handleWheel);
      clearTimeout(scrollTimeout);
    });

    return {
      mapItems,
      getDropdownPosition,
      isLoading,
      restoreMap,
      deleteMapPermanently,
      clearTrash,
      loadTrashProjects,
      handleCheckboxChange,
      showMenu,
      closeAllMenus,
      hasSelectedItems,
      selectedItemsCount,
    };
  },
  mounted() {
    // setup()에서 이벤트 리스너를 추가하므로 여기서는 제거
  },
  beforeUnmount() {
    // setup()에서 추가된 이벤트 리스너 제거
    document.removeEventListener("click", this.closeAllMenus);
  },
};
</script>

<style scoped>
/* 기존 스타일 유지 */
.map-icon {
  margin-right: 5px;
}

.clear-trash-button {
  background-color: #e53935;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
  margin-right: 100px;
}

.clear-trash-button:hover {
  background-color: #c62828;
}

/* 나머지 스타일은 동일하게 유지 */
.selected-row {
  background-color: #e3f2fd;
}

.mymap-container {
  display: flex;
  min-height: 100vh;
  position: relative;
}

.content {
  flex: 1;
  padding-top: 20px;
  display: flex;
  flex-direction: column;
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

/* 빈 휴지통 상태 스타일 */
.empty-trash-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: 60px 20px;
  text-align: center;
  min-height: 50vh;
}

.empty-trash-icon {
  margin-bottom: 20px;
  background-color: #f5f5f5;
  width: 160px;
  height: 160px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-trash-title {
  margin-bottom: 5px; /* 제목과 설명 사이 간격 */
}

.empty-trash-description {
  font-size: 14px;
  color: #5f6368;
  max-width: 400px;
  margin-bottom: 24px;
  line-height: 1.5;
}

.view-plans-button {
  background-color: #1a73e8;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.view-plans-button:hover {
  background-color: #1765cc;
}

/* 로딩 오버레이 */
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
  border-top: 5px solid #3498db;
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
.empty-trash-container {
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
