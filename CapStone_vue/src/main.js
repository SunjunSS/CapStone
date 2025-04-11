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
let userExitedFullscreen = false;
let pendingFullscreenRequest = null;

// 마인드맵 캡처 상태 추적 변수
let isMindmapCapturing = false;
let captureTimeoutId = null;
const CAPTURE_LOCK_DURATION = 2000; // 캡처 중 상태 유지 시간 (2초)

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

// 마인드맵 캡처 중인지 감지
const isMindmapCapture = () => {
  // 이미 캡처 중이라고 판단된 경우
  if (isMindmapCapturing) {
    return true;
  }

  // URL에 mindmap 포함 여부 확인
  if (window.location.pathname.includes("/mindmap")) {
    return true;
  }

  // DOM에 마인드맵 관련 요소가 있는지 확인
  return (
    document.querySelector(".mindmap-capture") !== null ||
    document.querySelector("[data-capture]") !== null ||
    document.querySelector(".capture-button") !== null ||
    document.querySelector(".capture-area") !== null ||
    document.getElementById("마인드맵_캡처") !== null
  );
};

// 마인드맵 캡처 버튼 클릭 감지 및 처리
const setupCaptureButtonListeners = () => {
  // 캡처 버튼 선택자들
  const selectors = [
    ".마인드맵_캡처",
    ".mindmap-capture",
    "[data-capture]",
    ".capture-button",
    "#마인드맵_캡처",
    'button:contains("마인드맵 캡처")',
  ];

  // 가능한 모든 선택자로 버튼 찾기 시도
  selectors.forEach((selector) => {
    try {
      const elements = document.querySelectorAll(selector);
      elements.forEach((element) => {
        if (element && !element.hasAttribute("data-capture-listener")) {
          element.setAttribute("data-capture-listener", "true");

          element.addEventListener(
            "click",
            () => {
              console.log("마인드맵 캡처 버튼 클릭 감지");

              // 캡처 중 상태로 설정
              isMindmapCapturing = true;

              // 기존 타이머 취소
              if (captureTimeoutId) {
                clearTimeout(captureTimeoutId);
              }

              // 전체화면 일시적으로 종료
              if (document.fullscreenElement) {
                document.exitFullscreen().catch((err) => {
                  console.log("전체화면 종료 실패:", err);
                });
              }

              // 지정된 시간 후에 캡처 중 상태 해제
              captureTimeoutId = setTimeout(() => {
                isMindmapCapturing = false;
                captureTimeoutId = null;

                // 캡처 후 다시 전체화면으로 진입
                if (
                  isMobileOrTablet() &&
                  !document.fullscreenElement &&
                  !userExitedFullscreen
                ) {
                  reenterFullscreenIfNeeded();
                }
              }, CAPTURE_LOCK_DURATION);
            },
            { passive: true }
          );
        }
      });
    } catch (e) {
      // 선택자 오류 무시
    }
  });
};

