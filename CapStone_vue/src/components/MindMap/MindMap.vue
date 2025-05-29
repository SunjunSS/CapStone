--3D모드 성공/디자인 수정 필요/Three.js/2D로 다시 전환 성공/텍스트 삽입
성공/노드 동적 길이 변경/둥근모서리/직각 간선/노드 겹치기X/3D모드 캡처/3D모드
요소 클릭 회전/3D모드 실시간 반영(추가/삭제/편집/이동)/isSelected
비활성화/간격설정/간선 두께 증가/줄바꿈을 통한 노드길이 증가/버튼 디자인 수정
/로그 오류 수정/검정 테두리 오류 수정--

<template>
  <div class="app-container">
    <!-- Sidebar for WebRTC -->
    <div class="sidebar" :class="{ 'sidebar-collapsed': !sidebarOpen }">
      <div class="sidebar-toggle" @click="toggleSidebar">
        {{ sidebarOpen ? "◀" : "▶" }}
      </div>
      <div class="sidebar-content" v-show="sidebarOpen">
        <WebRTC :autoJoinRoomId="autoJoinRoomId" />
      </div>
    </div>

    <!-- Main MindMap Content -->
    <div class="main-content" :class="{ 'main-expanded': !sidebarOpen }">
      <mouseTracking
        :roomId="roomId"
        :userId="userId"
        :is3DMode="is3DMode"
        class="mouse-tracking-layer"
      />

      <div
        v-if="isToastVisible"
        class="toast-message"
        :class="{ 'toast-error': isToastError }"
      >
        {{ toastMessage }}
      </div>

      <div
        class="mindmap-wrapper"
        @mousedown="startDrag"
        @mouseup="stopDrag"
        @mousemove="dragMove"
        @mouseleave="stopDrag"
        @touchstart="startTouch"
        @touchmove="touchMove"
        @touchend="stopTouch"
      >
        <!-- 더 명확한 ref 지정 -->
        <div class="mindmap-container" ref="mindmapContainer">
          <!-- 2D 마인드맵 (GoJS용) -->
          <div ref="diagramDiv" class="mindmap-content" v-if="!is3DMode"></div>

          <!-- 3D 마인드맵 (Three.js용) -->
          <div
            v-if="is3DMode"
            class="three-container"
            ref="threeCanvasRef"
          ></div>
        </div>

        <div class="zoom-controls" v-show="!is3DMode">
          <button @click="decreaseZoom" class="zoom-btn">-</button>
          <span class="zoom-level">{{ Math.round(currentZoom * 100) }}%</span>
          <button @click="increaseZoom" class="zoom-btn">+</button>
        </div>

        <div class="fab-toolbar" @keydown="handleKeyDown">
          <!-- 하위 노드 추가 -->
          <button
            class="fab"
            @click="addNode(false)"
            :disabled="!selectedNode || isViewer"
            data-tooltip="하위레벨 추가"
          >
            <i class="fa-solid fa-down-long"></i>
          </button>

          <!-- 동일 레벨 노드 추가 -->
          <button
            class="fab"
            @click="addNode(true)"
            :disabled="!canAddSibling || isViewer"
            data-tooltip="동일레벨 추가"
          >
            <i class="fa-solid fa-right-long"></i>
          </button>

          <!-- 마인드맵 캡처 -->
          <button
            class="fab"
            @click="captureMindmap"
            :disabled="isViewer"
            data-tooltip="마인드맵 캡처"
          >
            <i class="fas fa-camera"></i>
          </button>

          <!-- 그림판 이동 -->
          <button
            class="fab"
            @click="goToDrawing"
            :disabled="isViewer"
            data-tooltip="그림판"
          >
            <i class="fas fa-paint-brush"></i>
          </button>

          <!-- AI 추천 노드 추가 -->
          <button
            class="fab"
            @click="suggestNodes"
            :disabled="!selectedNode || isViewer"
            data-tooltip="AI 추천"
          >
            <i class="fa-solid fa-robot"></i>
          </button>

          <!-- 주제 추천 버튼 추가 -->
          <button
            class="fab"
            @click="openTopicSuggestionModal"
            :disabled="isViewer"
            data-tooltip="주제 추천"
          >
            <i class="fa-solid fa-lightbulb"></i>
          </button>

          <!-- 팀원 초대 -->
          <button
            class="fab"
            @click="openInviteModal"
            :disabled="isViewer"
            data-tooltip="팀원 초대"
          >
            <i class="fas fa-user-plus"></i>
          </button>

          <!-- 🔁 2D/3D 전환 -->
          <button
            class="fab"
            @click="toggleViewMode"
            :data-tooltip="is3DMode ? '2D 모드' : '3D 모드'"
          >
            <i
              :class="
                is3DMode ? 'fa-solid fa-diagram-project' : 'fa-solid fa-sitemap'
              "
            ></i>
          </button>

          <!-- 🗑️ 노드 삭제 -->
          <button
            class="fab"
            @click="deleteSelectedNode"
            :disabled="!selectedNode || selectedNode.parent === 0 || isViewer"
            data-tooltip="노드 삭제"
          >
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- 🔹 팀원 초대 모달 -->
  <teleport to="body">
    <div
      v-if="isInviteModalOpen"
      class="modal-overlay"
      @click="closeInviteModal"
    >
      <div class="modal-content" @click.stop>
        <h2>{{ rootNodeName }} 공유하기</h2>

        <label for="invite-email">초대할 이메일</label>
        <input
          type="email"
          id="invite-email"
          v-model="inviteEmail"
          placeholder="팀원이나 그룹 추가"
        />

        <label for="invite-role">역할 선택</label>
        <select id="invite-role" v-model="selectedRole">
          <option value="viewer">뷰어</option>
          <option value="editor">편집자</option>
        </select>

        <div v-if="invitedMembers.length > 0" class="invited-list">
          <h3>참여자</h3>
          <div class="member-card-container">
            <div
              class="member-card"
              v-for="member in invitedMembers"
              :key="member.user_id"
            >
              <div class="member-info">
                <div class="member-email">{{ member.email }}</div>
                <div class="member-name-section">
                  <div class="member-name">
                    {{ member.name || "닉네임 없음" }}
                  </div>
                  <button
                    v-if="invitedMembers.indexOf(member) !== 0"
                    @click="confirmDeleteMember(member)"
                    class="delete-member-btn"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <button
                class="member-role"
                :class="{
                  viewer: member.isAdmin === 2,
                  editor: member.isAdmin === 3 || member.isAdmin === 4,
                }"
                @click="updateRole(member)"
              >
                {{ member.isAdmin === 2 ? "뷰어" : "편집자" }}
              </button>
            </div>
          </div>
        </div>

        <div class="modal-buttons">
          <button @click="sendInvite" class="confirm-btn">초대</button>
          <button @click="closeInviteModal" class="cancel-btn">취소</button>
        </div>
      </div>
    </div>
  </teleport>

  <!-- 베스트 아이디어 모달 템플릿 업데이트 -->
  <teleport to="body">
    <div
      v-if="isTopicSuggestionModalOpen"
      class="modal-overlay"
      @click="closeTopicSuggestionModal"
    >
      <div class="modal-content topic-suggestion-modal" @click.stop>
        <h2>AI 주제 추천</h2>

        <!-- 🔹 모달 내부 탭 버튼들 -->
        <div
          v-if="!isLoadingSuggestions && !isLoadingHistory"
          class="tab-buttons"
        >
          <button
            class="tab-button"
            :class="{ active: activeTab === 'suggestions' }"
            @click="switchTab('suggestions')"
          >
            <i class="fas fa-lightbulb"></i>
            추천 주제
          </button>
          <button
            class="tab-button"
            :class="{ active: activeTab === 'history' }"
            @click="switchTab('history')"
          >
            <i class="fas fa-history"></i>
            추천 내역
          </button>
        </div>

        <!-- 🔹 추천 주제 탭 (기본값, 기존 UI와 동일) -->
        <div v-if="activeTab === 'suggestions'">
          <!-- 로딩 UI -->
          <div v-if="isLoadingSuggestions" class="loading-container">
            <DotLottieVue
              style="height: 200px; width: 200px"
              autoplay
              loop
              speed="1.35"
              src="https://lottie.host/6cc178d1-178b-4eed-965b-82a9c785e2c3/EHSYp75X9Z.lottie"
            />
            <p class="loading-text">최적의 아이디어를 불러오는 중...</p>
          </div>

          <!-- 아이디어 목록 (기존과 동일) -->
          <div v-else class="topic-suggestion-list">
            <ol v-if="suggestedTopics.length > 0">
              <li v-for="(topic, index) in suggestedTopics" :key="index">
                <span class="topic-text">{{ topic }}</span>
              </li>
            </ol>
            <div v-else class="empty-state">
              <p>현재 프로젝트에 등록된 AI추천 아이디어가 없습니다.</p>
              <p class="empty-hint">
                아이디어를 추가하려면 프로젝트 관리자에게 문의하세요.
              </p>
            </div>
          </div>
        </div>

        <!-- 🔹 추천 내역 탭 -->
        <div v-if="activeTab === 'history'">
          <!-- 로딩 UI -->
          <div v-if="isLoadingHistory" class="loading-container">
            <DotLottieVue
              style="height: 150px; width: 150px"
              autoplay
              loop
              speed="1.3"
              src="https://lottie.host/6cc178d1-178b-4eed-965b-82a9c785e2c3/EHSYp75X9Z.lottie"
            />
            <p class="loading-text">추천 내역을을 불러오는 중...</p>
          </div>

          <!-- 추천 내역 목록 (기존 UI 스타일과 동일) -->
          <div v-else class="topic-suggestion-list">
            <ol v-if="historyItems.length > 0">
              <li
                v-for="(item, index) in historyItems"
                :key="index"
                @click="confirmDeleteHistoryItem(item.id, index)"
              >
                <span class="topic-text">{{ item.action }}</span>
              </li>
            </ol>
            <div v-else class="empty-state">
              <p>아직 기록된 추천 내역이 없습니다.</p>
              <p class="empty-hint">
                마인드맵을 편집하면 추적 내역이 쌓입니다.
              </p>
            </div>
          </div>
        </div>

        <div class="modal-buttons">
          <button @click="closeTopicSuggestionModal" class="cancel-btn">
            닫기
          </button>
        </div>
      </div>
    </div>
  </teleport>

  <!-- AI 추천 애니메이션 (애니메이션만) -->
  <teleport to="body">
    <div v-if="isAIRecommending" class="ai-simple-overlay">
      <DotLottieVue
        style="height: 250px; width: 250px"
        autoplay
        loop
        src="https://lottie.host/99da1633-7470-45ae-8f4d-23978dae3090/xJZFhGVtnf.lottie"
      />
    </div>
  </teleport>
</template>

<script>
import {
  ref,
  onMounted,
  onBeforeUnmount,
  computed,
  watchEffect,
  nextTick,
  watch,
} from "vue";
import WebRTC from "..//WebRTC/WebRTC.vue";
import mouseTracking from "../WebRTC/mouseTracking.vue";
import * as go from "gojs";
import html2canvas from "html2canvas";
import * as THREE from "three";
import {
  CSS3DRenderer,
  CSS3DObject,
} from "three/addons/renderers/CSS3DRenderer.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {
  loadMindmapFromServer,
  serverError,
  saveMindmapToServer,
  deleteMindmapNodes,
  updateMindmapNode,
  suggestChildNodes,
} from "@/api/nodeApi";
import { socket } from "../socket/socket.js"; // ✅ 전역 소켓 사용
import { useRoute, useRouter } from "vue-router"; // ✅ useRoute 추가
import {
  registerSocketHandlers,
  unregisterSocketHandlers,
} from "../socket/nodeSocket.js"; // ✅ WebSocket 핸들러 모듈 import
import {
  addUserToProject,
  getProjectMembers,
  updateUserRole,
  removeUserFromProject,
} from "@/api/projectApi";
import bestIdeaApi from "@/api/bestIdeaApi"; // 파일 상단에 import 추가
import { DotLottieVue } from "@lottiefiles/dotlottie-vue";

