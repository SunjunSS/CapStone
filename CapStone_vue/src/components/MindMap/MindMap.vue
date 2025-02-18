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
      <mouseTracking class="mouse-tracking-layer" />

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
        <div class="mindmap-container">
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
            :class="{ 'delete-btn-enabled': selectedNode }"
            :disabled="!selectedNode"
          >
            Delete Node
          </button>
        </div>

        <div class="add-controls" @keydown="handleKeyDown">
          <button
            @click="addChildNode"
            class="add-btn"
            :class="{ 'add-btn-enabled': selectedNode }"
            :disabled="!selectedNode"
          >
            하위레벨 추가
          </button>
          <button
            @click="addSiblingNode"
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
import { ref, onMounted, onBeforeUnmount, computed } from "vue";
import WebRTC from "..//WebRTC/WebRTC.vue";
import mouseTracking from "../WebRTC/mouseTracking.vue";
import * as go from "gojs";
import {
  loadMindmapFromServer,
  serverError,
  saveMindmapToServer,
  deleteMindmapNodes,
  updateMindmapNode,
} from "@/services/nodeService";
import { socket, roomId, userId } from "../socket/socket.js"; // ✅ 전역 소켓 사용
export default {
  components: {
    WebRTC,
    mouseTracking,
  },
  setup() {
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

    const toggleSidebar = () => {
      sidebarOpen.value = !sidebarOpen.value;
    };

    // ✅ WebSocket 이벤트 리스너 추가
    // ✅ WebSocket 이벤트 리스너 추가
    socket.on("nodeAdded", (newNodes) => {
      console.log("🟢 새로운 노드 추가됨:", newNodes);

      if (!myDiagram) return;

      myDiagram.startTransaction("add node");

      newNodes.forEach((newNode) => {
        myDiagram.model.addNodeData(newNode); // ✅ 기존 다이어그램에 새 노드 추가
      });

      myDiagram.commitTransaction("add node");
    });

    socket.on("nodeUpdated", (updatedNode) => {
      console.log("✏️ 노드 수정됨:", updatedNode);

      if (!myDiagram) return;

      myDiagram.startTransaction("update node");

      // ✅ 해당 노드 데이터만 변경
      const node = myDiagram.model.findNodeDataForKey(updatedNode.key);
      if (node) {
        myDiagram.model.setDataProperty(node, "name", updatedNode.name);
        myDiagram.model.setDataProperty(
          node,
          "isSelected",
          updatedNode.isSelected
        );
      }

      myDiagram.commitTransaction("update node");
    });

    socket.on("nodeDeleted", (deletedNodes) => {
      console.log("🗑️ 노드 삭제됨:", deletedNodes);

      if (!myDiagram) return;

      myDiagram.startTransaction("delete node");

      deletedNodes.forEach((nodeKey) => {
        const node = myDiagram.model.findNodeDataForKey(nodeKey);
        if (node) {
          myDiagram.model.removeNodeData(node); // ✅ 해당 노드만 삭제
        }
      });

      myDiagram.commitTransaction("delete node");
    });

    // canAddSibling computed 속성 추가
    const canAddSibling = computed(() => {
      // 선택된 노드가 없으면 false
      if (!selectedNode.value) return false;

      // key가 1인 첫 번째 노드면 false
      if (selectedNode.value.key === 1) return false;

      return true;
    });

    const handleKeyDown = (event) => {
      // F5 키는 기본 동작 허용
      if (event.key === "F5") {
        return true;
      }

      // 나머지 키 이벤트 처리
      if (!selectedNode.value || !myDiagram) return;

      if (event.key === "Tab") {
        event.preventDefault();
        addChildNode();
      }

      if (event.key === "Shift") {
        event.preventDefault();
        addSiblingNode();
      }
    };

    const deleteSelectedNode = async () => {
      if (!selectedNode.value || !myDiagram) return;

      myDiagram.startTransaction("delete node");

      const node = myDiagram.findNodeForKey(selectedNode.value.key);
      if (!node) {
        myDiagram.commitTransaction("delete node");
        return;
      }

      // 🔥 삭제할 노드 리스트 수집
      const nodesToDelete = new Set();
      const collectDescendants = (node) => {
        nodesToDelete.add(node.data);
        node.findTreeChildrenNodes().each((child) => {
          collectDescendants(child);
        });
      };
      collectDescendants(node);

      // 🗑️ GoJS 모델에서 삭제
      nodesToDelete.forEach((nodeData) => {
        myDiagram.model.removeNodeData(nodeData);
      });

      myDiagram.commitTransaction("delete node");

      console.log("🗑️ 삭제된 노드 목록:", [...nodesToDelete]);

      // ✅ 서버에 삭제 요청 보내기
      const success = await deleteMindmapNodes([...nodesToDelete]);

      if (success) {
        console.log("✅ 서버에서 삭제 완료");
        selectedNode.value = null; // 삭제 후 선택된 노드 초기화
      } else {
        console.error("❌ 서버 삭제 실패: 프론트에서 롤백할 수도 있음");
      }
    };

    const animateZoom = (startZoom, targetZoom, startTime, duration) => {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;

      if (elapsed >= duration) {
        applyZoom(targetZoom);
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
      applyZoom(currentZoomLevel);

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

    const getTouchDistance = (touches) => {
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

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

    const stopTouch = () => {
      isDragging.value = false;
      initialTouchDistance.value = 0;
    };

    const addChildNode = async () => {
      if (!myDiagram) return;

      const parentKey = selectedNode.value ? selectedNode.value.key : 0;
      const newKey = myDiagram.model.nodeDataArray.length + 1;
      const project_id = selectedNode.value.project_id;
      const newNode = {
        key: newKey,
        name: "새 노드",
        parent: parentKey,
        isSelected: false,
        project_id: project_id,
      };

      // myDiagram.startTransaction("add child node");
      // myDiagram.model.addNodeData(newNode);
      // myDiagram.commitTransaction("add child node");

      addedNodes.value.push(newNode); // ✅ 새 노드 저장

      const success = await saveMindmapToServer(addedNodes.value);
      if (success) {
        addedNodes.value = []; // ✅ 저장 성공 시 초기화
      } else {
        console.warn("⏪ 서버 오류 발생: 다이어그램에서 추가한 노드 롤백");
        myDiagram.startTransaction("rollback add node");
        myDiagram.model.removeNodeData(newNode);
        myDiagram.commitTransaction("rollback add node");
      }
    };

    const addSiblingNode = async () => {
      // ✅ async 추가
      // canAddSibling이 false면 early return
      if (!canAddSibling.value) return;
      if (!selectedNode.value || !myDiagram) return;

      const parentKey = selectedNode.value.parent || 0;
      const newKey = myDiagram.model.nodeDataArray.length + 1;
      const project_id = selectedNode.value.project_id;
      const newNode = {
        key: newKey,
        name: "새 노드",
        parent: parentKey, // 🔥 부모 키가 없으면 `null`
        isSelected: false,
        project_id: project_id,
      };

      // myDiagram.startTransaction("add sibling node");
      // myDiagram.model.addNodeData(newNode);
      // myDiagram.commitTransaction("add sibling node");

      addedNodes.value.push(newNode); // ✅ 새 노드 저장

      console.log("✅ 새 동일 레벨 노드 추가됨:", newNode);

      const success = await saveMindmapToServer(addedNodes.value); // ✅ await 사용 가능
      if (success) {
        addedNodes.value = []; // ✅ 저장 성공 시 초기화
      } else {
        console.warn("⏪ 서버 오류 발생: 다이어그램에서 추가한 노드 롤백");
        myDiagram.startTransaction("rollback add node");
        myDiagram.model.removeNodeData(newNode);
        myDiagram.commitTransaction("rollback add node");
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

      // ✅ API 호출하여 서버에서 마인드맵 데이터 불러오기
      loadMindmapFromServer(myDiagram);

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

            const nodeBounds = nodeElement.getDocumentBounds();
            const diagramScale = myDiagram.scale;
            const editEmoji = "✏️ ";

            // 노드의 전체 너비를 가져옵니다
            const nodePanel = node.findObject("NODE_PANEL");
            const nodePanelWidth = nodePanel.actualBounds.width;

            // 최소 너비 설정
            const minWidth = 80;
            // 노드의 너비에 패딩을 추가하여 입력 필드의 너비 계산
            const inputWidth = Math.max(minWidth, nodePanelWidth + 30); // 24px는 좌우 패딩

            const inputField = document.createElement("input");
            inputField.value = editEmoji + node.data.name;

            const diagramPos = myDiagram.position;
            const inputHeight = 35;

            const nodeCenterX =
              (nodeBounds.x + nodeBounds.width / 2 - diagramPos.x) *
              diagramScale;
            const nodeTopY = (nodeBounds.y - diagramPos.y) * diagramScale;
            const x = nodeCenterX - inputWidth / 2;
            const y = nodeTopY - inputHeight - 20;

            inputField.style.position = "absolute";
            inputField.style.left = `${x}px`;
            inputField.style.top = `${y}px`;
            inputField.style.padding = "8px 12px";
            inputField.style.border = "2px solid #9C6CFE";
            inputField.style.borderRadius = "6px";
            inputField.style.fontSize = "14px";
            inputField.style.fontFamily = "sans-serif";
            inputField.style.backgroundColor = "white";
            inputField.style.boxShadow = "0 2px 6px rgba(0, 0, 0, 0.15)";
            inputField.style.outline = "none";
            inputField.style.width = `${inputWidth}px`;
            inputField.style.minWidth = `${minWidth}px`;
            inputField.style.maxWidth = "none"; // 최대 너비 제한 제거
            inputField.style.transition = "all 0.2s ease";
            inputField.style.zIndex = "9999";

            document.body.appendChild(inputField);
            inputField.focus();

            // 전체 선택 방지 + 커서를 맨 끝으로 이동
            setTimeout(() => {
              inputField.setSelectionRange(
                inputField.value.length,
                inputField.value.length
              );
            }, 0);

            const originalWidth = node.actualBounds.width;
            const directChildren = [];
            const it = node.findTreeChildrenNodes();
            while (it.next()) {
              const child = it.value;
              if (child.data.parent === node.data.key) {
                directChildren.push(child);
              }
            }

            let isBackspacePressed = false;

            inputField.addEventListener("input", () => {
              // 이모지가 삭제되지 않도록 처리
              if (!inputField.value.startsWith(editEmoji)) {
                inputField.value =
                  editEmoji + inputField.value.replace(editEmoji, "");
                inputField.setSelectionRange(
                  editEmoji.length,
                  inputField.value.length
                );
              }
            });

            inputField.addEventListener("keydown", (event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                inputField.blur();
              }

              // 백스페이스가 눌렸을 때 텍스트가 비어있으면 아무것도 지워지지 않도록
              if (event.key === "Backspace" && inputField.value === editEmoji) {
                event.preventDefault(); // 아무것도 지워지지 않도록
              }
            });

            inputField.addEventListener("blur", async () => {
              myDiagram.startTransaction("update node and layout");
              const wasSelected = node.data.isSelected;
              myDiagram.model.setDataProperty(
                node.data,
                "isSelected",
                !wasSelected
              );

              const updatedText = inputField.value
                .replace(editEmoji, "")
                .trim();
              myDiagram.model.setDataProperty(node.data, "name", updatedText);

              const newWidth = node.actualBounds.width;
              if (newWidth !== originalWidth) {
                const widthDifference = newWidth - originalWidth;
                directChildren.forEach((childNode) => {
                  const currentPos = childNode.position;
                  const updatedLocation = new go.Point(
                    currentPos.x + widthDifference,
                    currentPos.y
                  );
                  myDiagram.model.setDataProperty(
                    childNode.data,
                    "loc",
                    go.Point.stringify(updatedLocation)
                  );
                });
              }
              myDiagram.layoutDiagram(true);
              myDiagram.commitTransaction("update node and layout");

              document.body.removeChild(inputField);

              // ✅ API 요청: 이름이 변경되었으므로 서버에 업데이트 요청
              const success = await updateMindmapNode(node.data);
              if (success) {
                console.log("✅ 서버에 노드 이름 업데이트 성공:", node.data);
              } else {
                console.error("❌ 서버에 노드 이름 업데이트 실패");
              }
            });
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
        ),
        $(
          go.Panel,
          "Spot",
          {
            alignment: go.Spot.Right,
            alignmentFocus: go.Spot.Left,
            margin: new go.Margin(0, 0, 0, 15),
            desiredSize: new go.Size(25, 25),
            click: (e, obj) => {
              addChildNode();
              e.handled = true;
            },
            cursor: "pointer",
          },
          new go.Binding("visible", "", (node) => {
            if (!node.isSelected) return false;
            const nodeData = myDiagram.findNodeForKey(node.key);
            if (!nodeData) return false;
            return nodeData.findTreeChildrenNodes().count === 0;
          }).ofObject()
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
      socket.emit("leave-room", { roomId, userId }); // ✅ 방 나가기
      if (diagramDiv.value) {
        diagramDiv.value.removeEventListener("keydown", handleKeyDown);
      }
      // 컴포넌트가 언마운트되기 전 마지막으로 저장
      // saveMindmapToServer()
    });

    return {
      sidebarOpen,
      toggleSidebar,
      diagramDiv,
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
      addChildNode,
      addSiblingNode,
      isSaving,
      lastSaveTime,
      serverError,
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
