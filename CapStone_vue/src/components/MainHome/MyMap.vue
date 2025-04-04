<--svg추가 MyMap.vue-->

<template>
  <div class="mymap-container">
    <!-- 사이드바 -->
    <MainHomeSideBar />

    <!-- 콘텐츠 영역 -->
    <main class="content">
      <div class="svg-container">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 495">
          <defs>
            <!-- Enhanced Modern Background Gradient -->
            <linearGradient
              id="bg-gradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stop-color="#0A0E1F" />
              <stop offset="100%" stop-color="#1A2044" />
            </linearGradient>

            <!-- Enhanced Node Gradients -->
            <radialGradient
              id="node-gradient-primary"
              cx="50%"
              cy="50%"
              r="50%"
            >
              <stop offset="0%" stop-color="#4E7DF7" />
              <stop offset="100%" stop-color="#2A4494" />
            </radialGradient>

            <radialGradient
              id="node-gradient-secondary"
              cx="50%"
              cy="50%"
              r="50%"
            >
              <stop offset="0%" stop-color="#FF9D2A" />
              <stop offset="100%" stop-color="#E37B00" />
            </radialGradient>

            <!-- Enhanced Connection Gradient -->
            <linearGradient
              id="line-gradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop offset="0%" stop-color="#4E7DF7" stop-opacity="0.5" />
              <stop offset="50%" stop-color="#4E7DF7" stop-opacity="0.9" />
              <stop offset="100%" stop-color="#4E7DF7" stop-opacity="0.5" />
            </linearGradient>

            <!-- Enhanced Tech Line Gradient -->
            <linearGradient
              id="tech-line-gradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop offset="0%" stop-color="#4E7DF7" stop-opacity="0.7" />
              <stop offset="50%" stop-color="#4E7DF7" stop-opacity="1" />
              <stop offset="100%" stop-color="#4E7DF7" stop-opacity="0.7" />
            </linearGradient>

            <!-- Improved Glow Effect -->
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            <!-- Digital circuit pattern -->
            <pattern
              id="circuit-pattern"
              x="0"
              y="0"
              width="200"
              height="200"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M10 10 L50 10 L50 50 L90 50"
                stroke="#4E7DF7"
                stroke-width="0.5"
                fill="none"
                opacity="0.15"
              />
              <path
                d="M100 10 L140 10 L140 50 L180 50"
                stroke="#4E7DF7"
                stroke-width="0.5"
                fill="none"
                opacity="0.15"
              />
              <path
                d="M10 100 L50 100 L50 140 L90 140"
                stroke="#4E7DF7"
                stroke-width="0.5"
                fill="none"
                opacity="0.15"
              />
              <path
                d="M100 100 L140 100 L140 140 L180 140"
                stroke="#4E7DF7"
                stroke-width="0.5"
                fill="none"
                opacity="0.15"
              />
              <circle cx="50" cy="50" r="2" fill="#4E7DF7" opacity="0.15" />
              <circle cx="150" cy="50" r="2" fill="#4E7DF7" opacity="0.15" />
              <circle cx="50" cy="150" r="2" fill="#4E7DF7" opacity="0.15" />
              <circle cx="150" cy="150" r="2" fill="#4E7DF7" opacity="0.15" />
            </pattern>

            <!-- Scanline effect -->
            <pattern
              id="scanline"
              x="0"
              y="0"
              width="8"
              height="8"
              patternUnits="userSpaceOnUse"
            >
              <line
                x1="0"
                y1="1"
                x2="800"
                y2="1"
                stroke="#FFFFFF"
                stroke-width="0.2"
                opacity="0.05"
              />
            </pattern>

            <!-- Dotted grid pattern -->
            <pattern
              id="dot-grid"
              patternUnits="userSpaceOnUse"
              width="20"
              height="20"
            >
              <circle cx="10" cy="10" r="0.5" fill="#4E7DF7" opacity="0.3" />
            </pattern>
          </defs>

          <!-- Enhanced Background Layers -->
          <rect width="800" height="495" fill="url(#bg-gradient)" />
          <rect width="800" height="495" fill="url(#circuit-pattern)" />
          <rect width="800" height="495" fill="url(#scanline)" />
          <rect width="800" height="495" fill="url(#dot-grid)" opacity="0.05" />

          <!-- Enhanced Tech Grid Lines -->
          <g opacity="0.3">
            <!-- Main horizontal lines -->
            <line
              x1="0"
              y1="124"
              x2="800"
              y2="124"
              stroke="#4E7DF7"
              stroke-width="1"
            />
            <line
              x1="0"
              y1="248"
              x2="800"
              y2="248"
              stroke="#4E7DF7"
              stroke-width="1"
            />
            <line
              x1="0"
              y1="371"
              x2="800"
              y2="371"
              stroke="#4E7DF7"
              stroke-width="1"
            />

            <!-- Main vertical lines -->
            <line
              x1="200"
              y1="0"
              x2="200"
              y2="495"
              stroke="#4E7DF7"
              stroke-width="1"
            />
            <line
              x1="400"
              y1="0"
              x2="400"
              y2="495"
              stroke="#4E7DF7"
              stroke-width="1"
            />
            <line
              x1="600"
              y1="0"
              x2="600"
              y2="495"
              stroke="#4E7DF7"
              stroke-width="1"
            />
          </g>

          <!-- Central Node with enhanced look -->
          <g>
            <!-- Hexagon background for tech feel -->
            <path
              d="M400 208 L435 228 L435 268 L400 288 L365 268 L365 228 Z"
              stroke="#FF9D2A"
              stroke-width="0.8"
              fill="none"
              opacity="0.3"
            >
              <animate
                attributeName="opacity"
                values="0.3;0.1;0.3"
                dur="4s"
                repeatCount="indefinite"
              />
            </path>

            <circle
              cx="400"
              cy="248"
              r="30"
              fill="url(#node-gradient-secondary)"
              filter="url(#glow)"
            />
            <circle
              cx="400"
              cy="248"
              r="40"
              fill="none"
              stroke="#FF9D2A"
              stroke-width="1.5"
              opacity="0.6"
            >
              <animate
                attributeName="r"
                values="40;45;40"
                dur="3s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0.6;0.2;0.6"
                dur="3s"
                repeatCount="indefinite"
              />
            </circle>
          </g>

          <!-- Enhanced Nodes and connections -->
          <g id="connections">
            <!-- Node 1 -->
            <g>
              <circle
                cx="250"
                cy="114"
                r="18"
                fill="url(#node-gradient-primary)"
                filter="url(#glow)"
              />
              <!-- Tech ring around node -->
              <circle
                cx="250"
                cy="114"
                r="22"
                fill="none"
                stroke="#4E7DF7"
                stroke-width="0.8"
                opacity="0.5"
              >
                <animate
                  attributeName="opacity"
                  values="0.5;0.2;0.5"
                  dur="3.5s"
                  repeatCount="indefinite"
                />
              </circle>
              <path
                id="path1"
                d="M373.4 228.9 Q311 171 250 114"
                stroke="url(#line-gradient)"
                stroke-width="2"
                fill="none"
              >
                <animate
                  attributeName="stroke-width"
                  values="2;2.5;2"
                  dur="4s"
                  repeatCount="indefinite"
                />
              </path>
              <circle r="3" fill="#FFFFFF">
                <animateMotion dur="4s" repeatCount="indefinite" rotate="auto">
                  <mpath xlink:href="#path1" />
                </animateMotion>
              </circle>
            </g>

            <!-- Node 2 -->
            <g>
              <circle
                cx="550"
                cy="114"
                r="18"
                fill="url(#node-gradient-primary)"
                filter="url(#glow)"
              />
              <circle
                cx="550"
                cy="114"
                r="22"
                fill="none"
                stroke="#4E7DF7"
                stroke-width="0.8"
                opacity="0.5"
              >
                <animate
                  attributeName="opacity"
                  values="0.5;0.2;0.5"
                  dur="3.7s"
                  repeatCount="indefinite"
                />
              </circle>
              <path
                id="path2"
                d="M426.6 228.9 Q488 171 550 114"
                stroke="url(#line-gradient)"
                stroke-width="2"
                fill="none"
              >
                <animate
                  attributeName="stroke-width"
                  values="2;2.5;2"
                  dur="4.2s"
                  repeatCount="indefinite"
                />
              </path>
              <circle r="3" fill="#FFFFFF">
                <animateMotion
                  dur="4.2s"
                  repeatCount="indefinite"
                  rotate="auto"
                >
                  <mpath xlink:href="#path2" />
                </animateMotion>
              </circle>
            </g>

            <!-- Node 3 -->
            <g>
              <circle
                cx="600"
                cy="297"
                r="18"
                fill="url(#node-gradient-primary)"
                filter="url(#glow)"
              />
              <circle
                cx="600"
                cy="297"
                r="22"
                fill="none"
                stroke="#4E7DF7"
                stroke-width="0.8"
                opacity="0.5"
              >
                <animate
                  attributeName="opacity"
                  values="0.5;0.2;0.5"
                  dur="3.6s"
                  repeatCount="indefinite"
                />
              </circle>
              <path
                id="path3"
                d="M426.6 267.1 Q513 282 600 297"
                stroke="url(#line-gradient)"
                stroke-width="2"
                fill="none"
              >
                <animate
                  attributeName="stroke-width"
                  values="2;2.5;2"
                  dur="4.1s"
                  repeatCount="indefinite"
                />
              </path>
              <circle r="3" fill="#FFFFFF">
                <animateMotion
                  dur="4.1s"
                  repeatCount="indefinite"
                  rotate="auto"
                >
                  <mpath xlink:href="#path3" />
                </animateMotion>
              </circle>
            </g>

            <!-- Node 4 -->
            <g>
              <circle
                cx="500"
                cy="376"
                r="18"
                fill="url(#node-gradient-primary)"
                filter="url(#glow)"
              />
              <circle
                cx="500"
                cy="376"
                r="22"
                fill="none"
                stroke="#4E7DF7"
                stroke-width="0.8"
                opacity="0.5"
              >
                <animate
                  attributeName="opacity"
                  values="0.5;0.2;0.5"
                  dur="3.9s"
                  repeatCount="indefinite"
                />
              </circle>
              <path
                id="path4"
                d="M414.1 274.6 Q457 325 500 376"
                stroke="url(#line-gradient)"
                stroke-width="2"
                fill="none"
              >
                <animate
                  attributeName="stroke-width"
                  values="2;2.5;2"
                  dur="4.3s"
                  repeatCount="indefinite"
                />
              </path>
              <circle r="3" fill="#FFFFFF">
                <animateMotion
                  dur="4.3s"
                  repeatCount="indefinite"
                  rotate="auto"
                >
                  <mpath xlink:href="#path4" />
                </animateMotion>
              </circle>
            </g>

            <!-- Node 5 -->
            <g>
              <circle
                cx="300"
                cy="376"
                r="18"
                fill="url(#node-gradient-primary)"
                filter="url(#glow)"
              />
              <circle
                cx="300"
                cy="376"
                r="22"
                fill="none"
                stroke="#4E7DF7"
                stroke-width="0.8"
                opacity="0.5"
              >
                <animate
                  attributeName="opacity"
                  values="0.5;0.2;0.5"
                  dur="3.8s"
                  repeatCount="indefinite"
                />
              </circle>
              <path
                id="path5"
                d="M385.9 274.6 Q343 325 300 376"
                stroke="url(#line-gradient)"
                stroke-width="2"
                fill="none"
              >
                <animate
                  attributeName="stroke-width"
                  values="2;2.5;2"
                  dur="4.3s"
                  repeatCount="indefinite"
                />
              </path>
              <circle r="3" fill="#FFFFFF">
                <animateMotion
                  dur="4.3s"
                  repeatCount="indefinite"
                  rotate="auto"
                >
                  <mpath xlink:href="#path5" />
                </animateMotion>
              </circle>
            </g>

            <!-- Node 6 -->
            <g>
              <circle
                cx="200"
                cy="297"
                r="18"
                fill="url(#node-gradient-primary)"
                filter="url(#glow)"
              />
              <circle
                cx="200"
                cy="297"
                r="22"
                fill="none"
                stroke="#4E7DF7"
                stroke-width="0.8"
                opacity="0.5"
              >
                <animate
                  attributeName="opacity"
                  values="0.5;0.2;0.5"
                  dur="3.4s"
                  repeatCount="indefinite"
                />
              </circle>
              <path
                id="path6"
                d="M373.4 267.1 Q286 282 200 297"
                stroke="url(#line-gradient)"
                stroke-width="2"
                fill="none"
              >
                <animate
                  attributeName="stroke-width"
                  values="2;2.5;2"
                  dur="4.1s"
                  repeatCount="indefinite"
                />
              </path>
              <circle r="3" fill="#FFFFFF">
                <animateMotion
                  dur="4.1s"
                  repeatCount="indefinite"
                  rotate="auto"
                >
                  <mpath xlink:href="#path6" />
                </animateMotion>
              </circle>
            </g>

            <!-- Node 7 -->
            <g>
              <circle
                cx="150"
                cy="198"
                r="18"
                fill="url(#node-gradient-primary)"
                filter="url(#glow)"
              />
              <circle
                cx="150"
                cy="198"
                r="22"
                fill="none"
                stroke="#4E7DF7"
                stroke-width="0.8"
                opacity="0.5"
              >
                <animate
                  attributeName="opacity"
                  values="0.5;0.2;0.5"
                  dur="3.3s"
                  repeatCount="indefinite"
                />
              </circle>
              <path
                id="path7"
                d="M370.7 248 Q260 223 150 198"
                stroke="url(#line-gradient)"
                stroke-width="2"
                fill="none"
              >
                <animate
                  attributeName="stroke-width"
                  values="2;2.5;2"
                  dur="4s"
                  repeatCount="indefinite"
                />
              </path>
              <circle r="3" fill="#FFFFFF">
                <animateMotion dur="4s" repeatCount="indefinite" rotate="auto">
                  <mpath xlink:href="#path7" />
                </animateMotion>
              </circle>
            </g>

            <!-- Node 8 -->
            <g>
              <circle
                cx="650"
                cy="198"
                r="18"
                fill="url(#node-gradient-primary)"
                filter="url(#glow)"
              />
              <circle
                cx="650"
                cy="198"
                r="22"
                fill="none"
                stroke="#4E7DF7"
                stroke-width="0.8"
                opacity="0.5"
              >
                <animate
                  attributeName="opacity"
                  values="0.5;0.2;0.5"
                  dur="3.2s"
                  repeatCount="indefinite"
                />
              </circle>
              <path
                id="path8"
                d="M429.3 248 Q540 223 650 198"
                stroke="url(#line-gradient)"
                stroke-width="2"
                fill="none"
              >
                <animate
                  attributeName="stroke-width"
                  values="2;2.5;2"
                  dur="4s"
                  repeatCount="indefinite"
                />
              </path>
              <circle r="3" fill="#FFFFFF">
                <animateMotion dur="4s" repeatCount="indefinite" rotate="auto">
                  <mpath xlink:href="#path8" />
                </animateMotion>
              </circle>
            </g>
          </g>

          <!-- Enhanced Tech circuit lines - more visible now -->
          <g opacity="0.35">
            <path
              d="M20 69 L60 69 L60 119 L120 119 L120 169"
              stroke="url(#tech-line-gradient)"
              stroke-width="1.2"
              fill="none"
            >
              <animate
                attributeName="stroke-width"
                values="1.2;1.6;1.2"
                dur="5s"
                repeatCount="indefinite"
              />
            </path>
            <path
              d="M780 69 L740 69 L740 119 L680 119 L680 169"
              stroke="url(#tech-line-gradient)"
              stroke-width="1.2"
              fill="none"
            >
              <animate
                attributeName="stroke-width"
                values="1.2;1.6;1.2"
                dur="5.5s"
                repeatCount="indefinite"
              />
            </path>
            <path
              d="M20 426 L60 426 L60 376 L120 376 L120 326"
              stroke="url(#tech-line-gradient)"
              stroke-width="1.2"
              fill="none"
            >
              <animate
                attributeName="stroke-width"
                values="1.2;1.6;1.2"
                dur="5.2s"
                repeatCount="indefinite"
              />
            </path>
            <path
              d="M780 426 L740 426 L740 376 L680 376 L680 326"
              stroke="url(#tech-line-gradient)"
              stroke-width="1.2"
              fill="none"
            >
              <animate
                attributeName="stroke-width"
                values="1.2;1.6;1.2"
                dur="5.7s"
                repeatCount="indefinite"
              />
            </path>

            <!-- Additional tech circuit lines -->
            <path
              d="M100 27 L100 67 L150 67 L150 107"
              stroke="url(#tech-line-gradient)"
              stroke-width="1.2"
              fill="none"
            >
              <animate
                attributeName="stroke-width"
                values="1.2;1.6;1.2"
                dur="4.8s"
                repeatCount="indefinite"
              />
            </path>
            <path
              d="M700 27 L700 67 L650 67 L650 107"
              stroke="url(#tech-line-gradient)"
              stroke-width="1.2"
              fill="none"
            >
              <animate
                attributeName="stroke-width"
                values="1.2;1.6;1.2"
                dur="5.3s"
                repeatCount="indefinite"
              />
            </path>
            <path
              d="M100 468 L100 428 L150 428 L150 388"
              stroke="url(#tech-line-gradient)"
              stroke-width="1.2"
              fill="none"
            >
              <animate
                attributeName="stroke-width"
                values="1.2;1.6;1.2"
                dur="5.1s"
                repeatCount="indefinite"
              />
            </path>
            <path
              d="M700 468 L700 428 L650 428 L650 388"
              stroke="url(#tech-line-gradient)"
              stroke-width="1.2"
              fill="none"
            >
              <animate
                attributeName="stroke-width"
                values="1.2;1.6;1.2"
                dur="4.9s"
                repeatCount="indefinite"
              />
            </path>
          </g>

          <!-- Enhanced Pulse Rings -->
          <circle
            cx="400"
            cy="248"
            r="60"
            fill="none"
            stroke="#FF9D2A"
            stroke-width="1"
            opacity="0"
          >
            <animate
              attributeName="r"
              values="35;150;35"
              dur="4s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0.7;0;0.7"
              dur="4s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="stroke-width"
              values="1;0.5;1"
              dur="4s"
              repeatCount="indefinite"
            />
          </circle>

          <circle
            cx="400"
            cy="248"
            r="60"
            fill="none"
            stroke="#4E7DF7"
            stroke-width="1"
            opacity="0"
          >
            <animate
              attributeName="r"
              values="35;130;35"
              dur="5s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0.7;0;0.7"
              dur="5s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="stroke-width"
              values="1;0.5;1"
              dur="5s"
              repeatCount="indefinite"
            />
          </circle>

          <!-- Additional tech particles -->
          <g opacity="0.5">
            <circle cx="300" cy="99" r="1.5" fill="#4E7DF7">
              <animate
                attributeName="cy"
                values="99;109;99"
                dur="5s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="cx"
                values="300;310;300"
                dur="5s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0.5;0.8;0.5"
                dur="5s"
                repeatCount="indefinite"
              />
            </circle>
            <circle cx="500" cy="99" r="1.5" fill="#4E7DF7">
              <animate
                attributeName="cy"
                values="99;89;99"
                dur="6s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="cx"
                values="500;490;500"
                dur="6s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0.5;0.8;0.5"
                dur="6s"
                repeatCount="indefinite"
              />
            </circle>
            <circle cx="350" cy="391" r="1.5" fill="#4E7DF7">
              <animate
                attributeName="cy"
                values="391;401;391"
                dur="7s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="cx"
                values="350;360;350"
                dur="7s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0.5;0.8;0.5"
                dur="7s"
                repeatCount="indefinite"
              />
            </circle>
            <circle cx="450" cy="391" r="1.5" fill="#4E7DF7">
              <animate
                attributeName="cy"
                values="391;381;391"
                dur="4s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="cx"
                values="450;440;450"
                dur="4s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0.5;0.8;0.5"
                dur="4s"
                repeatCount="indefinite"
              />
            </circle>
          </g>
          <g
            id="empty-map-button"
            transform="translate(400, 445)"
            class="svg-button"
            @click="createAndOpenMap"
          >
            <!-- 배경 -->
            <rect
              x="-70"
              y="-16"
              width="140"
              height="32"
              rx="16"
              ry="16"
              class="btn-bg"
            />

            <!-- 테두리 -->
            <rect
              x="-70"
              y="-16"
              width="140"
              height="32"
              rx="16"
              ry="16"
              class="btn-border"
            />

            <!-- 텍스트 -->
            <text
              x="0"
              y="5"
              font-family="Arial, sans-serif"
              font-size="13"
              class="btn-text"
              text-anchor="middle"
            >
              프로젝트 생성
            </text>
          </g>
        </svg>
      </div>
    </main>
  </div>
