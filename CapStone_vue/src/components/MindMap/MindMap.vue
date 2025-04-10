--뷰어 시 노드 드래그 비활성화 / 화면 클릭 후 드래그 시 네모 선택 박스 출력
비활성화--

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
        <div class="mindmap-container" ref="mindmapContainer">
          <div ref="diagramDiv" class="mindmap-content"></div>
        </div>

        <div class="zoom-controls">
          <button @click="decreaseZoom" class="zoom-btn">-</button>
          <span class="zoom-level">{{ Math.round(currentZoom * 100) }}%</span>
          <button @click="increaseZoom" class="zoom-btn">+</button>
        </div>

        <div class="delete-control">
          <button
            @click="deleteSelectedNode"
            class="delete-btn"
            :class="{
              'delete-btn-enabled': selectedNode && selectedNode.parent !== 0,
            }"
            :disabled="!selectedNode || selectedNode.parent === 0 || isViewer"
          >
            Delete Node
          </button>
        </div>

        <div class="add-controls" @keydown="handleKeyDown">
          <button
            @click="addNode(false)"
            class="add-btn"
            :class="{ 'add-btn-enabled': selectedNode }"
            :disabled="!selectedNode || isViewer"
          >
            하위레벨 추가
          </button>
          <button
            @click="addNode(true)"
            class="add-btn"
            :class="{ 'add-btn-enabled': canAddSibling }"
            :disabled="!selectedNode || isViewer"
          >
            동일레벨 추가
          </button>
          <button
            @click="captureMindmap"
            class="capture-btn"
            :disabled="isViewer"
          >
            마인드맵 캡처
          </button>
          <button @click="goToDrawing" class="drawing-btn" :disabled="isViewer">
            그림판
          </button>
          <button
            @click="suggestNodes"
            class="ai-suggest-btn"
            :class="{ 'ai-suggest-btn-enabled': selectedNode }"
            :disabled="!selectedNode || isViewer"
          >
            AI 추천
          </button>

          <!-- 🔹 팀원 초대 버튼 추가 -->
          <button
            @click="openInviteModal"
            class="invite-btn"
            :disabled="isViewer"
          >
            팀원 초대
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

        <!-- 초대한 팀원 리스트 -->
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
                  <!-- 삭제 버튼을 닉네임 옆으로 이동 -->
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
</template>

<script>
import { ref, onMounted, onBeforeUnmount, computed, watchEffect } from "vue";
import WebRTC from "..//WebRTC/WebRTC.vue";
import mouseTracking from "../WebRTC/mouseTracking.vue";
import * as go from "gojs";
import html2canvas from "html2canvas";
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