export default {
  components: {
    WebRTC,
    mouseTracking,
    DotLottieVue,
  },
  setup() {
    // mouseTracking과 관련됨
    const mindmapContainer = ref(null);

    // mindmap의 영역 정보를 반환하는 함수
    const getMindmapBounds = () => {
      if (mindmapContainer.value) {
        const bounds = mindmapContainer.value.getBoundingClientRect();
        return {
          left: bounds.left,
          top: bounds.top,
          width: bounds.width,
          height: bounds.height,
        };
      }
      return { left: 0, top: 0, width: 1, height: 1 }; // 기본값
    };

    const diagramDiv = ref(null);
    let myDiagram = null;
    const currentZoom = ref(1);
    const selectedNode = ref(null);
    const MIN_ZOOM = 0.2;
    const MAX_ZOOM = 2;
    const ZOOM_STEP = 0.1;
    const ZOOM_BUTTON_STEP = 0.2;
    const ANIMATION_DURATION = 300;
    const PAN_ANIMATION_DURATION = 100;
    const isViewer = ref(false);
    const currentUserEmail = ref("");
    const invitedMembers = ref([]);

    const isDragging = ref(false);
    const isNodeDragging = ref(false);
    const lastMousePosition = ref({ x: 0, y: 0 });
    const lastTouchPosition = ref({ x: 0, y: 0 });
    const touchStartTime = ref(0);
    const initialTouchDistance = ref(0);
    let zoomAnimationFrame = null;
    let panAnimationFrame = null;
    let targetPosition = null;
    const aiParentNode = ref(null); // AI 추천 노드의 부모 노드 저장 변수

    const is3DMode = ref(false);
    let threeRenderer = null;
    let threeScene = null;
    let threeCamera = null;
    let threeRoot = null;
    let animationFrameId = null;
    const threeCanvasRef = ref(null);
    let cssRenderer = null;
    let cssScene = null;
    let orbitControls = null;

    // 서버 통신 관련 상태 추가
    const isSaving = ref(false);
    const lastSaveTime = ref(null);
    const serverError = ref(null);

    const addedNodes = ref([]); // 새로 추가된 노드 저장

    const sidebarOpen = ref(false);

    // 현재 편집 중인 노드와 입력 필드를 추적하기 위한 refs
    const activeEditNode = ref(null);
    const activeInputField = ref(null);

    const isInviteModalOpen = ref(false);
    const inviteEmail = ref("");
    const selectedRole = ref("viewer");
    const rootNodeName = ref("마인드맵"); // 루트 노드 이름 저장

    // 주제 추천 모달 관련 상태 변수
    const isTopicSuggestionModalOpen = ref(false);
    const isLoadingSuggestions = ref(false); // 이 줄을 추가
    const suggestedTopics = ref([]);
    const activeTab = ref("history"); // 기본값: 추천 주제
    const isLoadingHistory = ref(false);
    const historyItems = ref([]);
    const isAIRecommending = ref(false);

    // 기존 setConnectedLinksTransparency 함수를 개선된 버전으로 교체

    const setConnectedLinksTransparency = (node, opacity) => {
      if (!node || !myDiagram) {
        console.warn("❌ node 또는 myDiagram이 없습니다");
        return;
      }

      console.log(
        `🎨 노드 "${node.data.name}"의 간선 투명도를 ${opacity}로 설정 시작`
      );

      // 해당 노드와 연결된 모든 간선 찾기
      const connectedLinks = [];
      const nodeKey = node.data.key;

      // 1. 노드에서 나가는 간선들 (이 노드가 from인 경우)
      node.findLinksOutOf().each((link) => {
        connectedLinks.push(link);
        console.log(`🔗 나가는 간선 발견: ${link.data.from} → ${link.data.to}`);
      });

      // 2. 노드로 들어오는 간선들 (이 노드가 to인 경우)
      node.findLinksInto().each((link) => {
        connectedLinks.push(link);
        console.log(
          `🔗 들어오는 간선 발견: ${link.data.from} → ${link.data.to}`
        );
      });

      if (connectedLinks.length === 0) {
        console.log(`ℹ️ 노드 "${node.data.name}"에 연결된 간선이 없습니다`);
        return;
      }

      // 트랜잭션 시작
      myDiagram.startTransaction("set link transparency");

      let successCount = 0;
      connectedLinks.forEach((link, index) => {
        try {
          // Shape 객체 찾기 (여러 방법 시도)
          let shape = link.findObject("LINK_SHAPE"); // 이름으로 찾기

          if (!shape) {
            // 이름으로 못 찾으면 첫 번째 Shape 객체 찾기
            shape = link.findObject(go.Shape);
          }

          if (!shape) {
            // 그래도 못 찾으면 링크의 모든 요소에서 Shape 찾기
            link.elements.each((element) => {
              if (element instanceof go.Shape && !shape) {
                shape = element;
              }
            });
          }

          if (shape) {
            shape.opacity = opacity;
            successCount++;
            console.log(`✅ 간선 ${index + 1} 투명도 설정 성공: ${opacity}`);
          } else {
            console.warn(`❌ 간선 ${index + 1}의 Shape 객체를 찾을 수 없음`);
          }
        } catch (error) {
          console.error(`❌ 간선 ${index + 1} 투명도 설정 실패:`, error);
        }
      });

      myDiagram.commitTransaction("set link transparency");

      console.log(
        `🎨 완료: ${connectedLinks.length}개 간선 중 ${successCount}개 투명도 설정됨`
      );
    };

    // 🔹 주제 추천 모달 열기 (수정된 함수)
    const openTopicSuggestionModal = async () => {
      try {
        // 모달 먼저 열기 (추천 내역 탭으로)
        isTopicSuggestionModalOpen.value = true;
        activeTab.value = "history"; // 추천 내역 탭을 기본으로 설정

        // 🔹 첫 로드만 실행 (중복 방지)
        if (historyItems.value.length === 0) {
          await loadHistory();
        }
      } catch (error) {
        console.error("❌ 모달 열기 실패:", error);
        showToast("모달을 열 수 없습니다.", true);
      }
    };

    // 🔹 탭 전환 함수 (수정된 버전) - 중복 실행 방지
    const switchTab = async (tabName) => {
      // 이미 같은 탭이 활성화되어 있으면 아무것도 하지 않음
      if (activeTab.value === tabName) {
        console.log(`⏭️ 이미 ${tabName} 탭이 활성화되어 있음 - 중복 실행 생략`);
        return;
      }

      activeTab.value = tabName;

      if (tabName === "suggestions") {
        // 🔹 "추천 주제" 탭으로 전환할 때마다 새로운 추천 요청
        await loadSuggestions();
      } else if (tabName === "history") {
        await loadHistory();
      }
    };

    // 🔹 새로 추가: 주제 추천 로드 함수 (중복 실행 방지 로직 추가)
    const loadSuggestions = async () => {
      if (isLoadingSuggestions.value) {
        console.log("⏳ 이미 추천 아이디어 로딩 중 - 중복 실행 생략");
        return;
      }

      try {
        showToast("최적의 아이디어를 분석 중입니다...");
        isLoadingSuggestions.value = true;
        suggestedTopics.value = [];

        const allIdeas = await bestIdeaApi.generateAndSaveBestIdeas(
          paramProject_id.value
        );

        if (allIdeas && allIdeas.length > 0) {
          suggestedTopics.value = allIdeas.map((idea) => idea.title);
          showToast("최적의 아이디어 분석이 완료되었습니다!");
        } else {
          suggestedTopics.value = [
            "마인드맵에 충분한 노드가 없어 최적의 아이디어를 생성할 수 없습니다.",
            "더 많은 아이디어를 마인드맵에 추가한 후 다시 시도해주세요.",
          ];
          showToast(
            "마인드맵에 노드가 부족합니다. 더 많은 아이디어를 추가해보세요.",
            true
          );
        }
      } catch (error) {
        console.error("❌ 최적의 아이디어 분석 실패:", error);
        suggestedTopics.value = [
          "최적의 아이디어 분석 중 문제가 발생했습니다.",
          "잠시 후 다시 시도해주세요.",
        ];
        showToast("최적의 아이디어 분석 중 문제가 발생했습니다.", true);
      } finally {
        isLoadingSuggestions.value = false;
      }
    };

    // 🔹 추천 내역 로드 함수 (중복 실행 방지 로직 추가)
    const loadHistory = async () => {
      if (isLoadingHistory.value) {
        console.log("⏳ 이미 추천 내역 로딩 중 - 중복 실행 생략");
        return;
      }

      try {
        showToast("추천 내역을 조회 중입니다...");
        isLoadingHistory.value = true;

        const bestIdeas = await bestIdeaApi.getBestIdeasByProjectId(
          paramProject_id.value
        );

        if (bestIdeas && bestIdeas.length > 0) {
          historyItems.value = bestIdeas.map((idea) => ({
            action: idea.title,
            id: idea.id,
            createdAt: idea.createdAt,
            project_id: idea.project_id,
          }));
          showToast("추천 내역 조회가 완료되었습니다!");
        } else {
          // ✅ 추천 내역이 없으면 자동 추천 생성 + 탭 전환
          showToast("추천 내역이 없어 AI 추천을 요청합니다...");
          activeTab.value = "suggestions"; // 자동 탭 전환 (중복 호출 방지됨)

          await loadSuggestions(); // 중복 요청 방지 로직 포함된 함수
        }
      } catch (error) {
        console.error("❌ 추천 내역 로드 실패:", error);
        historyItems.value = [];
        showToast("추천 내역을 불러오는데 실패했습니다.", true);
      } finally {
        isLoadingHistory.value = false;
      }
    };

    const confirmDeleteHistoryItem = async (id, index) => {
      const confirmed = confirm("삭제하시겠습니까?");
      if (!confirmed) return;

      try {
        await bestIdeaApi.deleteBestIdea(id);
        historyItems.value.splice(index, 1);
        showToast("추천 내역이 삭제되었습니다.");
      } catch (error) {
        console.error("❌ 삭제 실패:", error);
        showToast("추천 내역 삭제에 실패했습니다.", true);
      }
    };

    // 주제 추천 모달 닫기 (기존과 동일)
    const closeTopicSuggestionModal = () => {
      isTopicSuggestionModalOpen.value = false;

      // 🔹 모달을 닫을 때 항상 "추천 내역" 탭으로 초기화
      activeTab.value = "history";
    };

    // 1. Three.js 디버그 로깅 강화
    const initThree = () => {
      console.log("✅ initThree 진입");

      // DOM 참조 확인
      if (!threeCanvasRef.value) {
        console.error("❌ threeCanvasRef가 없습니다 - 강제 재시도");
        threeCanvasRef.value = document.querySelector(".three-container");

        if (!threeCanvasRef.value) {
          console.error("❌ 3D 컨테이너를 찾을 수 없음 - 초기화 중단");
          is3DMode.value = false;
          showToast("3D 모드를 초기화할 수 없습니다.", true);
          return;
        }
      }

      try {
        // 씬(Scene) 생성 및 배경 설정
        threeScene = new THREE.Scene();
        threeScene.background = new THREE.Color(0xfafafa);
        console.log("🌍 씬 생성 완료");

        // 컨테이너 크기 설정
        const width =
          threeCanvasRef.value.clientWidth ||
          threeCanvasRef.value.offsetWidth ||
          800;
        const height =
          threeCanvasRef.value.clientHeight ||
          threeCanvasRef.value.offsetHeight ||
          600;

        console.log("📏 컨테이너 크기:", width, height);

        // 입체적인 시각화를 위한 카메라 설정 (화각 및 위치 수정)
        threeCamera = new THREE.PerspectiveCamera(
          60, // 시야각을 넓게 하여 더 입체적으로 보이게 함
          width / height,
          0.1,
          5000 // 더 넓은 영역을 볼 수 있게 far 거리 확대
        );
        threeCamera.position.set(0, 200, 800); // Y축을 높여 마인드맵을 위에서 내려다보는 각도 설정
        threeCamera.lookAt(0, 0, 0);
        console.log("📷 카메라 설정 완료");

        // WebGL 렌더러 초기화 및 크기 설정
        threeRenderer = new THREE.WebGLRenderer({ antialias: true });
        threeRenderer.setPixelRatio(window.devicePixelRatio); // 고해상도 대응
        threeRenderer.setSize(width, height);
        threeRenderer.shadowMap.enabled = true; // 그림자 활성화

        // 기존 내용 정리 및 렌더러 캔버스 추가
        threeCanvasRef.value.innerHTML = "";
        threeCanvasRef.value.appendChild(threeRenderer.domElement);
        console.log("🎨 WebGL 렌더러 설정 완료");

        // CSS3D 렌더러 초기화 (텍스트 등의 HTML 기반 객체 표현용)
        cssRenderer = new CSS3DRenderer();
        cssRenderer.setSize(width, height);
        cssRenderer.domElement.style.position = "absolute";
        cssRenderer.domElement.style.top = "0";
        cssRenderer.domElement.style.pointerEvents = "none";
        threeCanvasRef.value.appendChild(cssRenderer.domElement);
        console.log("📜 CSS3D 렌더러 설정 완료");

        // CSS3D 씬 생성
        cssScene = new THREE.Scene();

        // 기본 조명 설정 (입체감 강조용)
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        threeScene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(0, 500, 500);
        directionalLight.castShadow = true;
        threeScene.add(directionalLight);
        console.log("💡 조명 설정 완료");

        // 루트 노드 그룹 생성 및 추가
        threeRoot = new THREE.Group();
        threeScene.add(threeRoot);
        console.log("🌳 루트 그룹 생성 완료");

        // OrbitControls 초기화 - 추가된 부분
        orbitControls = new OrbitControls(
          threeCamera,
          threeRenderer.domElement
        );

        // 컨트롤 설정 최적화
        orbitControls.enableDamping = true; // 부드러운 애니메이션
        orbitControls.dampingFactor = 0.05; // 감쇠 계수

        // 이동 제한 설정
        orbitControls.minDistance = 100; // 최소 줌 거리
        orbitControls.maxDistance = 2000; // 최대 줌 거리

        // 회전 제한 설정
        orbitControls.minPolarAngle = Math.PI * 0.1; // 최소 수직 각도
        orbitControls.maxPolarAngle = Math.PI * 0.9; // 최대 수직 각도

        // 자동 회전 기능 제어
        orbitControls.autoRotate = true; // 자동 회전 활성화
        orbitControls.autoRotateSpeed = 2.2; // 회전 속도 (기본보다 느리게)

        // 카메라가 물체 주변을 공전하게 설정
        orbitControls.target.set(0, 0, 0);

        console.log("🎮 OrbitControls 초기화 완료");

        // 마인드맵 노드 최초 렌더링
        renderThreeMindmap();
        console.log("🌐 3D 마인드맵 렌더링 호출 완료");

        // 애니메이션 루프 시작 (수정된 애니메이션 함수 사용)
        animateThree();
        console.log("🎬 Three.js 초기화 완료");
      } catch (error) {
        console.error("❌ Three.js 초기화 중 에러 발생:", error);
        is3DMode.value = false;
        showToast("3D 모드를 초기화하는 중 오류가 발생했습니다.", true);
      }
    };

    function createRoundedRectShape(width, height, radius) {
      const shape = new THREE.Shape();
      const x = -width / 2;
      const y = -height / 2;

      shape.moveTo(x + radius, y);
      shape.lineTo(x + width - radius, y);
      shape.quadraticCurveTo(x + width, y, x + width, y + radius);
      shape.lineTo(x + width, y + height - radius);
      shape.quadraticCurveTo(
        x + width,
        y + height,
        x + width - radius,
        y + height
      );
      shape.lineTo(x + radius, y + height);
      shape.quadraticCurveTo(x, y + height, x, y + height - radius);
      shape.lineTo(x, y + radius);
      shape.quadraticCurveTo(x, y, x + radius, y);
      return shape;
    }

    // 3. renderThreeMindmap 함수 개선
    const renderThreeMindmap = () => {
      console.log("✅ [renderThreeMindmap] 함수 진입");

      if (!myDiagram || !threeScene || !threeRoot) {
        console.warn("[WARN] ❌ 필수 요소 없음:", {
          myDiagram: !!myDiagram,
          threeScene: !!threeScene,
          threeRoot: !!threeRoot,
        });
        return;
      }

      try {
        const nodes = myDiagram.model.nodeDataArray;
        console.log("[DEBUG] 🧠 노드 데이터:", nodes);

        if (!nodes || nodes.length === 0) {
          console.warn("[WARN] ❌ 노드 데이터가 비어있습니다");
          return;
        }

        const root = nodes.find((n) => !n.parent || n.parent === 0);
        if (!root) {
          console.warn("[WARN] ❌ 루트 노드가 존재하지 않음");
          return;
        }

        // 그룹 클리어
        console.log(
          "[DEBUG] 🧹 기존 노드 초기화 전 children 수:",
          threeRoot.children.length
        );
        while (threeRoot.children.length > 0) {
          threeRoot.remove(threeRoot.children[0]);
        }
        console.log(
          "[DEBUG] 🧹 초기화 후 children 수:",
          threeRoot.children.length
        );

        // 노드 매핑
        const nodeMap = new Map();
        let nodeCounter = 0;

        // 노드 그리기 함수
        // 🔷 Rounded Rectangle Shape 생성 함수
        function createRoundedRectShape(width, height, radius) {
          const shape = new THREE.Shape();
          const x = -width / 2;
          const y = -height / 2;

          shape.moveTo(x + radius, y);
          shape.lineTo(x + width - radius, y);
          shape.quadraticCurveTo(x + width, y, x + width, y + radius);
          shape.lineTo(x + width, y + height - radius);
          shape.quadraticCurveTo(
            x + width,
            y + height,
            x + width - radius,
            y + height
          );
          shape.lineTo(x + radius, y + height);
          shape.quadraticCurveTo(x, y + height, x, y + height - radius);
          shape.lineTo(x, y + radius);
          shape.quadraticCurveTo(x, y, x + radius, y);
          return shape;
        }

        // 텍스트 길이를 고려한 개선된 getSubtreeWidth 함수
        const getSubtreeWidth = (nodeKey, nodes, baseSpacing = 140) => {
          if (!nodeKey) return baseSpacing;

          // 현재 노드 찾기
          const currentNode = nodes.find((n) => n.key === nodeKey);

          // 텍스트 길이에 따른 추가 간격 계산 (텍스트가 길수록 더 넓은 간격)
          let textLengthFactor = 0;
          if (currentNode && currentNode.name) {
            // 텍스트 길이가 10자를 초과할 때마다 간격 증가
            textLengthFactor =
              Math.max(0, (currentNode.name.length - 10) / 2) * 33;
          }

          const children = nodes.filter((n) => n.parent === nodeKey);
          if (children.length === 0) {
            // 자식이 없는 노드는 기본 간격 + 텍스트 길이 기반 추가 간격 적용
            return baseSpacing + textLengthFactor;
          }

          // 자식 노드들의 너비 합계 계산
          const widths = children.map((child) => {
            if (!child || !child.key) return baseSpacing;
            return getSubtreeWidth(child.key, nodes, baseSpacing);
          });

          // 자식 노드들의 너비 합계와 텍스트 길이 기반 추가 간격 중 큰 값 사용
          const subtreeWidth = widths.reduce((sum, w) => sum + w, 0);
          return Math.max(subtreeWidth, baseSpacing + textLengthFactor);
        };

        const drawNode = (
          node,
          parentGroup,
          depth = 0,
          index = 0,
          total = 1
        ) => {
          nodeCounter++;
          const group = new THREE.Group();

          // 텍스트 및 줄바꿈 처리
          const measureCanvas = document.createElement("canvas");
          const measureCtx = measureCanvas.getContext("2d");
          const fontSize = node.parent === 0 ? 40 : 27;
          measureCtx.font = `bold ${fontSize}px Arial`;

          const text = node.name || "새 노드";
          const isRootNode = node.parent === 0;
          const isDefaultText = text === "새 노드";
          const lines = isRootNode || isDefaultText ? [text] : text.split(" ");

          const maxLineWidth = Math.max(
            ...lines.map((line) => measureCtx.measureText(line).width)
          );
          const padding = isRootNode ? 30 : 20;
          const minNodeWidth = isRootNode ? 120 : 80;
          const nodeWidth = Math.max(
            maxLineWidth * 0.85 + padding,
            minNodeWidth
          );
          const lineHeight = fontSize + 5;
          const nodeHeight =
            (isRootNode ? 50 : 40) + (lines.length - 1) * lineHeight;

          const shape = createRoundedRectShape(nodeWidth, nodeHeight, 17);
          const geometry = new THREE.ExtrudeGeometry(shape, {
            depth: 17,
            bevelEnabled: false,
          });

          const material = new THREE.MeshBasicMaterial({
            color: node.isSuggested
              ? 0xe040fb
              : isRootNode
              ? 0xffa500
              : 0x1e90ff,
            transparent: true,
            opacity: 1.0,
          });

          const mesh = new THREE.Mesh(geometry, material);
          mesh.position.set(0, -nodeHeight / 2, -8.5); // ✅ 상단 기준으로 정렬
          group.add(mesh);

          // 텍스트 캔버스 렌더링
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          canvas.width = nodeWidth * 2;
          canvas.height = nodeHeight * 2;
          ctx.fillStyle = "rgba(0, 0, 0, 0)";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.font = `bold ${fontSize}px Arial`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillStyle = "#ffffff";

          const totalTextHeight = lines.length * lineHeight;
          lines.forEach((line, i) => {
            ctx.fillText(
              line,
              canvas.width / 2,
              canvas.height / 2 -
                totalTextHeight / 2 +
                i * lineHeight +
                lineHeight / 2
            );
          });

          const texture = new THREE.CanvasTexture(canvas);
          const textMaterial = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            side: THREE.DoubleSide,
          });

          const textPlane = new THREE.PlaneGeometry(nodeWidth, nodeHeight);
          const frontText = new THREE.Mesh(textPlane, textMaterial);
          frontText.position.set(0, -nodeHeight / 2, 8.5 + 0.5); // ✅ 상단 기준
          group.add(frontText);

          const backText = frontText.clone();
          backText.position.set(0, -nodeHeight / 2, -(8.5 + 0.5));
          backText.rotation.y = Math.PI;
          group.add(backText);

          // 노드 위치 계산
          let x = 0,
            y = 0;

          if (parentGroup) {
            // 부모 노드에 따른 동적 간격 계산 로직 추가
            let spacingY = 100; // 기본 간격
            const parentNodeData = nodes.find((n) => n.key === node.parent);

            if (parentNodeData) {
              const parentText = parentNodeData.name || "새 노드";
              const parentIsRoot = parentNodeData.parent === 0;
              const parentIsDefaultText = parentText === "새 노드";
              const parentLines =
                parentIsRoot || parentIsDefaultText
                  ? [parentText]
                  : parentText.split(" ");

              // 줄 수에 따른 추가 간격
              if (parentLines.length > 1) {
                // 줄 수에 비례해 간격 증가 (각 추가 줄마다 20px 추가)
                spacingY = 100 + (parentLines.length - 1) * 20;
              }
            }

            const parentNode = nodes.find((n) => n.key === node.parent);
            const siblings = nodes.filter((n) => n.parent === parentNode.key);
            const totalWidth = getSubtreeWidth(parentNode.key, nodes);
            const leftOffset = -totalWidth / 2;
            const beforeWidth = siblings
              .slice(0, index)
              .reduce((acc, cur) => acc + getSubtreeWidth(cur.key, nodes), 0);
            const thisWidth = getSubtreeWidth(node.key, nodes);

            x =
              parentGroup.position.x + leftOffset + beforeWidth + thisWidth / 2;
            y = parentGroup.position.y - spacingY - depth * 5;

            if (siblings.length > 1 && index > 0) {
              const minDist = nodeWidth + 20;
              const prev = siblings[index - 1];
              const prevGroup = nodeMap.get(prev.key);
              if (prevGroup && x - prevGroup.position.x < minDist) {
                x = prevGroup.position.x + minDist;
              }
            }
          }

          group.position.set(x, y, 0);

          // 직각 간선 생성 - 노드 높이 고려하여 아래로 연결
          if (parentGroup) {
            const edgeRadius = 1.7;
            const parentPos = parentGroup.position.clone();

            // 부모 노드의 높이 정보 가져오기
            const parentNodeData = nodes.find((n) => n.key === node.parent);
            const parentIsRoot =
              parentNodeData &&
              (parentNodeData.parent === 0 || !parentNodeData.parent);
            const parentFontSize = parentIsRoot ? 40 : 27;
            const parentLineHeight = parentFontSize + 5;

            // 부모 노드의 텍스트 줄 수 계산
            const parentText = parentNodeData
              ? parentNodeData.name || "새 노드"
              : "새 노드";
            const parentIsDefaultText = parentText === "새 노드";
            const parentLines =
              parentIsRoot || parentIsDefaultText
                ? [parentText]
                : parentText.split(" ");

            // 부모 노드의 높이 계산
            const parentNodeHeight =
              (parentIsRoot ? 50 : 40) +
              (parentLines.length - 1) * parentLineHeight;

            // 부모 노드의 하단 좌표 계산 - 수정된 부분
            // 노드가 상단 기준으로 정렬되므로 전체 높이를 고려해야 함
            const parentNodeBottom = parentPos.y - parentNodeHeight;

            // 현재 노드의 상단 좌표 계산
            const currentNodeTop = y;

            // 간선을 생성하는 함수
            const createEdge = (start, end) => {
              const direction = new THREE.Vector3().subVectors(end, start);
              const length = direction.length();
              const mid = new THREE.Vector3()
                .addVectors(start, end)
                .multiplyScalar(0.5);
              const edgeGeometry = new THREE.CylinderGeometry(
                edgeRadius,
                edgeRadius,
                length,
                8
              );
              const edgeMaterial = new THREE.MeshBasicMaterial({
                color: new THREE.Color("#6F6F6F"),
              });
              const edgeMesh = new THREE.Mesh(edgeGeometry, edgeMaterial);
              edgeMesh.quaternion.setFromUnitVectors(
                new THREE.Vector3(0, 1, 0),
                direction.clone().normalize()
              );
              edgeMesh.position.copy(mid);
              threeRoot.add(edgeMesh);
            };

            // 첫 번째 간선: 부모 노드 하단에서 수직으로 내려옴
            const midY =
              parentNodeBottom - (parentNodeBottom - currentNodeTop) / 2;
            const verticalStart = new THREE.Vector3(
              parentPos.x,
              parentNodeBottom,
              parentPos.z
            );
            const verticalMid = new THREE.Vector3(
              parentPos.x,
              midY,
              parentPos.z
            );
            createEdge(verticalStart, verticalMid);

            // 두 번째 간선: 수평 간선 (왼쪽에서 오른쪽 또는 오른쪽에서 왼쪽)
            const horizontalEnd = new THREE.Vector3(x, midY, parentPos.z);
            createEdge(verticalMid, horizontalEnd);

            // 세 번째 간선: 수평 위치에서 현재 노드 상단으로 (아래로 향하는 수직선)
            createEdge(
              horizontalEnd,
              new THREE.Vector3(x, currentNodeTop, parentPos.z)
            );
          }

          threeRoot.add(group);
          nodeMap.set(node.key, group);

          const children = nodes.filter((n) => n.parent === node.key);
          children.forEach((child, i) =>
            drawNode(child, group, depth + 1, i, children.length)
          );
        };

        // 루트 노드부터 그리기 시작
        drawNode(root, null);
        threeRoot.position.set(0, 230, 0);

        console.log(
          "📐 threeRoot에 추가된 children 수:",
          threeRoot.children.length
        );
      } catch (error) {
        console.error("[ERROR] ❌ 3D 마인드맵 렌더링 중 에러 발생:", error);
      }
    };

    // 5. animateThree 함수 개선
    const animateThree = () => {
      if (!threeRenderer || !threeScene || !threeCamera) {
        console.error("[ERROR] ❌ Three.js 필수 구성 요소가 없음");
        return;
      }

      try {
        animationFrameId = requestAnimationFrame(animateThree);

        // OrbitControls 업데이트 (컨트롤 감쇠효과와 자동회전 기능 위함)
        if (orbitControls) {
          orbitControls.update();
        }

        // 기존 회전 애니메이션 제거 (OrbitControls가 이 기능을 대체함)
        // threeRoot.rotation.y += 0.003;

        // 실제 렌더링
        threeRenderer.render(threeScene, threeCamera);
        // CSS3D 렌더러도 함께 렌더링
        if (cssRenderer && cssScene) {
          cssRenderer.render(cssScene, threeCamera);
        }
      } catch (error) {
        console.error("[ERROR] ❌ Three.js 애니메이션 중 에러:", error);
        stopThreeAnimation();
      }
    };

    const stopThreeAnimation = () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
        console.log("[DEBUG] 🛑 Three.js 애니메이션 중지됨");
      }
    };
    const destroyThree = () => {
      console.log("[DEBUG] ♻️ Three.js 리소스 정리 시작");

      // 애니메이션 중지
      stopThreeAnimation();

      // 기존 씬 정리
      if (threeRoot) {
        if (threeScene) {
          threeScene.remove(threeRoot);
        }

        // 모든 자식 요소 제거
        while (threeRoot.children.length > 0) {
          const child = threeRoot.children[0];

          // 메모리 누수 방지를 위한 지오메트리/재질 정리
          if (child.geometry) {
            child.geometry.dispose();
          }

          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach((material) => material.dispose());
            } else {
              child.material.dispose();
            }
          }

          threeRoot.remove(child);
        }
      }

      // 렌더러 정리
      if (threeRenderer) {
        threeRenderer.dispose();
        if (threeRenderer.domElement && threeRenderer.domElement.parentNode) {
          threeRenderer.domElement.parentNode.removeChild(
            threeRenderer.domElement
          );
        }
        threeRenderer = null;
        // CSS3D 렌더러 정리
        if (cssRenderer) {
          if (cssRenderer.domElement && cssRenderer.domElement.parentNode) {
            cssRenderer.domElement.parentNode.removeChild(
              cssRenderer.domElement
            );
          }
          cssRenderer = null;
        }

        // CSS3D 씬 정리
        if (cssScene) {
          // CSS3D 객체들 제거
          while (cssScene.children.length > 0) {
            cssScene.remove(cssScene.children[0]);
          }
          cssScene = null;
        }
      }

      // 캔버스 DOM 요소 정리
      if (threeCanvasRef.value) {
        threeCanvasRef.value.innerHTML = "";
      }

      // 참조 초기화
      threeScene = null;
      threeCamera = null;
      threeRoot = null;

      console.log("[DEBUG] ♻️ Three.js 리소스 정리 완료");
    };

    const stopThreeRenderLoop = stopThreeAnimation;

    const checkThreeStatus = () => {
      console.log("📊 Three.js 상태 체크:");
      console.log("- threeRenderer:", threeRenderer ? "✅" : "❌");
      console.log("- threeScene:", threeScene ? "✅" : "❌");
      console.log("- threeCamera:", threeCamera ? "✅" : "❌");
      console.log("- threeRoot:", threeRoot ? "✅" : "❌");
      console.log("- threeCanvasRef:", threeCanvasRef.value ? "✅" : "❌");

      if (threeCanvasRef.value) {
        console.log("- Canvas 크기:", {
          width: threeCanvasRef.value.clientWidth,
          height: threeCanvasRef.value.clientHeight,
        });
      }

      if (threeScene) {
        console.log("- Scene 자식 수:", threeScene.children.length);
      }

      if (threeRoot) {
        console.log("- Root 자식 수:", threeRoot.children.length);
      }
    };

    const loadInvitedMembers = async () => {
      try {
        const members = await getProjectMembers(paramProject_id.value);
        invitedMembers.value = members;
      } catch (error) {
        console.error("❌ 초대한 팀원 불러오기 실패:", error);
      }
    };

    const updateRole = async (member) => {
      // 첫 번째 팀원 (index 0)의 역할은 변경할 수 없도록 처리
      if (invitedMembers.value.indexOf(member) === 0) {
        showToast("프로젝트 생성자의 역할은 변경할 수 없습니다.", true);
        return;
      }

      const newRole = member.isAdmin === 2 ? "editor" : "viewer"; // 역할을 반대로 변경
      try {
        // API 호출하여 역할 업데이트
        await updateUserRole(paramProject_id.value, member.user_id, newRole);

        // 로컬에서 역할 업데이트
        member.isAdmin = newRole === "viewer" ? 2 : 3;

        // 소켓 이벤트 발생 - 같은 프로젝트의 다른 사용자들에게 알림
        socket.emit("roleChanged", {
          roomId: roomId.value,
          userId: member.user_id,
          email: member.email,
          name: member.name || "",
          role: newRole,
          project_id: paramProject_id.value,
          updatedBy: currentUserEmail.value,
        });

        // 본인의 역할을 변경했을 때도 즉시 반영
        if (member.email === currentUserEmail.value) {
          isViewer.value = newRole === "viewer";

          // 자신을 뷰어로 변경했다면 모달창 닫기
          if (isViewer.value && isInviteModalOpen.value) {
            isInviteModalOpen.value = false;
          }

          const message = isViewer.value
            ? "당신의 역할이 뷰어로 변경되었습니다. 편집 권한이 제한됩니다."
            : "당신의 역할이 편집자로 변경되었습니다. 이제 편집이 가능합니다.";

          showToast(message);
        } else {
          showToast("역할이 성공적으로 변경되었습니다.");
        }
      } catch (error) {
        console.error("❌ 역할 변경 실패:", error);
        showToast("역할 변경에 실패했습니다.", true);
      }
    };

    const confirmDeleteMember = async (member) => {
      // 프로젝트 생성자(첫 번째 멤버)는 제거할 수 없음
      if (invitedMembers.value.indexOf(member) === 0) {
        showToast("프로젝트 생성자는 제거할 수 없습니다.", true);
        return;
      }

      if (
        confirm(
          `"${member.name || member.email}" 님을 프로젝트에서 제거하시겠습니까?`
        )
      ) {
        try {
          // API 호출하여 멤버 제거
          await removeUserFromProject(paramProject_id.value, member.user_id);

          // 로컬 상태에서 멤버 제거
          invitedMembers.value = invitedMembers.value.filter(
            (m) => m.user_id !== member.user_id
          );

          // 소켓 이벤트 발생 - 같은 프로젝트의 다른 사용자들에게 알림
          socket.emit("memberRemoved", {
            roomId: roomId.value,
            userId: member.user_id,
            email: member.email,
            name: member.name || "",
            project_id: paramProject_id.value,
            removedBy: currentUserEmail.value,
          });

          // 자기 자신을 제거했을 경우 처리
          if (member.email === currentUserEmail.value) {
            showToast("당신은 더 이상 이 프로젝트의 멤버가 아닙니다.");
            setTimeout(() => {
              router.push("/MyMap");
            }, 1000);
          } else {
            showToast(
              `"${
                member.name || member.email
              }" 님이 프로젝트에서 제거되었습니다.`
            );
          }
        } catch (error) {
          console.error("❌ 멤버 제거 실패:", error);
          showToast("멤버 제거에 실패했습니다.", true);
        }
      }
    };

    // 🔹 팀원 초대 관련 함수 추가
    const openInviteModal = async () => {
      // 루트 노드 이름 가져오기
      const rootNode = myDiagram.model.nodeDataArray.find(
        (node) => node.parent === 0
      );
      rootNodeName.value = rootNode ? `"${rootNode.name}"` : `"마인드맵"`;

      isInviteModalOpen.value = true;

      await loadInvitedMembers();
    };

    const checkUserRole = async () => {
      try {
        const members = await getProjectMembers(paramProject_id.value);
        console.log("📋 프로젝트 멤버 리스트:", members);
        console.log("📧 현재 로그인 이메일:", currentUserEmail.value);

        const currentUser = members.find(
          (m) => m.email === currentUserEmail.value
        );

        console.log("🔍 현재 유저 정보:", currentUser);

        if (currentUser?.isAdmin === 2) {
          console.log("👁️‍🗨️ 이 유저는 viewer입니다.");
          isViewer.value = true;
        } else {
          console.log("✏️ 이 유저는 편집 권한이 있습니다.");
          isViewer.value = false;
        }
      } catch (error) {
        console.error("❌ 권한 확인 오류:", error);
      }
    };

    const closeInviteModal = () => {
      isInviteModalOpen.value = false;
      inviteEmail.value = "";
      selectedRole.value = "viewer";
    };

    const sendInvite = async () => {
      if (!inviteEmail.value.trim()) {
        alert("이메일을 입력하세요.");
        return;
      }

      try {
        await addUserToProject(
          paramProject_id.value,
          inviteEmail.value,
          selectedRole.value
        );

        alert("초대가 완료되었습니다.");
        closeInviteModal();
        await loadInvitedMembers(); // 초대한 팀원 다시 불러오기
      } catch (error) {
        console.error("초대 실패:", error);
        alert("초대에 실패했습니다.");
      }
    };

    // 입력 필드 위치와 크기를 업데이트하는 함수
    const updateInputFieldPosition = () => {
      if (!activeEditNode.value || !activeInputField.value || !myDiagram)
        return;

      const node = myDiagram.findNodeForKey(activeEditNode.value.key);
      if (!node) return;

      const nodeElement = node.findObject("NAME_TEXTBLOCK");
      if (!nodeElement) return;

      const nodeBounds = nodeElement.getDocumentBounds();
      const diagramScale = myDiagram.scale;

      const nodePanel = node.findObject("NODE_PANEL");
      const nodePanelWidth = nodePanel.actualBounds.width * diagramScale;

      const minWidth = 80 * diagramScale;
      const inputWidth = Math.max(minWidth, nodePanelWidth + 30 * diagramScale);
      const inputHeight = 35 * diagramScale;

      const diagramPos = myDiagram.position;
      const nodeCenterX =
        (nodeBounds.x + nodeBounds.width / 2 - diagramPos.x) * diagramScale;
      const nodeTopY = (nodeBounds.y - diagramPos.y) * diagramScale;
      const x = nodeCenterX - inputWidth / 2;
      const y = nodeTopY - inputHeight - 20 * diagramScale;

      // 입력 필드 스타일 업데이트
      const inputField = activeInputField.value;
      inputField.style.left = `${x}px`;
      inputField.style.top = `${y}px`;
      inputField.style.width = `${inputWidth}px`;
      inputField.style.minWidth = `${minWidth}px`;
      inputField.style.padding = `${8 * diagramScale}px ${12 * diagramScale}px`;
      inputField.style.border = `${2 * diagramScale}px solid #9C6CFE`;
      inputField.style.borderRadius = `${6 * diagramScale}px`;
      inputField.style.fontSize = `${14 * diagramScale}px`;
      inputField.style.boxShadow = `0 ${2 * diagramScale}px ${
        6 * diagramScale
      }px rgba(0, 0, 0, 0.15)`;
    };

    const route = useRoute(); // ✅ 현재 라우트 정보 가져오기
    const router = useRouter();

    // 드로잉 페이지로 이동하는 함수
    const goToDrawing = () => {
      router.push("/Drawing");
    };

    const paramProject_id = ref(route.params.project_id); // ✅ URL에서 project_id 가져오기
    const autoJoinRoomId = computed(
      () => `project-audio-${paramProject_id.value}`
    );

    // roomId를 paramProject_id 기반으로 동적으로 설정
    const roomId = computed(() => `project-${paramProject_id.value}`);
    const userId = Math.random().toString(36).substring(2, 7); // 랜덤한 사용자 ID

    console.log("현재 프로젝트 ID:", paramProject_id.value); // ✅ 디버깅용 콘솔 출력
    console.log("현재 방 ID:", roomId.value);

    const toggleSidebar = () => {
      sidebarOpen.value = !sidebarOpen.value;
    };

    const toggleViewMode = () => {
      if (is3DMode.value) {
        // 🔄 3D → 2D 전환
        stopThreeAnimation();
        destroyThree();
        is3DMode.value = false;
        currentZoom.value = 1;

        if (threeCanvasRef.value) {
          threeCanvasRef.value.style.display = "none";
        }

        nextTick(() => {
          if (diagramDiv.value) {
            diagramDiv.value.style.display = "block";
          } else {
            diagramDiv.value = document.querySelector(".mindmap-content");
            if (diagramDiv.value) {
              diagramDiv.value.style.display = "block";
            }
          }

          if (myDiagram) {
            myDiagram.div = null;
            myDiagram = null;
          }

          // 다이어그램 초기화 후 루트 중심 정렬
          setTimeout(() => {
            console.log("🔄 2D 다이어그램 완전 재초기화");
            initDiagram();

            if (myDiagram) {
              myDiagram.addDiagramListener("InitialLayoutCompleted", (e) => {
                const rootNode = myDiagram.model.nodeDataArray.find(
                  (n) => n.parent === 0
                );
                if (rootNode) {
                  const rootPart = myDiagram.findNodeForKey(rootNode.key);
                  if (rootPart) {
                    myDiagram.centerRect(rootPart.actualBounds);
                    console.log("✅ 루트 노드 중심 정렬 완료");
                  }
                }
              });
            }

            setTimeout(() => {
              if (myDiagram) {
                console.log("📊 다이어그램 레이아웃 최종 조정");

                const rootNode = myDiagram.model.nodeDataArray.find(
                  (node) => node.parent === 0
                );

                myDiagram.startTransaction("layout adjustment");

                // 줌 레벨 초기화 및 레이아웃 적용
                myDiagram.scale = 1;
                currentZoom.value = 1;
                myDiagram.layoutDiagram(true);

                if (rootNode) {
                  const rootPart = myDiagram.findNodeForKey(rootNode.key);
                  if (rootPart) {
                    myDiagram.centerRect(rootPart.actualBounds);
                  }
                } else {
                  myDiagram.zoomToFit();
                }

                myDiagram.commitTransaction("layout adjustment");

                const diagramElement =
                  document.querySelector(".mindmap-content");
                if (diagramElement) {
                  diagramElement.style.display = "block";
                  diagramElement.style.visibility = "visible";
                  diagramElement.style.opacity = "1";
                }
              }
            }, 200);
          }, 200);
        });

        console.log("🔄 2D 모드로 전환됨");
      } else {
        // 🔄 2D → 3D 전환
        if (myDiagram && myDiagram.model) {
          myDiagram.startTransaction("clear selection");
          myDiagram.model.nodeDataArray.forEach((node) => {
            if (node.isSelected) {
              myDiagram.model.setDataProperty(node, "isSelected", false);
            }
          });
          myDiagram.commitTransaction("clear selection");
        }

        if (diagramDiv.value) {
          diagramDiv.value.style.display = "none";
        }

        selectedNode.value = null;
        is3DMode.value = true;
        console.log("🔄 3D 모드로 전환됨");

        nextTick(() => {
          if (threeCanvasRef.value) {
            threeCanvasRef.value.style.display = "block";
          } else {
            threeCanvasRef.value = document.querySelector(".three-container");
            if (threeCanvasRef.value) {
              threeCanvasRef.value.style.display = "block";
            }
          }

          console.log("✅ 3D 모드 DOM 업데이트 완료, 초기화 준비 중");

          if (!threeCanvasRef.value) {
            console.error("❌ three-container를 찾을 수 없음");
            is3DMode.value = false;
            showToast("3D 모드를 초기화할 수 없습니다.", true);
            if (diagramDiv.value) diagramDiv.value.style.display = "block";
            return;
          }

          const waitForCanvas = (retries = 0, maxRetries = 5) => {
            if (retries >= maxRetries) {
              console.error("❌ 최대 재시도 횟수 초과: 3D 모드 초기화 실패");
              is3DMode.value = false;
              showToast(
                "3D 모드를 불러올 수 없습니다. 나중에 다시 시도해주세요.",
                true
              );
              if (diagramDiv.value) diagramDiv.value.style.display = "block";
              return;
            }

            const width =
              threeCanvasRef.value.clientWidth ||
              threeCanvasRef.value.offsetWidth;
            const height =
              threeCanvasRef.value.clientHeight ||
              threeCanvasRef.value.offsetHeight;

            console.log("📏 Canvas 크기 확인:", { width, height });

            if (width > 0 && height > 0) {
              console.log("✅ Canvas 크기 확인됨, Three.js 초기화 시작");

              setTimeout(() => {
                destroyThree();
                initThree();
                checkThreeStatus();

                setTimeout(() => {
                  window.dispatchEvent(new CustomEvent("mindmap-updated"));
                  console.log("📣 3D 초기화 이후 mindmap-updated 이벤트 발생");
                }, 100);
              }, 50);
            } else {
              console.log("⏳ Canvas 크기가 아직 준비되지 않음. 재시도 중...");
              setTimeout(() => waitForCanvas(retries + 1, maxRetries), 100);
            }
          };

          waitForCanvas();
        });
      }
    };

    // canAddSibling computed 속성 추가
    const canAddSibling = computed(() => {
      // 선택된 노드가 없으면 false
      if (!selectedNode.value) return false;

      // key가 1인 첫 번째 노드면 false
      if (selectedNode.value.parent === 0) return false;

      return true;
    });

    // 기존의 전역 handleKeyDown 함수에 TextField 관련 로직 추가
    const handleKeyDown = (event) => {
      // ✅ Viewer는 키보드 단축키 동작도 비활성화
      if (isViewer.value) {
        return;
      }

      // F5 키는 기본 동작 허용
      if (event.key === "F5") {
        return true;
      }

      // 텍스트 필드가 활성화된 경우의 처리
      if (activeInputField.value) {
        const editEmoji = "✏️ ";

        if (event.key === "Enter") {
          event.preventDefault();
          activeInputField.value.blur();
          return;
        }

        // 백스페이스 키 처리
        if (event.key === "Backspace") {
          const textContent = activeInputField.value.value.replace(
            editEmoji,
            ""
          );
          // 텍스트가 비어있고 커서가 이모지 바로 뒤에 있을 때
          if (
            textContent === "" &&
            activeInputField.value.selectionStart <= editEmoji.length
          ) {
            event.preventDefault(); // 백스페이스 동작 막기
            return;
          }
        }
        return;
      }

      // 기존 마인드맵 노드 관련 키보드 단축키 처리
      if (!selectedNode.value || !myDiagram) return;

      if (event.key === "Tab") {
        event.preventDefault();
        addNode(false); // 하위 레벨 추가
      }

      if (event.key === "Shift") {
        event.preventDefault();
        addNode(true); // 동일 레벨 추가
      }

      if (event.key === "Delete") {
        event.preventDefault();
        // 루트 노드(parent가 0인 노드)는 삭제할 수 없도록 체크
        if (selectedNode.value && selectedNode.value.parent !== 0) {
          deleteSelectedNode();
        }
      }
    };

    const deleteSelectedNode = async () => {
      if (!selectedNode.value) return;

      console.log("🗑️ 삭제 요청 보냄:", selectedNode.value.key);

      // ✅ API 요청 → 서버에서 삭제 결정
      const success = await deleteMindmapNodes(
        selectedNode.value.key,
        paramProject_id.value,
        roomId.value
      );

      if (!success) {
        console.error("❌ 서버 삭제 실패");
        return;
      }

      selectedNode.value = null;

      // ✅ 삭제 요청만 보내고, 실제 삭제는 WebSocket 이벤트에서 처리됨 (socketHandlers.js)
      // 수정: 화면에서 삭제되지만 3D 뷰 업데이트를 위해 이벤트 발생
      window.dispatchEvent(new CustomEvent("mindmap-updated"));
    };

    const animateZoom = (startZoom, targetZoom, startTime, duration) => {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;

      if (elapsed >= duration) {
        applyZoom(targetZoom);
        if (activeInputField.value) {
          updateInputFieldPosition();
        }
        zoomAnimationFrame = null;
        return;
      }

      const progress = elapsed / duration;
      const easeProgress =
        progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      const currentZoomLevel =
        startZoom + (targetZoom - startZoom) * easeProgress;

      // 매 프레임마다 줌 레벨과 입력 필드 위치 함께 업데이트
      applyZoom(currentZoomLevel);
      if (activeInputField.value) {
        const inputField = activeInputField.value;
        // transition 제거하여 즉시 적용되도록 함
        inputField.style.transition = "none";
        updateInputFieldPosition();
      }

      zoomAnimationFrame = requestAnimationFrame(() => {
        animateZoom(startZoom, targetZoom, startTime, duration);
      });
    };

    const animatePanning = (startPos, targetPos, startTime, duration) => {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;

      if (elapsed >= duration) {
        myDiagram.position = targetPos;
        panAnimationFrame = null;
        return;
      }

      const progress = elapsed / duration;
      const easeProgress = 1 - (1 - progress) * (1 - progress);

      const currentX = startPos.x + (targetPos.x - startPos.x) * easeProgress;
      const currentY = startPos.y + (targetPos.y - startPos.y) * easeProgress;

      myDiagram.position = new go.Point(currentX, currentY);

      panAnimationFrame = requestAnimationFrame(() => {
        animatePanning(startPos, targetPos, startTime, duration);
      });
    };

    const startPanAnimation = (newPos) => {
      if (panAnimationFrame) {
        cancelAnimationFrame(panAnimationFrame);
      }

      const startPos = myDiagram.position.copy();
      animatePanning(startPos, newPos, Date.now(), PAN_ANIMATION_DURATION);
    };

    const applyZoom = (newZoomLevel) => {
      if (myDiagram) {
        myDiagram.startTransaction("change zoom");
        myDiagram.scale = newZoomLevel;
        myDiagram.commitTransaction("change zoom");
        currentZoom.value = myDiagram.scale;
      }
    };

    const startZoomAnimation = (targetZoom) => {
      if (zoomAnimationFrame) {
        cancelAnimationFrame(zoomAnimationFrame);
      }

      // 줌 애니메이션 시작 시 바로 입력 필드 업데이트
      if (activeInputField.value) {
        const inputField = activeInputField.value;
        const originalTransition = inputField.style.transition; // 기존 transition 값 저장
        inputField.style.transition = `all ${ANIMATION_DURATION}ms ease`; // 줌 애니메이션용 transition 설정
        updateInputFieldPosition();

        // 애니메이션 종료 후 원래 transition으로 복원
        setTimeout(() => {
          inputField.style.transition = originalTransition;
        }, ANIMATION_DURATION);
      }

      const startZoom = currentZoom.value;
      animateZoom(startZoom, targetZoom, Date.now(), ANIMATION_DURATION);
    };

    const increaseZoom = () => {
      if (currentZoom.value < MAX_ZOOM) {
        const newZoomLevel = Math.min(
          currentZoom.value + ZOOM_BUTTON_STEP,
          MAX_ZOOM
        );
        startZoomAnimation(newZoomLevel);
      }
    };

    const decreaseZoom = () => {
      if (currentZoom.value > MIN_ZOOM) {
        const newZoomLevel = Math.max(
          currentZoom.value - ZOOM_BUTTON_STEP,
          MIN_ZOOM
        );
        startZoomAnimation(newZoomLevel);
      }
    };

    const onWheel = (event) => {
      return;
    };

    const startDrag = (event) => {
      if (!myDiagram) return;

      // console.log(
      //   "📌 startDrag 호출됨! isDragging:",
      //   isDragging.value,
      //   "isNodeDragging:",
      //   isNodeDragging.value
      // );

      // ✅ 클릭한 요소가 노드인지 확인
      const part = myDiagram.findPartAt(
        myDiagram.transformViewToDoc(new go.Point(event.clientX, event.clientY))
      );

      if (part instanceof go.Node) {
        console.log("🚨 노드 클릭 감지됨! 화면 드래그 차단");
        return; // 🔥 노드를 클릭한 경우 화면 드래그 실행 안 함
      }

      // ✅ 노드 드래그 중이면 화면 드래그 차단
      if (isNodeDragging.value) {
        console.log("🚨 노드 드래그 감지 → 화면 드래그 차단");
        isDragging.value = false;
        return;
      }

      isDragging.value = true;
      lastMousePosition.value = {
        x: event.clientX,
        y: event.clientY,
      };
    };

    const stopDrag = () => {
      if (!isNodeDragging.value) {
        isDragging.value = false;
      }
      isNodeDragging.value = false; // 노드 드래그 상태 초기화
    };

    const dragMove = (event) => {
      if (!isDragging.value || !myDiagram || isNodeDragging.value) {
        // console.log(
        //   "⛔ dragMove 실행 중단! isDragging:",
        //   isDragging.value,
        //   "isNodeDragging:",
        //   isNodeDragging.value
        // );
        return;
      }

      // console.log("📌 dragMove 실행됨! 화면 이동 중...");

      const dx = (event.clientX - lastMousePosition.value.x) / myDiagram.scale;
      const dy = (event.clientY - lastMousePosition.value.y) / myDiagram.scale;

      const currentPos = myDiagram.position;
      const newPos = new go.Point(currentPos.x - dx, currentPos.y - dy);

      startPanAnimation(newPos);

      lastMousePosition.value = {
        x: event.clientX,
        y: event.clientY,
      };
    };

    //두 손가락 사이의 거리 계산 (줌 기능에 사용)
    const getTouchDistance = (touches) => {
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };
    //터치 시작 감지 (드래그 시작 or 줌 준비)
    const startTouch = (event) => {
      if (!myDiagram) return;

      touchStartTime.value = Date.now();

      if (event.touches.length === 1) {
        isDragging.value = true;
        lastTouchPosition.value = {
          x: event.touches[0].clientX,
          y: event.touches[0].clientY,
        };
      } else if (event.touches.length === 2) {
        isDragging.value = false;
        initialTouchDistance.value = getTouchDistance(event.touches);
      }
    };
    //터치 중 이동 감지 (드래그 or 줌 실행)
    const touchMove = (event) => {
      if (!myDiagram) return;
      event.preventDefault();

      if (event.touches.length === 1 && isDragging.value) {
        const dx =
          (event.touches[0].clientX - lastTouchPosition.value.x) /
          myDiagram.scale;
        const dy =
          (event.touches[0].clientY - lastTouchPosition.value.y) /
          myDiagram.scale;

        const currentPos = myDiagram.position;
        const newPos = new go.Point(currentPos.x - dx, currentPos.y - dy);

        startPanAnimation(newPos);

        lastTouchPosition.value = {
          x: event.touches[0].clientX,
          y: event.touches[0].clientY,
        };
      } else if (event.touches.length === 2) {
        const newDistance = getTouchDistance(event.touches);
        const scale = newDistance / initialTouchDistance.value;

        if (scale !== 1) {
          const newZoomLevel = Math.max(
            MIN_ZOOM,
            Math.min(MAX_ZOOM, currentZoom.value * scale)
          );
          startZoomAnimation(newZoomLevel);
          initialTouchDistance.value = newDistance;
        }
      }
    };
    //터치 종료 시 드래그/줌 초기화
    const stopTouch = () => {
      isDragging.value = false;
      initialTouchDistance.value = 0;
    };

    // 특정 이름으로 노드를 추가하는 메소드
    const addNodeWithName = async (nodeName, parentKey) => {
      const newNode = {
        name: nodeName,
        parent: parentKey || 0,
        isSelected: false,
        project_id: paramProject_id.value,
      };

      const success = await saveMindmapToServer(
        [newNode],
        paramProject_id.value,
        roomId.value
      );

      if (success) {
        console.log("✅ 추천 노드 추가 성공:", newNode);
      } else {
        console.warn("❌ 추천 노드 추가 실패");
      }
    };

    const addNodeWithAnimation = async (nodeData) => {
      if (!myDiagram) return;

      // 새 노드를 모델에 추가
      myDiagram.startTransaction("add node");
      myDiagram.model.addNodeData(nodeData);
      myDiagram.commitTransaction("add node");

      // 새로 추가된 노드의 위치 애니메이션 적용
      const newNode = myDiagram.findNodeForKey(nodeData.key);
      if (newNode) {
        const startOpacity = newNode.opacity;
        newNode.opacity = 0; // 처음엔 투명하게 설정

        const fadeIn = () => {
          let opacity = 0;
          const fadeInterval = setInterval(() => {
            if (opacity >= startOpacity) {
              clearInterval(fadeInterval);
            } else {
              opacity += 0.1;
              newNode.opacity = opacity;
            }
          }, 30);
        };

        fadeIn();
      }
    };

    // AI 추천 후 노드를 추가하는 메소드
    const addSuggestedNode = async (suggestedName) => {
      if (!selectedNode.value || !myDiagram) return;

      const newNode = {
        id: `temp-${Date.now()}`,
        key: `temp-${Date.now()}`,
        name: suggestedName,
        parent: selectedNode.value.key,
        isSelected: false,
        project_id: paramProject_id.value,
        isSuggested: true, // ✅ AI 추천 여부 추가
      };

      myDiagram.startTransaction("add suggested node");
      myDiagram.model.addNodeData(newNode);

      // ✅ AI 추천 노드의 간선에도 isSuggested 추가
      myDiagram.model.addLinkData({
        from: selectedNode.value.key,
        to: newNode.key,
        isSuggested: true, // ✅ 간선 데이터에 AI 추천 여부 추가
      });

      myDiagram.commitTransaction("add suggested node");
    };

    const suggestNodes = async () => {
      if (!selectedNode.value) {
        console.warn("🚨 선택된 노드가 없습니다.");
        return;
      }

      if (!aiParentNode.value) {
        aiParentNode.value = selectedNode.value;
      }

      console.log("🟢 AI 추천 버튼 클릭됨", aiParentNode.value);

      // 🔥 전체 화면 애니메이션 시작
      isAIRecommending.value = true;

      try {
        const suggestedNodes = await suggestChildNodes(
          paramProject_id.value,
          aiParentNode.value.key,
          roomId.value
        );

        if (suggestedNodes && suggestedNodes.length > 0) {
          const individualSuggestions = suggestedNodes
            .flatMap((s) =>
              s.split(",").map((s) => s.trim().replace(/^\d+\.\s*/, ""))
            )
            .filter(Boolean);

          for (const suggestedName of individualSuggestions) {
            const timestamp = Date.now();
            const newNode = {
              id: `temp-${timestamp}`,
              key: `temp-${timestamp}`,
              name: suggestedName,
              parent: aiParentNode.value.key,
              isSelected: false,
              project_id: paramProject_id.value,
              isSuggested: true,
            };

            await addNodeWithAnimation(newNode);
          }

          window.dispatchEvent(new CustomEvent("mindmap-updated"));
        } else {
          console.error("❌ 추천된 노드를 받아오지 못했습니다.");
        }
      } catch (error) {
        console.error("❌ AI 추천 중 오류 발생:", error);
        showToast("AI 추천 중 오류가 발생했습니다.", true);
      } finally {
        // 🔥 전체 화면 애니메이션 종료
        isAIRecommending.value = false;
        aiParentNode.value = null;
      }
    };

    const addNode = async (isSibling = false) => {
      if (!selectedNode.value || !myDiagram) return;
      // ✅ 동일 레벨 추가일 때만 canAddSibling 체크
      if (isSibling && !canAddSibling.value) return;

      const parentKey = isSibling
        ? selectedNode.value.parent // 동일 레벨 추가 시 부모를 유지
        : selectedNode.value.id; // 하위 레벨 추가 시 부모는 현재 선택된 노드

      const parentProject_id = selectedNode.value.project_id;
      const newNode = {
        name: "새 노드",
        parent: parentKey || 0, // 부모 키가 없으면 최상위 노드
        isSelected: false,
        project_id: parentProject_id,
      };

      addedNodes.value.push(newNode); // ✅ 새 노드 저장

      console.log(
        `✅ ${isSibling ? "동일 레벨" : "하위 레벨"} 노드 추가됨:`,
        newNode
      );

      const success = await saveMindmapToServer(
        addedNodes.value,
        paramProject_id.value,
        roomId.value
      );

      if (success) {
        addedNodes.value = []; // ✅ 저장 성공 시 초기화

        // 마인드맵 업데이트 이벤트 발생
        window.dispatchEvent(new CustomEvent("mindmap-updated"));
      } else {
        console.warn("⏪ 서버 오류 발생");
      }
    };

    // 토스트 메시지 상태 변수
    const isToastVisible = ref(false);
    const toastMessage = ref("");
    const isToastError = ref(false);

    // 토스트 메시지 표시 함수
    const showToast = (message, isError = false) => {
      toastMessage.value = message;
      isToastError.value = isError;
      isToastVisible.value = true;

      // 3초 후 자동으로 토스트 메시지 숨기기
      setTimeout(() => {
        isToastVisible.value = false;
      }, 3000);
    };

    const captureMindmap = async () => {
      if (is3DMode.value) {
        // ✅ 3D 모드: Three.js의 캔버스와 CSS3D 요소를 모두 캡처
        try {
          // 애니메이션 프레임을 한 번 더 실행하여 최신 상태로 렌더링
          threeRenderer.render(threeScene, threeCamera);
          if (cssRenderer && cssScene) {
            cssRenderer.render(cssScene, threeCamera);
          }

          // html2canvas를 사용하여 전체 Three.js 컨테이너 캡처
          const threeContainer = threeCanvasRef.value;
          const canvas = await html2canvas(threeContainer, {
            backgroundColor: "#fafafa",
            scale: 1.3,
            useCORS: true,
            logging: false,
            allowTaint: true,
            foreignObjectRendering: true,
          });

          const today = new Date();
          const formattedDate = `${today.getFullYear()}.${String(
            today.getMonth() + 1
          ).padStart(2, "0")}.${String(today.getDate()).padStart(2, "0")}`;
          // 루트 노드 이름 가져오기 (2D 모드와 동일한 방식)
          const rootNode = myDiagram.model.nodeDataArray.find(
            (node) => node.parent === 0
          );
          const rootNodeName = rootNode ? rootNode.name : "마인드맵";
          const fileName = `${formattedDate}-${rootNodeName}.png`;

          // 이미지 저장
          const imageUrl = canvas.toDataURL("image/png");
          const link = document.createElement("a");
          link.href = imageUrl;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          showToast("3D 마인드맵 캡처가 완료되었습니다.");
        } catch (error) {
          console.error("❌ 3D 캡처 실패:", error);
          showToast("3D 마인드맵 캡처에 실패했습니다.", true);

          // 첫 번째 방법이 실패하면 대체 방법 시도
          try {
            console.log("🔄 대체 캡처 방법 시도 중...");

            // 캔버스 생성
            const canvas = document.createElement("canvas");
            const threeContainer = threeCanvasRef.value;
            canvas.width = threeContainer.clientWidth;
            canvas.height = threeContainer.clientHeight;
            const ctx = canvas.getContext("2d");

            // 배경색 설정
            ctx.fillStyle = "#fafafa";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // WebGL 캔버스 내용 먼저 그리기
            ctx.drawImage(threeRenderer.domElement, 0, 0);

            // 이미지 저장
            const today = new Date();
            const formattedDate = `${today.getFullYear()}.${String(
              today.getMonth() + 1
            ).padStart(2, "0")}.${String(today.getDate()).padStart(2, "0")}`;
            // 루트 노드 이름 가져오기 (2D 모드와 동일한 방식)
            const rootNode = myDiagram.model.nodeDataArray.find(
              (node) => node.parent === 0
            );
            const rootNodeName = rootNode ? rootNode.name : "마인드맵";
            const fileName = `${formattedDate}-${rootNodeName}.png`;

            const dataURL = canvas.toDataURL("image/png");
            const link = document.createElement("a");
            link.href = dataURL;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            showToast("3D 마인드맵 캡처가 완료되었습니다.");
          } catch (fallbackError) {
            console.error("❌ 대체 캡처 방법도 실패:", fallbackError);
            showToast(
              "3D 마인드맵 캡처에 실패했습니다. 다른 뷰 모드를 시도해보세요.",
              true
            );
          }
        }
      } else {
        // ✅ 기존 2D 캡처 로직 유지
        const diagramDiv = document.querySelector(".mindmap-content");
        const rootNode = myDiagram.model.nodeDataArray.find(
          (node) => node.parent === 0
        );
        const rootNodeName = rootNode ? rootNode.name : "마인드맵";

        const today = new Date();
        const formattedDate = `${today.getFullYear()}.${String(
          today.getMonth() + 1
        ).padStart(2, "0")}.${String(today.getDate()).padStart(2, "0")}`;
        const fileName = `${formattedDate}-${rootNodeName}.png`;

        try {
          const canvas = await html2canvas(diagramDiv, {
            backgroundColor: "#fafafa",
            scale: 1.3,
            useCORS: true,
            logging: false,
          });

          const imageUrl = canvas.toDataURL("image/png");
          const link = document.createElement("a");
          link.href = imageUrl;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          showToast("2D 마인드맵 캡처가 완료되었습니다.");
        } catch (error) {
          console.error("2D 캡처 실패:", error);
          showToast("2D 마인드맵 캡처에 실패했습니다.", true);
        }
      }
    };

    const initDiagram = () => {
      console.log("📦 initDiagram() 진입");

      const $ = go.GraphObject.make;
      console.log(
        "🛠️ go.Diagram 생성 준비됨, diagramDiv.value =",
        diagramDiv.value
      );

      // CommandHandler를 확장하여 키보드 네비게이션을 비활성화
      class CustomCommandHandler extends go.CommandHandler {
        doKeyDown(e) {
          // F5 키의 경우 이벤트를 그대로 전파
          if (e.key === "F5") {
            return true;
          }
          // 다른 키보드 이벤트는 기존대로 처리
          return;
        }

        // Ctrl+C, Ctrl+V 비활성화
        canCopySelection() {
          return false;
        }

        // Ctrl+클릭으로 인한 복사 비활성화
        canStartCopySelection(e) {
          return false;
        }
      }

      class CustomDraggingTool extends go.DraggingTool {
        doActivate() {
          console.log("🚀 CustomDraggingTool doActivate 시작");

          // 기본 doActivate 먼저 호출 (순서 중요!)
          super.doActivate();

          // 드래그되는 모든 선택된 노드들 처리
          const selection = this.diagram.selection;

          selection.each((part) => {
            if (part instanceof go.Node) {
              console.log(
                `🟢 드래그 시작된 노드: "${part.data.name}" (key: ${part.data.key})`
              );

              // 상태 업데이트
              isNodeDragging.value = true;
              isDragging.value = false;

              // 해당 노드의 간선들만 투명화
              setConnectedLinksTransparency(part, 0.1); // 100% 투명
            }
          });
        }

        doDeactivate() {
          console.log("🛑 CustomDraggingTool doDeactivate 시작");

          // 드래그 종료 전에 투명도 복원
          const selection = this.diagram.selection;

          selection.each((part) => {
            if (part instanceof go.Node) {
              console.log(
                `🔄 드래그 종료된 노드: "${part.data.name}" (key: ${part.data.key})`
              );

              // 해당 노드의 간선들 투명도 복원
              setConnectedLinksTransparency(part, 1.0); // 100% 불투명
            }
          });

          // 상태 업데이트
          isNodeDragging.value = false;
          if (!this.diagram.selection.first()) {
            isDragging.value = true;
          }

          // 기본 doDeactivate 호출
          super.doDeactivate();
        }

        // 추가: 드래그 중에도 투명도 유지 (간선이 다시 나타나는 것을 방지)
        doDragOver(pt, obj) {
          super.doDragOver(pt, obj);

          // 드래그 중에 간선 투명도가 초기화되는 것을 방지
          const selection = this.diagram.selection;
          selection.each((part) => {
            if (part instanceof go.Node) {
              setConnectedLinksTransparency(part, 0.1);
            }
          });
        }
      }

      myDiagram = $(go.Diagram, diagramDiv.value, {
        initialContentAlignment: go.Spot.Center,
        allowMove: true,
        allowHorizontalScroll: true,
        allowVerticalScroll: true,
        allowCopy: false, // 복사 기능 비활성화
        allowClipboard: false, // 클립보드 기능 비활성화
        scrollMode: go.Diagram.InfiniteScroll,
        // 커스텀 CommandHandler 설정
        commandHandler: new CustomCommandHandler(),
        layout: $(go.TreeLayout, {
          angle: 0,
          nodeSpacing: 50,
          layerSpacing: 50,
          arrangement: go.TreeLayout.ArrangementHorizontal,
          alignment: go.TreeLayout.AlignmentCenterChildren,
          compaction: go.TreeLayout.CompactionNone,
          layerStyle: go.TreeLayout.LayerIndividual,
        }),
        model: $(go.TreeModel),
        "animationManager.isEnabled": true,
        "animationManager.duration": ANIMATION_DURATION,
        scale: currentZoom.value,
      });

      // ✅ 커스텀 DraggingTool을 다이어그램에 적용
      myDiagram.toolManager.draggingTool = new CustomDraggingTool();

      myDiagram.addDiagramListener("InitialLayoutCompleted", (e) => {
        const rootNode = myDiagram.model.nodeDataArray.find(
          (n) => n.parent === 0
        );
        if (rootNode) {
          const rootPart = myDiagram.findNodeForKey(rootNode.key);
          if (rootPart) {
            myDiagram.centerRect(rootPart.actualBounds);
            console.log("✅ 루트 노드 중심 정렬 완료 (프로젝트 초기 진입)");
          }
        }
      });

      console.log("✅ myDiagram 생성 완료:", myDiagram);

      myDiagram.toolManager.dragSelectingTool.isEnabled = false;

      // ✅ 트리 레이아웃 자동 정렬 추가
      myDiagram.addDiagramListener("SelectionMoved", (e) => {
        console.log("🔄 노드 이동 완료, 트리 레이아웃 재정렬 실행");

        myDiagram.startTransaction("Rearrange Tree");
        myDiagram.layoutDiagram(true); // 🔥 트리 레이아웃 강제 실행
        myDiagram.commitTransaction("Rearrange Tree");
      });

      // ✅ WebSocket 이벤트 등록
      registerSocketHandlers(myDiagram, roomId, userId);

      // ✅ API 호출하여 서버에서 마인드맵 데이터 불러오기
      loadMindmapFromServer(myDiagram, paramProject_id.value)
        .then(() => {
          console.log("📡 서버에서 마인드맵 로딩 완료");
          // 로딩 완료 후 업데이트 이벤트 발생
          window.dispatchEvent(new CustomEvent("mindmap-updated"));
        })
        .catch((err) => {
          console.error("❌ 마인드맵 로딩 실패:", err);
        });
      console.log("📡 서버에서 마인드맵 로딩 요청:", paramProject_id.value);

      myDiagram.addDiagramListener("ObjectSingleClicked", async (e) => {
        const part = e.subject.part;
        if (part instanceof go.Node) {
          const node = part.data;
          console.log("Selected Node:", node);
          selectedNode.value = node;

          // 🔥 AI 추천 노드 클릭 시 확인 버튼을 눌렀을 때만 저장
          if (node.isSuggested) {
            const confirmed = confirm("AI 추천 노드를 저장하시겠습니까?");

            if (confirmed) {
              const newNode = {
                name: node.name,
                parent: node.parent,
                isSelected: false,
                project_id: paramProject_id.value,
              };

              // ✅ AI 추천 노드 삭제 후 새로운 노드 추가
              myDiagram.startTransaction("replace suggested node");
              myDiagram.model.removeNodeData(node); // 기존 추천 노드 삭제
              myDiagram.commitTransaction("replace suggested node");

              // **🔥 기존 selectedNode를 null로 초기화하여 UI가 정상 동작하도록 설정**
              selectedNode.value = null;

              // 서버 저장 호출
              const success = await saveMindmapToServer(
                [newNode],
                paramProject_id.value,
                roomId.value
              );

              if (success) {
                console.log("✅ AI 추천 노드가 저장되었습니다.");
              } else {
                alert("서버에 저장하는데 실패했습니다.");
              }
            } else {
              // 🔴 취소 버튼 클릭 시, 해당 AI 추천 노드를 프론트에서 삭제
              myDiagram.startTransaction("remove suggested node");
              myDiagram.model.removeNodeData(node);
              myDiagram.commitTransaction("remove suggested node");

              console.log("🗑️ AI 추천 노드가 삭제되었습니다.");

              // **🔥 기존 selectedNode를 null로 초기화하여 버튼이 잘 동작하도록 설정**
              selectedNode.value = null;
            }
          }
        }
      });

      myDiagram.nodeTemplate = $(
        go.Node,
        "Spot",
        {
          selectionAdorned: false,
          resizable: false,
          layoutConditions: go.Part.LayoutStandard & ~go.Part.LayoutNodeSized,
          movable: false,

          mouseDragEnter: (e, node) => {
            e.diagram.model.startTransaction("highlight drop target");
            e.diagram.model.setDataProperty(node.data, "isDropTarget", true);
            e.diagram.model.commitTransaction("highlight drop target");
          },

          mouseDragLeave: (e, node) => {
            e.diagram.model.startTransaction("unhighlight drop target");
            e.diagram.model.setDataProperty(node.data, "isDropTarget", false);
            e.diagram.model.commitTransaction("unhighlight drop target");
          },

          mouseDrop: (e, node) => {
            const draggedNode = e.diagram.selection.first();
            if (!draggedNode || draggedNode === node) return;

            console.log(
              "🟢 노드 이동 감지:",
              draggedNode.data,
              "=>",
              node.data
            );

            setConnectedLinksTransparency(draggedNode, 1.0);

            socket.emit("move-node", {
              roomId: roomId.value,
              movedNodeId: draggedNode.data.key,
              newParentId: node.data.key,
              project_id: paramProject_id.value,
            });

            e.diagram.model.startTransaction("drop complete");
            e.diagram.model.setDataProperty(node.data, "isDropTarget", false);
            e.diagram.model.commitTransaction("drop complete");

            isNodeDragging.value = false;
            isDragging.value = false;
          },

          doubleClick: (e, node) => {
            if (isViewer.value) {
              console.log("👁️‍🗨️ Viewer 권한 - 노드 이름 편집 비활성화됨");
              return;
            }

            const nodeElement = node.findObject("NAME_TEXTBLOCK");
            if (!nodeElement) return;

            const editEmoji = "✏️ ";
            const inputField = document.createElement("input");
            inputField.value = editEmoji + node.data.name;

            Object.assign(inputField.style, {
              position: "absolute",
              backgroundColor: "white",
              outline: "none",
              maxWidth: "none",
              transition: "all 0.2s ease",
              zIndex: "9999",
              fontFamily: "sans-serif",
              userSelect: "text",
              WebkitUserSelect: "text",
              touchAction: "none",
              fontSize: "16px",
            });

            inputField.setAttribute("type", "text");
            inputField.setAttribute("autocomplete", "off");
            inputField.setAttribute("autocapitalize", "off");
            inputField.setAttribute("autocorrect", "off");
            inputField.setAttribute("spellcheck", "false");

            document.body.appendChild(inputField);

            activeEditNode.value = node.data;
            activeInputField.value = inputField;

            updateInputFieldPosition();

            let retryCount = 0;
            const maxRetries = 5;

            const tryFocus = () => {
              inputField.focus();
              inputField.setSelectionRange(
                inputField.value.length,
                inputField.value.length
              );

              if (
                document.activeElement !== inputField &&
                retryCount < maxRetries
              ) {
                retryCount++;
                setTimeout(tryFocus, 100);
              }
            };

            requestAnimationFrame(() => {
              setTimeout(() => {
                tryFocus();
              }, 0);
            });

            inputField.addEventListener("touchend", () => {
              inputField.focus();
              inputField.setSelectionRange(
                inputField.value.length,
                inputField.value.length
              );
            });

            let blurTimeout = null;
            let justOpened = true;
            setTimeout(() => (justOpened = false), 100);

            const handleInput = () => {
              const textContent = inputField.value.replace(editEmoji, "");
              if (!inputField.value.startsWith(editEmoji)) {
                inputField.value = editEmoji + textContent;
                inputField.setSelectionRange(
                  editEmoji.length,
                  inputField.value.length
                );
              }
            };

            const handleTextFieldKeyDown = (e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                inputField.blur();
              }

              if (e.key === "Backspace") {
                const textContent = inputField.value.replace(editEmoji, "");
                if (
                  textContent === "" &&
                  inputField.selectionStart <= editEmoji.length
                ) {
                  e.preventDefault();
                }
              }

              const isSelectAll =
                (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a";
              if (isSelectAll) {
                e.preventDefault();
                inputField.setSelectionRange(
                  editEmoji.length,
                  inputField.value.length
                );
              }
            };

            const completeEditing = async () => {
              if (!inputField) return;

              let updatedText = inputField.value.replace(editEmoji, "").trim();
              if (!updatedText) updatedText = "새 노드";

              if (document.body.contains(inputField)) {
                document.body.removeChild(inputField);
              }

              activeEditNode.value = null;
              activeInputField.value = null;

              if (node.data.name === updatedText) {
                console.log("🔄 변경 없음: API 요청 스킵");
                return;
              }

              myDiagram.model.setDataProperty(node.data, "name", updatedText);
              myDiagram.startTransaction("update text");
              myDiagram.layoutDiagram(true);
              myDiagram.commitTransaction("update text");

              const success = await updateMindmapNode(
                node.data,
                paramProject_id.value,
                roomId.value
              );

              if (success) {
                console.log("✅ 서버에 노드 이름 업데이트 성공:", node.data);
                window.dispatchEvent(new CustomEvent("mindmap-updated"));
              } else {
                console.error("❌ 서버에 노드 이름 업데이트 실패");
              }
            };

            inputField.addEventListener("input", handleInput);
            inputField.addEventListener("keydown", handleTextFieldKeyDown);

            inputField.addEventListener("blur", () => {
              if (justOpened) return;
              blurTimeout = setTimeout(() => {
                completeEditing();
              }, 100);
            });

            inputField.addEventListener("focus", () => {
              if (blurTimeout) {
                clearTimeout(blurTimeout);
                blurTimeout = null;
              }
            });
          },
        },

        new go.Binding("movable", "", () => !isViewer.value).ofObject(),
        new go.Binding("isSelected", "isSelected"),
        new go.Binding("zOrder", "isSelected", (s) => (s ? 1 : 0)).makeTwoWay(),

        $(
          go.Panel,
          "Auto",
          {
            name: "NODE_PANEL",
            desiredSize: new go.Size(NaN, NaN),
            minSize: new go.Size(100, 40),
          },
          $(
            go.Shape,
            "RoundedRectangle",
            {
              fill: "white",
              strokeWidth: 3,
              stroke: "rgba(0, 0, 255, .15)",
              portId: "",
              fromSpot: go.Spot.RightSide,
              toSpot: go.Spot.LeftSide,
              parameter1: 20,
            },
            new go.Binding("fill", "parent", (p) =>
              p === 0 ? "#FFA500" : "white"
            ),
            new go.Binding("stroke", "", (data) => {
              if (data.isDropTarget) return "rgb(0, 70, 180)"; // 진한 파랑
              return data.isSelected
                ? "rgb(0, 170, 255)"
                : "rgba(0, 0, 255, .15)";
            }).makeTwoWay(),
            new go.Binding("strokeDashArray", "isSuggested", (isSuggested) =>
              isSuggested ? [10, 5] : null
            )
          ),
          $(
            go.Panel,
            "Horizontal",
            { margin: 8 },
            $(
              go.TextBlock,
              {
                font: "14px sans-serif",
                stroke: "red",
                visible: false,
              },
              new go.Binding("text", "name", (name) =>
                name && name.startsWith("*") ? "✎" : ""
              ),
              new go.Binding(
                "visible",
                "name",
                (name) => name && name.startsWith("*")
              )
            ),
            $(
              go.TextBlock,
              {
                name: "NAME_TEXTBLOCK",
              },
              new go.Binding("text", "name", (name) =>
                name ? name.replace(/^\*/, "") : ""
              ),
              new go.Binding("stroke", "parent", (p) =>
                p === 0 ? "#FFFFFF" : "black"
              ),
              new go.Binding("font", "parent", (p) =>
                p === 0 ? "bold 22px 'Arial'" : "bold 14px 'Arial'"
              )
            )
          )
        )
      );

      // 수정된 linkTemplate - 이름 추가
      myDiagram.linkTemplate = $(
        go.Link,
        {
          routing: go.Link.Orthogonal,
          corner: 5,
          adjusting: go.Link.None,
          fromEndSegmentLength: 1,
          toEndSegmentLength: 5,
        },
        $(
          go.Shape,
          {
            name: "LINK_SHAPE", // 🔥 이름 추가하여 찾기 쉽게
            strokeWidth: 2,
            stroke: "#555",
          },
          // ✅ 링크 데이터에서 isSuggested 확인 후 점선 적용
          new go.Binding("strokeDashArray", "isSuggested", (s) =>
            s ? [10, 5] : null
          )
        )
      );

      myDiagram.addDiagramListener("ChangedSelection", (e) => {
        const node = myDiagram.selection.first();

        myDiagram.model.nodeDataArray.forEach((n) => {
          if (n.isSelected) {
            myDiagram.model.setDataProperty(n, "isSelected", false);
          }
        });

        if (node) {
          const data = node.data;
          myDiagram.model.setDataProperty(data, "isSelected", true);
          selectedNode.value = data;
        } else {
          selectedNode.value = null;
        }
      });

      myDiagram.addDiagramListener("ViewportBoundsChanged", (e) => {
        currentZoom.value = myDiagram.scale;
        // zoom이 변경될 때마다 입력 필드 위치 업데이트
        updateInputFieldPosition();
      });
    };

    const handleResize = () => {
      if (
        is3DMode.value &&
        threeRenderer &&
        threeCamera &&
        threeCanvasRef.value
      ) {
        const width = threeCanvasRef.value.clientWidth;
        const height = threeCanvasRef.value.clientHeight;
        threeCamera.aspect = width / height;
        threeCamera.updateProjectionMatrix();
        threeRenderer.setSize(width, height);

        // CSS 렌더러 크기도 업데이트
        if (cssRenderer) {
          cssRenderer.setSize(width, height);
        }
      }

      socket.emit("update-mindmap-bounds", getMindmapBounds());
    };

    onMounted(async () => {
      console.log("✅ onMounted 실행됨");
      console.log("🧱 diagramDiv ref:", diagramDiv.value);

      // Three.js 컨테이너 참조를 확실히 얻기 위한 처리
      await nextTick();
      threeCanvasRef.value = document.querySelector(".three-container");
      console.log("🔍 마운트 시 three-container 참조:", threeCanvasRef.value);

      // 현재 로그인한 이메일을 세션에서 가져와 저장
      currentUserEmail.value = sessionStorage.getItem("userEmail") || "";
      console.log("🟡 세션에서 가져온 이메일:", currentUserEmail.value);

      await checkUserRole();
      console.log("🔍 사용자 권한 확인 완료:", isViewer.value);

      initDiagram();
      console.log("✅ 다이어그램 초기화 함수 호출 완료");

      // ✅ 다이어그램 포커스 시 테두리 제거 처리
      document.addEventListener("focusin", (e) => {
        const tag = e.target.tagName.toLowerCase();
        const isTextInput = ["input", "textarea", "select"].includes(tag);

        if (!isTextInput && e.target.closest(".mindmap-content")) {
          e.target.blur(); // 자동으로 포커스 제거
        }
      });

      // 3D 모드 전환 감시 로직 개선 (기존 watch 대체)
      watch(
        is3DMode,
        async (newVal, oldVal) => {
          console.log(`🔄 3D 모드 변경됨: ${newVal} (이전: ${oldVal})`);

          // 이전 상태 정리
          if (oldVal === true && newVal === false) {
            // 3D에서 2D로 전환
            stopThreeAnimation();
            destroyThree();

            // 2D 모드 캔버스 초기화 확인
            nextTick(() => {
              if (myDiagram) {
                myDiagram.requestUpdate();
              }
            });
          } else if (oldVal === false && newVal === true) {
            // 2D에서 3D로 전환
            await nextTick();

            // 명시적 참조 확보
            threeCanvasRef.value = document.querySelector(".three-container");
            console.log(
              "🔄 3D 모드 활성화 - 컨테이너 참조:",
              threeCanvasRef.value
            );

            if (!threeCanvasRef.value) {
              console.error("❌ 3D 컨테이너를 찾을 수 없음");
              is3DMode.value = false; // 모드 다시 비활성화
              showToast("3D 모드를 초기화할 수 없습니다.", true);
              return;
            }

            // 컨테이너가 렌더링될 때까지 잠시 대기
            setTimeout(() => {
              destroyThree(); // 이전 인스턴스 정리
              initThree(); // 새 인스턴스 초기화
            }, 100);
          }
        },
        { flush: "post" }
      ); // DOM 업데이트 후 실행

      watchEffect(() => {
        if (myDiagram && isViewer.value !== null) {
          myDiagram.updateAllTargetBindings();
        }
      });

      window.addEventListener("keydown", handleKeyDown);

      window.addEventListener("node-deleted", (event) => {
        if (event.detail.resetSelection) {
          selectedNode.value = null;
        }
      });

      // 창 크기 변경 시 Zdog 캔버스 업데이트
      window.addEventListener("resize", () => {
        // 3D 모드일 경우 Three.js 카메라 및 렌더러 리사이즈 처리
        if (
          is3DMode.value &&
          threeRenderer &&
          threeCamera &&
          threeCanvasRef.value
        ) {
          const width = threeCanvasRef.value.clientWidth;
          const height = threeCanvasRef.value.clientHeight;
          threeCamera.aspect = width / height;
          threeCamera.updateProjectionMatrix();
          threeRenderer.setSize(width, height);
        }

        // 여전히 mindmap 영역 정보는 WebRTC mouseTracking 등에서 필요함
        socket.emit("update-mindmap-bounds", getMindmapBounds());
      });

      // 노드 업데이트 이벤트 감지 시 3D 뷰도 업데이트
      // 노드 업데이트 이벤트 감지 시 3D 뷰도 업데이트
      window.addEventListener("mindmap-updated", () => {
        if (is3DMode.value && threeRoot) {
          // zdogIllo 대신 threeRoot 사용
          renderThreeMindmap();
        }
      });

      window.addEventListener("role-changed", async (event) => {
        const data = event.detail;

        // 멤버 목록에서 해당 사용자 찾기
        const member = invitedMembers.value.find(
          (m) => m.user_id === data.userId
        );
        if (member) {
          // 역할 업데이트 (viewer = 2, editor = 3)
          member.isAdmin = data.role === "viewer" ? 2 : 3;
        }

        // 현재 사용자의 역할이 변경된 경우 권한 즉시 업데이트
        if (data.email === currentUserEmail.value) {
          // 역할 상태 업데이트
          isViewer.value = data.role === "viewer";

          // 뷰어로 변경된 경우, 모달창이 열려있다면 닫기
          if (isViewer.value && isInviteModalOpen.value) {
            isInviteModalOpen.value = false;
          }

          // 알림 메시지
          const message = isViewer.value
            ? "당신의 역할이 뷰어로 변경되었습니다. 편집 권한이 제한됩니다."
            : "당신의 역할이 편집자로 변경되었습니다. 이제 편집이 가능합니다.";

          // 토스트 알림 표시
          showToast(message);
        }
      });

      window.addEventListener("member-removed", (event) => {
        const data = event.detail;

        // 해당 사용자가 현재 로그인한 사용자인 경우
        if (data.email === currentUserEmail.value) {
          showToast("당신은 더 이상 이 프로젝트의 멤버가 아닙니다.");
          setTimeout(() => {
            router.push("/MyMap");
          }, 1000);
        } else {
          // 멤버 목록에서 제거된 사용자 찾기
          invitedMembers.value = invitedMembers.value.filter(
            (m) => m.user_id !== data.userId
          );
          showToast(
            `"${data.name || data.email}" 님이 프로젝트에서 제거되었습니다.`
          );
        }
      });
    });

    onBeforeUnmount(() => {
      unregisterSocketHandlers(roomId, userId);

      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("node-deleted", () => {});
      window.removeEventListener("role-changed", () => {});
      window.removeEventListener("member-removed", () => {});
      window.removeEventListener("resize", handleResize);

      // handleMindmapUpdated 대신 mindmap-updated 이벤트 제거
      window.removeEventListener("mindmap-updated", () => {
        if (is3DMode.value && threeRoot) {
          renderThreeMindmap();
        }
      });

      // 3D 관련 리소스 정리
      if (is3DMode.value) {
        stopThreeAnimation();
        destroyThree();
      }

      // Three.js 리소스 정리 (옵션)
      threeRenderer = null;
      threeScene = null;
      threeCamera = null;
      threeRoot = null;
    });

    // mindmap 영역을 `mouseTracking.vue`에 전달
    socket.emit("update-mindmap-bounds", getMindmapBounds());

    window.addEventListener("resize", () => {
      socket.emit("update-mindmap-bounds", getMindmapBounds());
    });

    return {
      diagramDiv,
      mindmapContainer,
      getMindmapBounds,
      sidebarOpen,
      toggleSidebar,
      currentZoom,
      selectedNode,
      canAddSibling,
      increaseZoom,
      decreaseZoom,
      startDrag,
      stopDrag,
      dragMove,
      onWheel,
      startTouch,
      touchMove,
      stopTouch,
      deleteSelectedNode,
      addNode,
      suggestNodes,
      captureMindmap,
      goToDrawing,

      // ✅ 토스트 관련
      isToastVisible,
      toastMessage,
      isToastError,

      // ✅ 서버 상태 관련
      isSaving,
      lastSaveTime,
      serverError,

      // ✅ 라우팅 및 사용자 정보
      paramProject_id,
      roomId,
      userId,

      // ✅ 노드 편집 관련
      activeEditNode,
      activeInputField,

      // ✅ 팀원 초대 모달 관련 (새로 추가됨)
      isInviteModalOpen,
      inviteEmail,
      selectedRole,
      rootNodeName,
      openInviteModal,
      closeInviteModal,
      sendInvite,
      isViewer,
      invitedMembers,
      updateRole,
      confirmDeleteMember,

      autoJoinRoomId,

      is3DMode,
      toggleViewMode,

      isTopicSuggestionModalOpen,
      suggestedTopics,
      openTopicSuggestionModal,
      closeTopicSuggestionModal,
      isLoadingSuggestions,

      // 탭 관련
      activeTab,
      switchTab,

      // 추천 내역 관련
      isLoadingHistory,
      historyItems,
      loadHistory,
      confirmDeleteHistoryItem,
      isAIRecommending,
    };
  },
};
</script>