</template>

<script>
import { onMounted } from "vue";
import MainHomeSideBar from "./MainHomeSideBar.vue";
import { connectSocket } from "../socket/socket";
import { createProject } from "../../api/projectApi";
import { useRouter } from "vue-router";

export default {
  name: "MyMap",
  components: {
    MainHomeSideBar,
  },
  setup() {
    const router = useRouter();

    // 세션에서 userId 가져오기
    const userId = sessionStorage.getItem("userId");

    const createAndOpenMap = async () => {
      try {
        if (!userId) {
          console.error("❌ 사용자 ID가 없습니다.");
          return;
        }

        const newProject = await createProject(userId);

        if (newProject && newProject.project_id) {
          console.log("🟢 새 프로젝트 생성 완료:", newProject.project_id);
          router.push(`/MindMap/${newProject.project_id}`);
        }
      } catch (error) {
        console.error("❌ 프로젝트 생성 중 오류 발생:", error);
      }
    };

    onMounted(() => {
      connectSocket(() => {
        console.log("소켓 연결 완료");
      });
    });

    return {
      createAndOpenMap,
    };
  },
  mounted() {
    // 페이지 로드 시 소켓 연결
    connectSocket(() => {
      console.log("소켓 연결 완료");
    });
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
}

.svg-container {
  margin: -40px; /* MainHomeSideBar의 padding을 상쇄 */
  width: calc(100% + 40px); /* 너비를 padding만큼 확장 */
  overflow: hidden; /* 필요한 경우 오버플로우 방지 */
}

/* SVG 버튼 공통 스타일 */
.svg-button {
  cursor: pointer;
  transition: all 0.3s ease;
}

/* 기본 상태 */
.btn-bg {
  fill: #000000;
  opacity: 0.2;
  transition: all 0.3s ease;
}

.btn-border {
  fill: none;
  stroke: #ffffff;
  stroke-width: 1.5;
  transition: all 0.3s ease;
}

.btn-text {
  fill: #ffffff;
  transition: all 0.3s ease;
}

/* 호버 상태 */
.svg-button:hover .btn-bg {
  fill: #ffffff;
  opacity: 1;
}

.svg-button:hover .btn-text {
  fill: rgb(56, 72, 177); /* 진한 파란 계열 */
}
</style>
