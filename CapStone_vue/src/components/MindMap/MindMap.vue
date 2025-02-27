<template>
  <div class="app-container">
    <!-- Sidebar for WebRTC -->
    <div class="sidebar" :class="{ 'sidebar-collapsed': !sidebarOpen }">
      <div class="sidebar-toggle" @click="toggleSidebar">
        {{ sidebarOpen ? "◀" : "▶" }}
      </div>
      <div class="sidebar-content" v-show="sidebarOpen">
        <WebRTC />
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
            :disabled="!selectedNode || selectedNode.parent === 0"
          >
            Delete Node
          </button>
        </div>

        <div class="add-controls" @keydown="handleKeyDown">
          <button
            @click="addNode(false)"
            class="add-btn"
            :class="{ 'add-btn-enabled': selectedNode }"
            :disabled="!selectedNode"
          >
            하위레벨 추가
          </button>
          <button
            @click="addNode(true)"
            class="add-btn"
            :class="{ 'add-btn-enabled': canAddSibling }"
            :disabled="!canAddSibling"
          >
            동일레벨 추가
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onBeforeUnmount, computed, watchEffect } from "vue";
import WebRTC from "..//WebRTC/WebRTC.vue";
import mouseTracking from "../WebRTC/mouseTracking.vue";
import * as go from "gojs";
import {
  loadMindmapFromServer,
  serverError,
  saveMindmapToServer,
  deleteMindmapNodes,
  updateMindmapNode,
} from "@/api/nodeApi";
import { socket } from "../socket/socket.js"; // ✅ 전역 소켓 사용
import { useRoute } from "vue-router"; // ✅ useRoute 추가
import {
  registerSocketHandlers,
  unregisterSocketHandlers,
} from "../socket/nodeSocket.js"; // ✅ WebSocket 핸들러 모듈 import

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

    const isDragging = ref(false);
    const isNodeDragging = ref(false);
    const lastMousePosition = ref({ x: 0, y: 0 });
    const lastTouchPosition = ref({ x: 0, y: 0 });
    const touchStartTime = ref(0);
    const initialTouchDistance = ref(0);
    let zoomAnimationFrame = null;
    let panAnimationFrame = null;
    let targetPosition = null;

    // 서버 통신 관련 상태 추가
    const isSaving = ref(false);
    const lastSaveTime = ref(null);
    const serverError = ref(null);

    const addedNodes = ref([]); // 새로 추가된 노드 저장

    const sidebarOpen = ref(false);

    // 현재 편집 중인 노드와 입력 필드를 추적하기 위한 refs
    const activeEditNode = ref(null);
    const activeInputField = ref(null);

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
    const paramProject_id = ref(route.params.project_id); // ✅ URL에서 project_id 가져오기

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
      isDragging.value = true;
      lastMousePosition.value = {
        x: event.clientX,
        y: event.clientY,
      };
    };

    const stopDrag = () => {
      isDragging.value = false;
      isNodeDragging.value = false;
    };

    const dragMove = (event) => {
      if (!isDragging.value || !myDiagram || isNodeDragging.value) return;

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
          layerStyle: go.TreeLayout.LayerUniform,
        }),
        model: $(go.TreeModel),
        "animationManager.isEnabled": true,
        "animationManager.duration": ANIMATION_DURATION,
        scale: currentZoom.value,
      });
      // ✅ WebSocket 이벤트 등록
      registerSocketHandlers(myDiagram, roomId, userId);

      // ✅ API 호출하여 서버에서 마인드맵 데이터 불러오기
      loadMindmapFromServer(myDiagram, paramProject_id.value);

      myDiagram.addDiagramListener("ObjectSingleClicked", (e) => {
        const part = e.subject.part;
        if (part instanceof go.Node) {
          const node = part.data;
          console.log("Selected Node:", node);
          selectedNode.value = node;
        }
      });

      myDiagram.nodeTemplate = $(
        go.Node,
        "Spot",
        {
          selectionAdorned: false,
          resizable: false,
          layoutConditions: go.Part.LayoutStandard & ~go.Part.LayoutNodeSized,
          mouseDragEnter: (e, node) => {
            isNodeDragging.value = true;
          },
          mouseDragLeave: (e, node) => {
            isNodeDragging.value = false;
          },
          doubleClick: (e, node) => {
            const nodeElement = node.findObject("NAME_TEXTBLOCK");
            if (!nodeElement) return;

            const editEmoji = "✏️ ";
            const inputField = document.createElement("input");
            inputField.value = editEmoji + node.data.name;

            // 입력 필드 기본 스타일 설정
            inputField.style.position = "absolute";
            inputField.style.backgroundColor = "white";
            inputField.style.outline = "none";
            inputField.style.maxWidth = "none";
            inputField.style.transition = "all 0.2s ease";
            inputField.style.zIndex = "9999";
            inputField.style.fontFamily = "sans-serif";

            document.body.appendChild(inputField);

            // 활성 노드와 입력 필드 참조 저장
            activeEditNode.value = node.data;
            activeInputField.value = inputField;

            // 초기 위치와 크기 설정
            updateInputFieldPosition();

            inputField.focus();

            // 입력 필드 이벤트 핸들러
            const handleInput = () => {
              const editEmoji = "✏️ ";
              // 현재 입력값에서 이모지를 제외한 텍스트 부분만 가져옴
              const textContent = inputField.value.replace(editEmoji, "");

              // 이모지가 없는 경우에만 추가
              if (!inputField.value.startsWith(editEmoji)) {
                inputField.value = editEmoji + textContent;
                // 커서 위치 조정
                inputField.setSelectionRange(
                  editEmoji.length,
                  inputField.value.length
                );
              }
            };

            // 이름을 handleTextFieldKeyDown으로 변경
            const handleTextFieldKeyDown = (e) => {
              const editEmoji = "✏️ ";

              if (e.key === "Enter") {
                e.preventDefault();
                completeEditing();
              }

              // 백스페이스 키 처리
              if (e.key === "Backspace") {
                const textContent = inputField.value.replace(editEmoji, "");
                // 텍스트가 비어있고 커서가 이모지 바로 뒤에 있을 때
                if (
                  textContent === "" &&
                  inputField.selectionStart <= editEmoji.length
                ) {
                  e.preventDefault(); // 백스페이스 동작 막기
                }
              }
            };

            // 텍스트 편집 완료 처리를 위한 함수
            const completeEditing = async () => {
              const updatedText = inputField.value
                .replace(editEmoji, "")
                .trim();

              // 입력 필드와 참조 정리
              document.body.removeChild(inputField);
              activeEditNode.value = null;
              activeInputField.value = null;

              if (node.data.name === updatedText) {
                console.log("🔄 변경 없음: API 요청 스킵");
                return;
              }

              // 노드 이름 업데이트 및 저장 로직
              myDiagram.model.setDataProperty(node.data, "name", updatedText);

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

            // Enter 키 이벤트 핸들러 추가
            const handleKeyDown = (e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                completeEditing();
              }
            };

            inputField.addEventListener("input", handleInput);
            inputField.addEventListener("blur", completeEditing);
            inputField.addEventListener("keydown", handleTextFieldKeyDown); // Enter 키 이벤트 리스너 추가
          },
        },
        new go.Binding("isSelected", "isSelected"),
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
            },
            new go.Binding("fill", "parent", (p) =>
              p === 0 ? "#FFF612" : "white"
            ),
            new go.Binding("stroke", "isSelected", (s) =>
              s ? "blue" : "rgba(0, 0, 255, .15)"
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
                font: "14px sans-serif",
                stroke: "black",
              },
              new go.Binding("text", "name", (name) =>
                name ? name.replace(/^\*/, "") : ""
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
        $(go.Shape, {
          strokeWidth: 2,
          stroke: "#555",
        })
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

    onMounted(() => {
      initDiagram();

      // diagramDiv에 keydown 이벤트 리스너 추가
      if (diagramDiv.value) {
        diagramDiv.value.addEventListener("keydown", handleKeyDown);
      }
    });

    onBeforeUnmount(() => {
      unregisterSocketHandlers(); // ✅ WebSocket 이벤트 해제

      if (diagramDiv.value) {
        diagramDiv.value.removeEventListener("keydown", handleKeyDown);
      }
      // 컴포넌트가 언마운트되기 전 마지막으로 저장
      // saveMindmapToServer()
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
      isSaving,
      lastSaveTime,
      serverError,
      paramProject_id,
      roomId,
      userId,
      activeEditNode,
      activeInputField,
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
  color: #333; /* 텍스트 색상 추가 */
  font-size: 14px; /* 텍스트 크기 지정 */
  font-weight: bold; /* 텍스트를 굵게 */
}

/* 호버 효과 추가 */
.sidebar-toggle:hover {
  background-color: #f5f5f5;
}

.sidebar-content {
  height: 100%;
  overflow-y: auto;
  padding: 20px;
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
  background: #d3d3d3; /* disabled 상태의 기본 색상 */
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

.mindmap-wrapper:focus {
  outline: none;
  box-shadow: 0 0 2px 2px rgba(0, 0, 255, 0.2);
}

.sidebar-content {
  height: 100%;
  overflow-y: auto;
  padding: 20px;
  /* 스크롤바 숨기기를 위한 CSS 추가 */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
}

/* Webkit (Chrome, Safari, Opera) 브라우저용 스크롤바 숨기기 */
.sidebar-content::-webkit-scrollbar {
  display: none;
}
</style>