<style scoped>
.app-container {
  display: flex;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.sidebar {
  position: relative;
  width: 400px;
  height: 100vh;
  background-color: white;
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
  transition: width 0.3s ease;
  z-index: 1000;
}

.sidebar-collapsed {
  width: 30px;
}

.sidebar-toggle {
  position: absolute;
  right: -30px;
  top: 50%;
  transform: translateY(-50%);
  width: 30px;
  height: 60px;
  background-color: white;
  border: 1px solid #ddd;
  border-left: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  color: #333;
  font-size: 14px;
  font-weight: bold;
}

.sidebar-toggle:hover {
  background-color: #f5f5f5;
}

.sidebar-content {
  height: 100%;
  overflow-y: auto;
  padding: 20px;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.sidebar-content::-webkit-scrollbar {
  display: none;
}

.main-content {
  flex: 1;
  transition: margin-left 0.3s ease;
}

.main-expanded {
  margin-left: -370px;
}

.mindmap-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background-color: #eaeaea;
  display: flex;
  justify-content: center;
  align-items: center;
}

.mindmap-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.mindmap-content {
  width: 100%;
  height: 100%;
  background-color: #fafafa;
}

.zoom-controls {
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  bottom: 20px;
  background: white;
  padding: 5px;
  border-radius: 5px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 9999;
  transition: all 0.3s ease;
}

.zoom-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: #f0f0f0;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: bold;
  transition: background-color 0.3s ease;
}

