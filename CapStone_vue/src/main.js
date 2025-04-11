import { createApp } from "vue";
import { registerPlugins } from "./plugins/index.js";
import App from "./App.vue";
import router from "./router.js";

const app = createApp(App);
app.use(router);

registerPlugins(app);

app.mount("#app");

// 전체화면 상태 추적 변수
let isInFullscreen = false;
// 사용자가 의도적으로 전체화면을 종료했는지 추적
let userExitedFullscreen = false;

// 모바일/태블릿 기기 감지 함수
const isMobileOrTablet = () => {
  // 사용자 에이전트를 통한 모바일/태블릿 감지
  const userAgent = navigator.userAgent.toLowerCase();
  const isMobile =
    /iphone|ipad|ipod|android|blackberry|windows phone|opera mini|silk/i.test(
      userAgent
    );

  // 화면 크기를 통한 추가 감지 (태블릿도 포함)
  const isSmallScreen = window.innerWidth <= 1024;

  // 터치 기능 지원 확인
  const isTouchDevice =
    "ontouchstart" in window || navigator.maxTouchPoints > 0;

  return isMobile || (isSmallScreen && isTouchDevice);
};

// 주소창을 숨기는 함수
const hideAddressBar = () => {
  setTimeout(() => {
    // iOS Safari와 대부분의 모바일 브라우저에서 작동하는 스크롤 트릭
    window.scrollTo(0, 1);

    // 모바일/태블릿일 경우에만 전체화면 모드 진입 (사용자가 의도적으로 종료하지 않았을 때만)
    if (
      isMobileOrTablet() &&
      document.documentElement.requestFullscreen &&
      !document.fullscreenElement &&
      !isInFullscreen &&
      !userExitedFullscreen
    ) {
      document.documentElement
        .requestFullscreen()
        .then(() => {
          isInFullscreen = true;
          // 전체화면 모드에서 커스텀 스와이프 제스처 활성화
          setupCustomSwipeGesture();
        })
        .catch((err) => {
          console.log("전체화면 전환 실패:", err);
        });
    } else if (!isMobileOrTablet() && document.fullscreenElement) {
      // 데스크톱에서 전체화면 모드일 경우 종료
      document.exitFullscreen().catch((err) => {
        console.log("전체화면 종료 실패:", err);
      });
    }
  }, 300);
};

// 커스텀 스와이프 제스처 설정
const setupCustomSwipeGesture = () => {
  let touchStartX = 0;
  let touchEndX = 0;
  const MIN_SWIPE_DISTANCE = 100; // 최소 스와이프 거리
  const EDGE_THRESHOLD = 50; // 화면 가장자리 인식 임계값

  // 이미 등록된 이벤트 리스너가 있는지 확인하기 위한 플래그
  if (window.swipeGestureInitialized) return;

  // 터치 시작 이벤트
  document.addEventListener(
    "touchstart",
    (e) => {
      touchStartX = e.changedTouches[0].screenX;
    },
    { passive: true }
  );

  // 터치 종료 이벤트
  document.addEventListener(
    "touchend",
    (e) => {
      touchEndX = e.changedTouches[0].screenX;

      // 왼쪽에서 오른쪽으로의 스와이프 (뒤로가기 제스처)
      if (
        touchEndX - touchStartX > MIN_SWIPE_DISTANCE &&
        touchStartX < EDGE_THRESHOLD
      ) {
        router.back();
      }
    },
    { passive: true }
  );

  // 이벤트 리스너 등록 플래그 설정
  window.swipeGestureInitialized = true;
};

// 전체화면 상태 변경 감지
document.addEventListener("fullscreenchange", () => {
  // 이전 상태가 전체화면이었고 지금은 아니라면, 사용자가 의도적으로 종료한 것으로 간주
  if (isInFullscreen && !document.fullscreenElement) {
    userExitedFullscreen = true;
    console.log("사용자가 전체화면을 종료했습니다.");
  }

  isInFullscreen = !!document.fullscreenElement;

  // 전체화면이 활성화되면 사용자 종료 플래그 초기화
  if (isInFullscreen) {
    userExitedFullscreen = false;
  }
});

// 초기 로드 시 주소창 숨기기
window.addEventListener("load", () => {
  // 로드 시 사용자 종료 플래그 초기화
  userExitedFullscreen = false;
  hideAddressBar();
});

// 화면 크기 변경 시 (방향 전환 등) 주소창 숨기기 다시 시도
window.addEventListener("resize", () => {
  // 사용자가 의도적으로 전체화면을 종료하지 않았을 때만 주소창 숨김 시도
  if (!userExitedFullscreen) {
    hideAddressBar();
  }
});

// 라우터 이동 후 주소창 숨기기
router.afterEach(() => {
  // 페이지 이동 시 사용자 종료 플래그 초기화 (다른 페이지로 이동하면 다시 전체화면 시도)
  userExitedFullscreen = false;
  hideAddressBar();
});

// 뒤로가기 처리 - 새로고침 대신 주소창 숨김 유지
window.addEventListener("popstate", () => {
  // 페이지 이동으로 간주하고 플래그 초기화 (뒤로가기도 페이지 이동의 일종)
  userExitedFullscreen = false;
  hideAddressBar();
});

// 키보드 이벤트 리스너로 ESC 키 감지 (전체화면 종료를 위한 일반적인 키)
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && isInFullscreen) {
    userExitedFullscreen = true;
    console.log("ESC 키로 전체화면을 종료했습니다.");
  }
});
