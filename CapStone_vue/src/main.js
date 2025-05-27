import { createApp } from "vue";
import { registerPlugins } from "./plugins/index.js";
import App from "./App.vue";
import router from "./router.js";

import "@fortawesome/fontawesome-free/css/all.css";

const app = createApp(App);
app.use(router);
registerPlugins(app);
app.mount("#app");

// 전체화면 상태 추적 변수
let isInFullscreen = false;
let userExitedFullscreen = false;
let pendingFullscreenRequest = null;

// 모바일/태블릿 감지
const isMobileOrTablet = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  const isMobile =
    /iphone|ipad|ipod|android|blackberry|windows phone|opera mini|silk/i.test(
      userAgent
    );
  const isSmallScreen = window.innerWidth <= 1024;
  const isTouchDevice =
    "ontouchstart" in window || navigator.maxTouchPoints > 0;
  return isMobile || (isSmallScreen && isTouchDevice);
};

// 전체화면 재진입 함수 - 상황에 따라 속도 조절
const reenterFullscreenIfNeeded = () => {
  if (
    isMobileOrTablet() &&
    !document.fullscreenElement &&
    !userExitedFullscreen
  ) {
    // 일반 상황에서는 빠르게 진입
    document.documentElement
      .requestFullscreen({ navigationUI: "hide" })
      .then(() => {
        isInFullscreen = true;
        setupCustomSwipeGesture();
        console.log("풀스크린으로 빠르게 재진입 완료");
      })
      .catch((err) => {
        // 옵션이 지원되지 않는 경우 기본 방식으로 시도
        document.documentElement
          .requestFullscreen()
          .then(() => {
            isInFullscreen = true;
            setupCustomSwipeGesture();
            console.log("풀스크린으로 기본 방식 재진입 완료");
          })
          .catch((innerErr) => {
            console.warn("풀스크린 재진입 실패:", innerErr);
          });
      });
  }
};

// 주소창 숨기기
const hideAddressBar = () => {
  setTimeout(() => {
    window.scrollTo(0, 1);

    if (
      isMobileOrTablet() &&
      document.documentElement.requestFullscreen &&
      !document.fullscreenElement &&
      !isInFullscreen &&
      !userExitedFullscreen
    ) {
      document.documentElement
        .requestFullscreen({ navigationUI: "hide" })
        .then(() => {
          isInFullscreen = true;
          setupCustomSwipeGesture();
        })
        .catch((err) => {
          // 옵션이 지원되지 않는 경우 기본 방식으로 시도
          document.documentElement
            .requestFullscreen()
            .then(() => {
              isInFullscreen = true;
              setupCustomSwipeGesture();
            })
            .catch((innerErr) => {
              console.log("전체화면 전환 실패:", innerErr);
            });
        });
    } else if (!isMobileOrTablet() && document.fullscreenElement) {
      document.exitFullscreen().catch((err) => {
        console.log("전체화면 종료 실패:", err);
      });
    }
  }, 50);
};

// 커스텀 스와이프 제스처 설정
const setupCustomSwipeGesture = () => {
  let touchStartX = 0;
  let touchEndX = 0;
  const MIN_SWIPE_DISTANCE = 100;
  const EDGE_THRESHOLD = 50;

  if (window.swipeGestureInitialized) return;

  document.addEventListener(
    "touchstart",
    (e) => {
      touchStartX = e.changedTouches[0].screenX;
    },
    { passive: true }
  );

  document.addEventListener(
    "touchend",
    (e) => {
      touchEndX = e.changedTouches[0].screenX;
      if (
        touchEndX - touchStartX > MIN_SWIPE_DISTANCE &&
        touchStartX < EDGE_THRESHOLD
      ) {
        router.back();
      }
    },
    { passive: true }
  );

  window.swipeGestureInitialized = true;
};

// 전체화면 상태 감지
document.addEventListener("fullscreenchange", () => {
  if (isInFullscreen && !document.fullscreenElement) {
    // 전체화면이 깨졌지만, ESC로 나간 것인지는 아직 모름
    console.log("전체화면 해제됨");
    // 여기서는 userExitedFullscreen을 false로 유지
  }

  isInFullscreen = !!document.fullscreenElement;

  if (isInFullscreen) {
    userExitedFullscreen = false;
  }
});

// ESC 키 감지 → 사용자 명시적 종료로 간주
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && isInFullscreen) {
    userExitedFullscreen = true;
    console.log("ESC 키로 전체화면 종료");
  }
});

// 클릭 또는 터치 이벤트 발생 시 풀스크린 복귀 시도
const clickOrTouchHandler = (e) => {
  // 캡처 중이 아닐 때만 전체화면 재진입 처리
  reenterFullscreenIfNeeded();
};

document.addEventListener("click", clickOrTouchHandler, { passive: true });
document.addEventListener("touchend", clickOrTouchHandler, { passive: true });

// 초기 로드
window.addEventListener("load", () => {
  userExitedFullscreen = false;

  // 페이지 로드 시 지연 처리
  setTimeout(() => {
    hideAddressBar();
  }, 500);
});

// 리사이즈
window.addEventListener("resize", () => {
  if (!userExitedFullscreen) {
    hideAddressBar();
  }
});

// 라우터 이동
router.afterEach(() => {
  userExitedFullscreen = false;

  // 지연 후 처리
  setTimeout(() => {
    hideAddressBar();
  }, 300);
});

// 뒤로가기
window.addEventListener("popstate", () => {
  userExitedFullscreen = false;
  hideAddressBar();
});





