<template>
  <div class="mymap-container">
    <!-- 사이드바 -->
    <MainHomeSideBar />

    <!-- 콘텐츠 영역 -->
    <main class="content">
      <header class="content-header">
        <h2>최근 맵</h2>
      </header>

      <section class="map-list">
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
              <td class="creator-column">{{ item.creator }}</td>
              <td class="date-column">{{ item.date }}</td>
              <td class="action-column">
                <button class="menu-button" @click="showMenu(index, $event)">
                  ⋯
                </button>
                <div
                  v-if="item.showMenu"
                  class="menu-dropdown"
                  ref="menuDropdown"
                >
                  <ul>
                    <li @click="openMap(index)">🗝️ 열기</li>
                    <li @click="duplicateMap(index)">📋 복제</li>
                    <li @click="moveToFavorite(index)">📌 즐겨찾기</li>
                    <li @click="moveToTrash(index)" class="delete-option">
                      🗑️ 휴지통으로 이동
                    </li>
                  </ul>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </main>
  </div>
</template>

<script>
import MainHomeSideBar from "./MainHomeSideBar.vue";

export default {
  name: "MyMap",
  components: {
    MainHomeSideBar,
  },
  data() {
    return {
      mapItems: [
        {
          name: "나의 새 마인드맵",
          creator: "kim",
          date: "Jan 22, 2025",
          selected: false,
          showMenu: false,
        },
        {
          name: "캡스톤 마인드맵 탐색",
          creator: "kim",
          date: "Feb 10, 2025",
          selected: false,
          showMenu: false,
        },
      ],
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
  methods: {
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
    openMap(index) {
      // 맵 열기 기능 구현
      alert(`${this.mapItems[index].name} 열기`);
      this.closeAllMenus();
    },
    duplicateMap(index) {
      // 맵 복제 기능 구현
      alert(`${this.mapItems[index].name} 복제`);
      this.closeAllMenus();
    },
    moveToFavorite(index) {
      // 즐겨찾기 추가 기능 구현
      alert(`${this.mapItems[index].name}을(를) 즐겨찾기에에 추가`);
      this.closeAllMenus();
    },
    moveToTrash(index) {
      // 휴지통으로 이동 기능 구현
      if (
        confirm(
          `${this.mapItems[index].name}을(를) 휴지통으로 이동하시겠습니까?`
        )
      ) {
        this.mapItems.splice(index, 1);
      }
      this.closeAllMenus();
    },
  },
  mounted() {
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

.mymap-container {
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
</style>