// MutationObserver로 마인드맵 캡처 버튼 동적 감지
const setupCaptureButtonObserver = () => {
  const observer = new MutationObserver((mutations) => {
    let shouldCheck = false;

    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        shouldCheck = true;
        break;
      }
    }

    if (shouldCheck) {
      setupCaptureButtonListeners();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  return observer;
};

// 전체화면 재진입 함수 - 상황에 따라 속도 조절
const reenterFullscreenIfNeeded = () => {
  if (
    isMobileOrTablet() &&
    !document.fullscreenElement &&
    !userExitedFullscreen
  ) {
    // 마인드맵 캡처 중인지 확인
    if (isMindmapCapturing || isMindmapCapture()) {
      console.log("마인드맵 캡처 중 - 전체화면 재진입 지연");

      // 캡처 중에는 전체화면 진입 지연
      if (pendingFullscreenRequest) {
        clearTimeout(pendingFullscreenRequest);
      }

      pendingFullscreenRequest = setTimeout(() => {
        // 캡처가 완료되었는지 다시 확인
        if (!isMindmapCapturing) {
          document.documentElement
            .requestFullscreen()
            .then(() => {
              isInFullscreen = true;
              setupCustomSwipeGesture();
              console.log("캡처 후 전체화면 재진입 완료");
            })
            .catch((err) => {
              console.warn("풀스크린 재진입 실패:", err);
            });
        }
        pendingFullscreenRequest = null;
      }, 1000); // 1초 지연
    } else {
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
  }
};

// 주소창 숨기기
const hideAddressBar = () => {
  // 마인드맵 캡처 중이면 처리 지연
  if (isMindmapCapturing) {
    console.log("마인드맵 캡처 중 - 주소창 숨기기 지연");
    return;
  }

  // 마인드맵 페이지인지 확인
  const isCapturePage = isMindmapCapture();
  const delay = isCapturePage ? 300 : 50;

  setTimeout(() => {
    window.scrollTo(0, 1);

    if (
      isMobileOrTablet() &&
      document.documentElement.requestFullscreen &&
      !document.fullscreenElement &&
      !isInFullscreen &&
      !userExitedFullscreen &&
      !isMindmapCapturing // 캡처 중이 아닐 때만 처리
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
  }, delay);
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

// 클릭 또는 터치 이벤트 발생 시 풀스크린 복귀 시도 (마인드맵 캡처 제외)
const clickOrTouchHandler = (e) => {
  // 마인드맵 캡처 버튼이나 캡처 중인 경우 무시
  if (
    isMindmapCapturing ||
    e.target.closest(".mindmap-capture") ||
    e.target.closest("[data-capture]") ||
    e.target.closest(".capture-button") ||
    e.target.closest("#마인드맵_캡처") ||
    e.target.closest(".마인드맵_캡처") ||
    (e.target.textContent && e.target.textContent.includes("마인드맵 캡처"))
  ) {
    // 캡처 관련 요소 클릭 시 캡처 중 상태로 설정
    if (!isMindmapCapturing) {
      console.log("마인드맵 캡처 요소 클릭 감지");
      isMindmapCapturing = true;

      // 지정된 시간 후에 캡처 중 상태 해제
      if (captureTimeoutId) {
        clearTimeout(captureTimeoutId);
      }

      captureTimeoutId = setTimeout(() => {
        isMindmapCapturing = false;
        captureTimeoutId = null;
      }, CAPTURE_LOCK_DURATION);
    }
    return;
  }

  // 캡처 중이 아닐 때만 전체화면 재진입 처리
  if (!isMindmapCapturing) {
    reenterFullscreenIfNeeded();
  }
};

document.addEventListener("click", clickOrTouchHandler, { passive: true });
document.addEventListener("touchend", clickOrTouchHandler, { passive: true });

// 초기 로드
window.addEventListener("load", () => {
  userExitedFullscreen = false;

  // 마인드맵 캡처 버튼 감지 설정
  setupCaptureButtonListeners();
  setupCaptureButtonObserver();

  // 페이지 로드 시 지연 처리
  setTimeout(() => {
    hideAddressBar();
  }, 500);
});

// 리사이즈
window.addEventListener("resize", () => {
  // 캡처 중인 경우 무시
  if (isMindmapCapturing) return;

  if (!userExitedFullscreen) {
    hideAddressBar();
  }
});

// 라우터 이동
router.afterEach(() => {
  userExitedFullscreen = false;

  // 라우터 이동 시 캡처 중 상태 초기화
  isMindmapCapturing = false;
  if (captureTimeoutId) {
    clearTimeout(captureTimeoutId);
    captureTimeoutId = null;
  }

  // 지연 후 처리
  setTimeout(() => {
    // 새 페이지 로드 후 캡처 버튼 감지 재설정
    setupCaptureButtonListeners();
    hideAddressBar();
  }, 300);
});

// 뒤로가기
window.addEventListener("popstate", () => {
  userExitedFullscreen = false;

  // 캡처 중 상태 초기화
  isMindmapCapturing = false;
  if (captureTimeoutId) {
    clearTimeout(captureTimeoutId);
    captureTimeoutId = null;
  }

  hideAddressBar();
});
