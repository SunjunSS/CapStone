<!-- App.vue -->
<template>
  <div class="app-container">
    <div class="sidebar">
      <div class="logo-container">
        <img src="/mindmap2.png" alt="마음지도 로고" class="logo-image" />
        <h1 class="logo-text">마음지도</h1>
      </div>

      <nav class="nav-menu">
        <div class="nav-item">
          <div class="nav-link">
            <svg class="icon" viewBox="0 0 24 24" width="24" height="24">
              <path
                fill="currentColor"
                d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"
              />
            </svg>
            <span>팀 맵</span>
          </div>
        </div>

        <div class="nav-item active">
          <div class="nav-link">
            <svg class="icon" viewBox="0 0 24 24" width="24" height="24">
              <path
                fill="currentColor"
                d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"
              />
            </svg>
            <span>내 지도</span>
          </div>
        </div>

        <div class="nav-item">
          <div class="nav-link">
            <svg class="icon" viewBox="0 0 24 24" width="24" height="24">
              <path
                fill="currentColor"
                d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"
              />
              <path
                fill="currentColor"
                d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z"
              />
            </svg>
            <span>최근</span>
          </div>
        </div>

        <div class="nav-item">
          <div class="nav-link">
            <svg class="icon" viewBox="0 0 24 24" width="24" height="24">
              <path
                fill="currentColor"
                d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z"
              />
            </svg>
            <span>즐겨찾기</span>
          </div>
        </div>

        <div class="nav-item">
          <div class="nav-link">
            <svg class="icon" viewBox="0 0 24 24" width="24" height="24">
              <path
                fill="currentColor"
                d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"
              />
            </svg>
            <span>공개</span>
          </div>
        </div>

        <div class="nav-item">
          <div class="nav-link">
            <svg class="icon" viewBox="0 0 24 24" width="24" height="24">
              <path
                fill="currentColor"
                d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
              />
            </svg>
            <span>휴지통으로 이동</span>
          </div>
        </div>
      </nav>
    </div>

    <div class="main-content">
      <!-- 메인 콘텐츠는 여기에 -->
    </div>
  </div>
</template>

<script>
export default {
  name: "App",
};
</script>

<style>
.app-container {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 250px;
  background-color: #1e1f24;
  position: fixed;
  left: 0;
  top: 0;
  height: 100vh;
  color: white;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.logo-container {
  padding: 10px 0;
  margin-bottom: 20px;
  display: flex; /* 추가 */
  align-items: center; /* 추가 */
  gap: 10px; /* 추가: 이미지와 텍스트 사이 간격 */
}

.logo-text {
  font-size: 20px;
  font-weight: bold;
  color: white;
  margin: 0;
}

.nav-menu {
  flex-grow: 1;
}

.nav-item {
  margin-bottom: 8px;
}

.nav-link {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.nav-link:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.icon {
  margin-right: 12px;
  opacity: 0.8;
}

.nav-link span {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
}

.main-content {
  margin-left: 250px;
  flex: 1;
  padding: 20px;
}

.logo-image {
  height: 45px; /* 원하는 크기로 조절하세요 */
  width: auto;
  margin-bottom: 10px;
}
</style>
