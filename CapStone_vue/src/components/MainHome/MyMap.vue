<template>
  <div class="mymap-container">
    <!-- 사이드바 -->
    <MainHomeSideBar />

    <!-- 콘텐츠 영역 -->
    <main class="content">
      <header class="content-header">
        <h2>내 지도</h2>
      </header>

      <section class="create-map">
        <h3>지도 만들기</h3>
        <div class="map-options">
          <div class="map-item">
            <span class="icon">➕</span>
            <span class="text">빈 지도</span>
          </div>
          <div class="map-item">
            <span class="icon">💡</span>
            <span class="text">마인드 맵</span>
          </div>
          <div class="map-item">
            <span class="icon">⚙️</span>
            <span class="text">조직도</span>
          </div>
          <div class="map-item">
            <span class="icon">🎯</span>
            <span class="text">SMART 목표</span>
          </div>
          <div class="map-item">
            <span class="icon">📝</span>
            <span class="text">프로젝트 계획</span>
          </div>
        </div>
      </section>

      <section class="map-list">
        <h3>지도 탐색</h3>
        <table>
          <thead>
            <tr>
              <th>이름</th>
              <th>만든 사람</th>
              <th>수정</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(item, index) in mapItems"
              :key="index"
              :class="{ 'selected-row': item.selected }"
            >
              <td>
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
              <td>{{ item.creator }}</td>
              <td>{{ item.date }}</td>
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
        },
        {
          name: "캡스톤 마인드맵 탐색",
          creator: "kim",
          date: "Feb 10, 2025",
          selected: false,
        },
      ],
    };
  },
  computed: {
    hasSelectedItems() {
      return this.mapItems.some((item) => item.selected);
    },
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

.create-map,
.map-list {
  background: white;
  padding: 15px;
  margin-bottom: 40px;
  border-radius: 8px;
}

.map-options {
  display: flex;
  gap: 20px;
  padding-top: 30px;
}

.map-item {
  background: #eee;
  padding: 20px;
  border-radius: 15px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 220px;
  min-height: 120px;
}

.map-item:hover {
  background-color: #ddd; /* 호버 시 배경색 변경 */
}

.map-item .icon {
  font-size: 50px;
  margin-bottom: 10px;
}

.map-item .text {
  text-align: center;
}

.map-list table {
  margin-top: 30px;
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.map-list th,
.map-list td {
  padding: 10px;
  border-bottom: 1px solid #ddd;
  text-align: left;
}

.map-list th {
  font-weight: bold;
  background: #f5f5f5;
  text-align: left;
}

.map-list td {
  text-align: left;
}

.map-list th:nth-child(1),
.map-list td:nth-child(1) {
  width: 50%;
  text-align: left;
  position: relative;
}

.map-list th:nth-child(2),
.map-list td:nth-child(2) {
  text-align: center;
}

.map-list th:nth-child(3),
.map-list td:nth-child(3) {
  text-align: center;
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