.zoom-btn:hover {
  background: #e0e0e0;
}

.zoom-level {
  min-width: 50px;
  text-align: center;
  font-size: 16px;
  font-weight: 500;
}

.toast-message {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: #333;
  color: white;
  padding: 10px 20px;
  border-radius: 4px;
  z-index: 10001;
  font-size: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  animation: fadeIn 0.3s, fadeOut 0.3s 2.7s;
}

.toast-error {
  background-color: #ff3333;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes fadeOut {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

/* ✅ 초대 모달 개선 스타일 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
}

.modal-content {
  background: linear-gradient(to bottom, #ffffff, #f7f7f7);
  padding: 30px;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  width: 420px;
  text-align: center;
  animation: fadeSlideIn 0.3s ease-out;
}

.modal-content h2 {
  font-size: 22px;
  margin-bottom: 20px;
  color: #333;
}

.modal-content input,
.modal-content select {
  width: 100%;
  padding: 12px;
  margin: 10px 0;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  transition: border 0.3s ease, box-shadow 0.3s ease;
}

.modal-content input:focus,
.modal-content select:focus {
  border-color: #0898ff;
  box-shadow: 0 0 6px rgba(8, 152, 255, 0.3);
  outline: none;
}

/* 기본 모달 버튼 스타일 (공통 부분) */
.modal-buttons {
  display: flex;
  justify-content: center;
  gap: 12px;
}

/* 팀원 초대 모달의 버튼 스타일 */
.modal-content:not(.topic-suggestion-modal) .modal-buttons {
  margin-top: 20px !important; /* 팀원 초대 모달에서는 양수 마진 */
}

/* AI 주제 추천 모달의 버튼 스타일 */
.topic-suggestion-modal .modal-buttons {
  margin-top: -10px !important; /* AI 주제 추천 모달에서는 음수 마진 유지 */
}

.confirm-btn {
  background: #0898ff;
  color: white;
  border: none;
  padding: 10px 20px;
  font-weight: bold;
  font-size: 14px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.3s ease;
}

.confirm-btn:hover {
  background: #0079d3;
}

.cancel-btn {
  background: #e0e0e0;
  color: #333;
  border: none;
  padding: 10px 20px;
  font-weight: bold;
  font-size: 14px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.3s ease;
}

.cancel-btn:hover {
  background: #c7c7c7;
}

@keyframes fadeSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

button:focus {
  outline: none;
}

button:disabled {
  opacity: 1; /* 투명도 제거 */
  cursor: not-allowed;
  background-color: #d3d3d3 !important; /* 기본 회색 버튼 색상 */
  color: #666 !important; /* 텍스트 색상 */
}

.invited-list {
  margin-top: 20px;
  text-align: left;
}

.invited-list h3 {
  font-size: 16px;
  margin-bottom: 8px;
  color: #444;
}

.member-card-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 10px;
}

