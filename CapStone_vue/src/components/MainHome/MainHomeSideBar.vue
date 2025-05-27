<!-- MainHomeSideBar.vue -->
<template>
  <div class="app-container">
    <div class="sidebar">
      <div class="logo-container">
        <img src="/mindmap2.png" alt="마음지도 로고" class="logo-image" />
        <h1 class="logo-text">마음지도</h1>
      </div>

      <nav class="nav-menu">
        <div
          class="nav-item"
          :class="{
            active: isActive,
            disabled: isMainRouteAndNotLoggedIn,
          }"
          @click="handleNavClick(goToMyMap)"
        >
          <div class="nav-link">
            <svg class="icon" viewBox="0 0 24 24" width="24" height="24">
              <path
                fill="currentColor"
                d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"
              />
            </svg>
            <span>지도 생성</span>
          </div>
        </div>

        <div
          class="nav-item"
          :class="{
            active: isRecentActive,
            disabled: isMainRouteAndNotLoggedIn,
          }"
          @click="handleNavClick(goToRecent)"
        >
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
            <span>내 지도</span>
          </div>
        </div>

        <div
          class="nav-item"
          :class="{
            active: isFavoriteActive,
            disabled: isMainRouteAndNotLoggedIn,
          }"
          @click="handleNavClick(goToFavorite)"
        >
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

        <div
          class="nav-item"
          :class="{
            active: isTrashActive,
            disabled: isMainRouteAndNotLoggedIn,
          }"
          @click="handleNavClick(goToTrash)"
        >
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

      <div class="login-section">
        <div class="user-profile">
          <div class="profile-image">
            <svg class="icon" viewBox="0 0 24 24" width="20" height="20">
              <path
                fill="currentColor"
                d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
              />
            </svg>
          </div>
          <div class="profile-info">
            <div class="profile-name" :class="{ 'not-logged-in': !isLoggedIn }">
              {{ userDisplayName }}
            </div>
            <button v-if="!isLoggedIn" class="login-button" @click="goToLogin">
              로그인
            </button>
            <button v-else class="login-button" @click="handleLogout">
              로그아웃
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="main-content" :class="{ 'no-padding': isMyMapPage }">
      <login-required v-if="shouldShowLoginRequired" />
      <router-view v-else></router-view>
    </div>
  </div>
</template>

<script>
import { useRouter, useRoute } from "vue-router";
import { computed, ref } from "vue";
import LoginRequired from "./LoginRequired.vue";
import { disconnectSocket } from "../socket/socket";

export default {
  name: "App",
  components: {
    LoginRequired,
  },
  setup() {
    const router = useRouter();
    const route = useRoute();
    const loginRedirectMessage = ref(false);

    const isActive = computed(() => route.path === "/MyMap");
    const isRecentActive = computed(() => route.path === "/Recent");
    const isTrashActive = computed(() => route.path === "/TrashPage");
    const isFavoriteActive = computed(() => route.path === "/Favorite");
    const isMyMapPage = computed(() => route.path === "/MyMap");

    // Changed to use sessionStorage
    const isLoggedIn = computed(() => {
      return (
        sessionStorage.getItem("isLoggedIn") === "true" &&
        sessionStorage.getItem("userEmail") !== null
      );
    });

    const userDisplayName = computed(() => {
      // 닉네임을 우선적으로 사용하고, 없으면 이메일 사용
      const userNickname = sessionStorage.getItem("userNickname");
      return isLoggedIn.value
        ? userNickname || sessionStorage.getItem("userEmail")
        : "로그인 후 이용 가능합니다.";
    });

    const isMainRouteAndNotLoggedIn = computed(() => {
      return route.path === "/" && !isLoggedIn.value;
    });

    const shouldShowLoginRequired = computed(() => {
      return route.path === "/" && !isLoggedIn.value;
    });

    const handleNavClick = (navFunction) => {
      if (isMainRouteAndNotLoggedIn.value) {
        loginRedirectMessage.value = true;
        return;
      }
      navFunction();
    };

    const goToMyMap = () => {
      router.push("/MyMap");
    };

    const goToRecent = () => {
      router.push("/Recent");
    };

    const goToTrash = () => {
      router.push("/TrashPage");
    };

    const goToFavorite = () => {
      router.push("/Favorite");
    };

    const goToLogin = () => {
      router.push("/Login");
    };

    // Changed to use sessionStorage
    const handleLogout = () => {
      disconnectSocket();
      sessionStorage.removeItem("userEmail");
      sessionStorage.removeItem("userNickname");
      sessionStorage.removeItem("isLoggedIn");
      router.push("/");
    };

    return {
      isActive,
      isRecentActive,
      isTrashActive,
      goToMyMap,
      goToRecent,
      goToTrash,
      isFavoriteActive,
      goToFavorite,
      isLoggedIn,
      shouldShowLoginRequired,
      goToLogin,
      handleNavClick,
      loginRedirectMessage,
      isMainRouteAndNotLoggedIn,
      userDisplayName,
      handleLogout,
      isMyMapPage,
    };
  },
};
</script>

<style scoped>
.app-container {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 250px;
  background-color: #333333;
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
  display: flex;
  align-items: center;
  gap: 10px;
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

.nav-item.active .nav-link {
  background-color: rgba(255, 255, 255, 0.2);
}

.nav-item:not(.disabled) .nav-link:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.nav-item.disabled {
  opacity: 0.6;
  cursor: default;
}

.nav-item.disabled .nav-link {
  cursor: not-allowed;
}

.nav-item.disabled .nav-link:hover {
  background-color: transparent;
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

/* MyMap 페이지용 패딩 제거 클래스 */
.main-content.no-padding {
  padding: 0;
}

.logo-image {
  height: 45px;
  width: auto;
  margin-bottom: 10px;
}

.login-section {
  margin-top: auto;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  background-color: rgba(255, 255, 255, 0.1);
}

.profile-image {
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background-color: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
}

.profile-image .icon {
  margin-right: 0;
  width: 27px;
  height: 27px;
}

.profile-info {
  flex-grow: 1;
}

.profile-name {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 4px;
}

.not-logged-in {
  font-size: 10.9px; /* 로그인하지 않은 상태일 때 더 작은 폰트 크기 */
  margin-bottom: 8px;
  color: rgba(255, 255, 255, 0.7); /* 옵션: 약간 다른 색상 */
}

.login-button {
  width: 100%;
  background-color: #4a90e2;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.login-button:hover {
  background-color: #357abd;
}
</style>