export default {
  components: {
    WebRTC,
    mouseTracking,
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
          completeEditing();
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

      console.log(
        "📌 startDrag 호출됨! isDragging:",
        isDragging.value,
        "isNodeDragging:",
        isNodeDragging.value
      );

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
        console.log(
          "⛔ dragMove 실행 중단! isDragging:",
          isDragging.value,
          "isNodeDragging:",
          isNodeDragging.value
        );
        return;
      }

      console.log("📌 dragMove 실행됨! 화면 이동 중...");

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
        aiParentNode.value = selectedNode.value; // 🔥 현재 선택된 노드를 AI 추천 부모 노드로 저장
      }

      console.log("🟢 AI 추천 버튼 클릭됨", aiParentNode.value);

      const suggestedNodes = await suggestChildNodes(
        paramProject_id.value,
        aiParentNode.value.key, // 🔥 기존 선택된 부모 노드를 유지
        roomId.value
      );

      if (suggestedNodes && suggestedNodes.length > 0) {
        const individualSuggestions = suggestedNodes
          .flatMap((s) =>
            s.split(",").map((s) => s.trim().replace(/^\d+\.\s*/, ""))
          ) // 숫자 제거
          .filter(Boolean);

        for (const suggestedName of individualSuggestions) {
          const newNode = {
            id: `temp-${Date.now()}`,
            key: `temp-${Date.now()}`,
            name: suggestedName,
            parent: aiParentNode.value.key, // 🔥 기존 선택된 부모 노드를 사용
            isSelected: false,
            project_id: paramProject_id.value,
            isSuggested: true,
          };

          await addNodeWithAnimation(newNode);
        }
      } else {
        console.error("❌ 추천된 노드를 받아오지 못했습니다.");
      }

      aiParentNode.value = null; // ✅ AI 추천 완료 후 초기화
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
      if (!myDiagram) return;

      // 캡처 전 토스트 메시지 표시
      showToast("마인드맵을 캡처 중입니다...");

      try {
        // 현재 다이어그램 영역 가져오기
        const diagramDiv = document.querySelector(".mindmap-content");

        // 루트 노드 찾기 (parent가 0인 노드)
        const rootNode = myDiagram.model.nodeDataArray.find(
          (node) => node.parent === 0
        );
        const rootNodeName = rootNode ? rootNode.name : "마인드맵";

        // 현재 날짜를 YYYY.MM.DD 형식으로 포맷팅
        const today = new Date();
        const formattedDate = `${today.getFullYear()}.${String(
          today.getMonth() + 1
        ).padStart(2, "0")}.${String(today.getDate()).padStart(2, "0")}`;

        // html2canvas로 캡처
        const canvas = await html2canvas(diagramDiv, {
          backgroundColor: "#fafafa", // 배경색 설정
          scale: 1.3, // 고해상도 캡처를 위한 스케일 설정
          useCORS: true, // 외부 이미지 로딩을 위한 설정
          logging: false, // 디버그 로그 비활성화
        });

        // 캡처된 이미지를 다운로드할 수 있도록 변환
        const imageUrl = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = imageUrl;

        // 새로운 파일명 형식 적용: YYYY.MM.DD-루트노드이름.png
        link.download = `${formattedDate}-${rootNodeName}.png`;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // 성공 메시지 표시
        showToast("마인드맵 캡처가 완료되었습니다.");
      } catch (error) {
        console.error("마인드맵 캡처 실패:", error);
        showToast("마인드맵 캡처에 실패했습니다.", true);
      }
    };

    const initDiagram = () => {
      const $ = go.GraphObject.make;

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
      loadMindmapFromServer(myDiagram, paramProject_id.value);

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

          // 기본값은 false, 바인딩으로 변경
          movable: false,

          // ✅ 드래그 시작 이벤트
          mouseDragEnter: (e, node) => {
            console.log("🟢 노드 드래그 시작됨!", node.data);
            isNodeDragging.value = true;
            isDragging.value = false;
          },

          // ✅ 드래그 종료 이벤트
          mouseDragLeave: (e, node) => {
            console.log("🛑 노드 드래그 종료됨!", node.data);
            isNodeDragging.value = false;
            if (!myDiagram.selection.first()) {
              isDragging.value = true;
            }
          },

          // ✅ 드롭 이벤트
          mouseDrop: (e, node) => {
            const draggedNode = e.diagram.selection.first();
            if (!draggedNode || draggedNode === node) return;

            console.log(
              "🟢 노드 이동 감지:",
              draggedNode.data,
              "=>",
              node.data
            );

            socket.emit("move-node", {
              roomId: roomId.value,
              movedNodeId: draggedNode.data.key,
              newParentId: node.data.key,
              project_id: paramProject_id.value,
            });

            isNodeDragging.value = false;
            isDragging.value = false;
          },

          // ✅ 더블 클릭으로 노드 이름 편집
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

            inputField.style.position = "absolute";
            inputField.style.backgroundColor = "white";
            inputField.style.outline = "none";
            inputField.style.maxWidth = "none";
            inputField.style.transition = "all 0.2s ease";
            inputField.style.zIndex = "9999";
            inputField.style.fontFamily = "sans-serif";

            document.body.appendChild(inputField);

            activeEditNode.value = node.data;
            activeInputField.value = inputField;

            updateInputFieldPosition();
            inputField.focus();

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
                activeInputField.value?.blur();
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
            };

            const completeEditing = async () => {
              if (!activeInputField.value) return;

              let updatedText = activeInputField.value.value
                .replace("✏️ ", "")
                .trim();

              if (!updatedText) {
                updatedText = "새 노드";
              }

              if (document.body.contains(activeInputField.value)) {
                document.body.removeChild(activeInputField.value);
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
              } else {
                console.error("❌ 서버에 노드 이름 업데이트 실패");
              }
            };

            inputField.addEventListener("input", handleInput);
            inputField.addEventListener("blur", completeEditing);
            inputField.addEventListener("keydown", handleTextFieldKeyDown);
            inputField.addEventListener("keydown", (e) => {
              const isSelectAll =
                (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a";
              if (isSelectAll) {
                e.preventDefault();
                const emojiOffset = editEmoji.length;
                inputField.setSelectionRange(
                  emojiOffset,
                  inputField.value.length
                );
              }
            });
          },
        },

        // 🔹 드래그 가능 여부를 isViewer 상태에 따라 바인딩
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
            new go.Binding("stroke", "isSelected", (s) =>
              s ? "rgb(0, 170, 255)" : "rgba(0, 0, 255, .15)"
            ),
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

    onMounted(async () => {
      // ✅ 현재 로그인한 이메일을 세션에서 가져와 저장
      currentUserEmail.value = sessionStorage.getItem("userEmail") || "";
      console.log("🟡 세션에서 가져온 이메일:", currentUserEmail.value);

      await checkUserRole();
      initDiagram();

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
      unregisterSocketHandlers(); // ✅ WebSocket 이벤트 해제

      // ✅ 전역 keydown 이벤트 리스너 제거
      window.removeEventListener("keydown", handleKeyDown);

      // 🔥 노드 삭제 이벤트 리스너 제거
      window.removeEventListener("node-deleted", () => {});

      // 이벤트 리스너 제거
      window.removeEventListener("role-changed", () => {});

      window.removeEventListener("member-removed", () => {});
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

.delete-control {
  position: fixed;
  right: 20px;
  bottom: 20px;
  background: white;
  padding: 5px;
  border-radius: 5px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 9999;
  transition: all 0.3s ease;
}

.delete-btn {
  width: 90px;
  height: 32px;
  border: none;
  background: #d3d3d3;
  border-radius: 4px;
  cursor: not-allowed;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 500;
  color: #666;
  transition: all 0.3s ease;
}

.delete-btn-enabled {
  background: #ff4444;
  color: white;
  cursor: pointer;
}

.delete-btn-enabled:hover {
  background: #ff0000;
}

.add-controls {
  position: fixed;
  right: 20px;
  top: 20px;
  background: white;
  padding: 5px;
  border-radius: 5px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 9999;
}

.add-btn {
  padding: 8px 16px;
  border: none;
  background: #d3d3d3;
  color: #666;
  border-radius: 4px;
  cursor: not-allowed;
  font-size: 14px;
  transition: all 0.3s ease;
}

.add-btn-enabled {
  background: #9c6cfe;
  color: white;
  cursor: pointer;
}

.add-btn-enabled:hover {
  background: #8a5bea;
}

.capture-btn {
  padding: 8px 16px;
  border: none;
  background: #4caf50;
  color: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.capture-btn:hover {
  background: #45a049;
}

.drawing-btn {
  padding: 8px 16px;
  border: none;
  background: #8d6e63;
  color: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.drawing-btn:hover {
  background: #0b7dda;
}

.ai-suggest-btn {
  padding: 8px 16px;
  border: none;
  background: #d3d3d3;
  color: #666;
  border-radius: 4px;
  cursor: not-allowed;
  font-size: 14px;
  transition: all 0.3s ease;
}

.ai-suggest-btn-enabled {
  background: #e040fb;
  color: white;
  cursor: pointer;
}

.ai-suggest-btn-enabled:hover {
  background: #d500f9;
}

.invite-btn {
  padding: 8px 16px;
  border: none;
  background: #0898ff;
  color: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.invite-btn:hover {
  background: #0079d3;
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

.modal-buttons {
  margin-top: 20px;
  display: flex;
  justify-content: center;
  gap: 12px;
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
</style>