.member-card {
  background: white;
  padding: 12px 16px;
  border-radius: 10px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: transform 0.2s ease;
}

.member-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.member-email {
  font-weight: bold;
  color: #333;
  font-size: 14px;
}

.member-name {
  font-size: 13px;
  color: #777;
}

.member-role {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
  color: white;
}

.member-role.viewer {
  background-color: #9e9e9e;
}

.member-role.editor {
  background-color: #0898ff;
}

/* 멤버 이름 섹션 스타일 (새로 추가) */
.member-name-section {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* 기존 member-actions 스타일은 유지 */
.member-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 삭제 버튼 스타일 수정 - 더 작고 가벼운 느낌으로 */
.delete-member-btn {
  background-color: transparent;
  color: #ff4444;
  border: none;
  font-size: 14px; /* 글꼴 크기 약간 줄임 */
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px; /* 더 작게 */
  height: 20px; /* 더 작게 */
  border-radius: 50%;
  padding: 0;
  transition: all 0.2s ease;
  margin-left: 2px; /* 닉네임과의 간격 */
}

.delete-member-btn:hover {
  background-color: #ffeeee;
  color: #ff4444;
}

/* 나머지 스타일은 그대로 유지 */
.delete-confirm-btn {
  background: #ff4444;
  color: white;
  border: none;
  padding: 10px 20px;
  font-weight: bold;
  font-size: 14px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.3s ease;
}

.delete-confirm-btn:hover {
  background: #ff0000;
}

.delete-confirm p {
  margin-bottom: 20px;
  line-height: 1.5;
}

/* 기존 스타일 아래에 추가 */
.view-mode-controls {
  position: fixed;
  right: 140px;
  bottom: 20px;
  background: white;
  padding: 5px;
  border-radius: 5px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: 8px;
}

.view-mode-btn {
  padding: 8px 16px;
  border: none;
  background: #2196f3;
  color: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.view-mode-btn:hover {
  background: #0b7dda;
}

.zdog-container {
  width: 100%;
  height: 100%;
  background-color: #fafafa;
  cursor: move;
}

.three-container {
  width: 100%;
  height: 100%;
  background-color: #fafafa;
  overflow: hidden;
}

.three-text-label {
  pointer-events: none;
  user-select: none;
  background-color: transparent;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  text-shadow: 0 0 3px rgba(255, 255, 255, 0.7);
}

.fab-toolbar {
  position: fixed;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 12px;
  z-index: 9999;
}

.fab {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: #ffffff;
  border: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  color: #444;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.fab:hover {
  background-color: #f0f0f0;
  color: #111;
}

.fab:disabled {
  background-color: #e0e0e0;
  color: #999;
  cursor: not-allowed;
}

.fab[data-tooltip] {
  position: relative;
}

.fab[data-tooltip]::after {
  content: attr(data-tooltip);
  position: absolute;
  right: 110%;
  top: 50%;
  transform: translateY(-50%);
  background-color: rgba(50, 50, 50, 0.95);
  color: #fff;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 13px;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease;
  z-index: 10000;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.fab[data-tooltip]:hover::after {
  opacity: 1;
}

/* 주제 추천 모달 스타일 업데이트 */
.topic-suggestion-modal {
  width: 600px;
  max-width: 90vw;
  border-radius: 16px;
  padding: 32px;
  background: linear-gradient(to bottom, #ffffff, #f8f9ff);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.25);
  animation: modalFadeIn 0.4s ease-out;
}

.topic-suggestion-modal h2 {
  font-size: 28px;
  color: #333;
  margin-bottom: 24px;
  font-weight: 700;
  text-align: center;
  position: relative;
}

/* 🔥 로딩 중일 때만 제목 간격 줄이기 */
.topic-suggestion-modal:has(.loading-container) h2 {
  margin-bottom: 1px; /* 로딩 중일 때만 간격 줄임 */
}

.topic-suggestion-modal h2:after {
  content: "";
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 3px;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 3px;
}

.topic-suggestion-list {
  max-height: 430px;
  overflow-y: auto;
  margin: 28px 0;
  background-color: #ffffff;
  padding: 20px 20px 20px 25px;
  border-radius: 12px;
  text-align: left;
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.05);
  scrollbar-width: thin;
  scrollbar-color: #c4c9d4 #f1f2f6;
}

.topic-suggestion-list::-webkit-scrollbar {
  width: 8px;
}

.topic-suggestion-list::-webkit-scrollbar-track {
  background: #f1f2f6;
  border-radius: 4px;
}

.topic-suggestion-list::-webkit-scrollbar-thumb {
  background-color: #c4c9d4;
  border-radius: 4px;
  border: 2px solid #f1f2f6;
}

/* 주제 추천 모달 스타일 - 번호 중복 해결 */
.topic-suggestion-list ol {
  padding-left: 0;
  margin: 0;
  counter-reset: topic-counter;
  list-style-type: none; /* 기본 번호 매기기 제거 */
}

.topic-suggestion-list li {
  margin-bottom: 16px;
  line-height: 1.6;
  color: #444;
  font-size: 16px;
  position: relative;
  padding-left: 40px;
  counter-increment: topic-counter;
  list-style-type: none; /* 명시적으로 list-style-type 없애기 */
  /* 호버 효과는 텍스트에만 적용하기 위해 li에서 제거 */
}

/* 새로 추가: 텍스트 부분에 대한 스타일 */
.topic-suggestion-list .topic-text {
  display: inline-block;
}

/* 호버 효과를 텍스트에만 적용 */
.topic-suggestion-list li:hover .topic-text {
  transform: scale(1.03); /* 텍스트만 3% 확대 */
  color: #2d3d8a; /* 색상 변경은 유지 */
}

/* 번호 스타일은 그대로 유지 */
.topic-suggestion-list li::before {
  content: counter(topic-counter);
  position: absolute;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  font-size: 14px;
  font-weight: bold;
  border-radius: 50%;
  /* 번호에는 transform 효과를 적용하지 않음 */
}

.topic-suggestion-list li:last-child {
  margin-bottom: 0;
}

.modal-buttons {
  margin-top: 24px;
  display: flex;
  justify-content: center;
}

.topic-suggestion-modal .cancel-btn {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  padding: 12px 32px;
  font-weight: 600;
  font-size: 16px;
  border-radius: 30px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.topic-suggestion-modal .cancel-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 7px 15px rgba(102, 126, 234, 0.6);
}

.topic-suggestion-modal .cancel-btn:active {
  transform: translateY(1px);
}

@keyframes modalFadeIn {
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 로딩 스피너 스타일 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  gap: 2px;
}

.loading-text {
  font-family: "Noto Sans KR", sans-serif;
  font-size: 16px;
  font-weight: 500;
  color: #000;
  margin-top: 5px;
  opacity: 0.9;
  animation: text-pulse 2s ease-in-out infinite;
}

@keyframes text-pulse {
  0%,
  100% {
    opacity: 0.9;
  }
  50% {
    opacity: 0.6;
  }
}

.tab-buttons {
  display: flex;
  margin-bottom: 20px;
  background-color: #f8f9ff;
  border-radius: 10px;
  padding: 3px;
  gap: 3px;
}

.tab-button {
  flex: 1;
  padding: 10px 14px;
  border: none;
  background-color: transparent;
  color: #666;
  font-size: 14px;
  font-weight: 600;
  border-radius: 7px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.tab-button.active {
  background-color: white;
  color: #667eea;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.15);
}

.tab-button:hover:not(.active) {
  background-color: rgba(255, 255, 255, 0.6);
  color: #555;
}

.tab-button i {
  font-size: 13px;
}

/* 🔹 추천 내역 호버 효과 */
.topic-suggestion-list li:hover .history-item .topic-text {
  transform: scale(1.02);
  color: #2d3d8a;
}

.ai-simple-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: transparent;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10001;
}
</style>
