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
              <th class="checkbox-column"></th>
              <th>이름</th>
              <th>만든 사람</th>
              <th>수정</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="checkbox-column">
                <input type="checkbox" class="row-checkbox" />
              </td>
              <td>🗺 나의 새 마인드맵</td>
              <td>kim</td>
              <td>Jan 22, 2025</td>
            </tr>
            <tr>
              <td class="checkbox-column">
                <input type="checkbox" class="row-checkbox" />
              </td>
              <td>🗺 캡스톤 마인드맵 탐색</td>
              <td>kim</td>
              <td>Feb 10, 2025</td>
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
};
</script>

<style scoped>
.mymap-container {
  display: flex;
  min-height: 100vh;
}

.content {
  flex: 1;
  padding: 20px;
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
  padding: 40px;
  border-radius: 5px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 150px;
  min-height: 120px;
}

.map-item .icon {
  font-size: 24px;
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
}

/* 체크박스 열 스타일 */
.checkbox-column {
  width: 40px;
  text-align: center;
}

/* 체크박스 기본 상태 */
.row-checkbox {
  display: none;
  cursor: pointer;
}

/* tr에 호버했을 때 체크박스 보이기 */
.map-list tbody tr:hover .row-checkbox {
  display: inline-block;
}

/* 나머지 열 너비 조정 */
.map-list th:nth-child(2),
.map-list td:nth-child(2) {
  width: 45%;
}

.map-list th:nth-child(3),
.map-list td:nth-child(3),
.map-list th:nth-child(4),
.map-list td:nth-child(4) {
  width: 25%;
  text-align: center;
}

.map-list tbody tr {
  cursor: pointer;
}

.map-list tbody tr:hover {
  background-color: #f8f9fa;
}
</style>
