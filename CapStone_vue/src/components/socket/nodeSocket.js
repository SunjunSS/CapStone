import { socket } from "./socket"; // 기존 소켓 인스턴스 import
import * as go from "gojs";

/**
 * MindMap 소켓 이벤트 핸들러 모듈
 * @param {go.Diagram} myDiagram - go.js 다이어그램 객체
 * @param {string} roomId - 참여할 방의 ID
 * @param {string} userId - 참여할 사용자의 ID
 */
export const registerSocketHandlers = (myDiagram, roomId, userId) => {
  if (!myDiagram) {
    console.error("❌ myDiagram 객체가 없습니다. WebSocket 이벤트 등록 실패.");
    return;
  }

  // ✅ roomId가 computed 속성일 경우, .value 사용
  const roomIdValue = roomId.value ? roomId.value : roomId;

  // ✅ 소켓이 연결되지 않았을 경우 연결 시도
  if (!socket.connected) {
    socket.connect();
    console.log("🔗 소켓 연결 시도...");
  }

  // ✅ 방에 입장하는 로직 추가
  socket.emit("join-room", { roomId: roomIdValue, userId });
  console.log(`🏠 방 입장 요청: Room ID: ${roomIdValue}, User ID: ${userId}`);

  // ✅ 새로운 노드 추가 이벤트
  socket.on("nodeAdded", (newNodes) => {
    console.log("🟢 새로운 노드 추가됨:", newNodes);

    myDiagram.startTransaction("add node");
    newNodes.forEach((newNode) => {
      myDiagram.model.addNodeData(newNode);
    });
    myDiagram.commitTransaction("add node");
  });

  // ✅ 노드 수정 이벤트
  socket.on("nodeUpdated", (updatedNode) => {
    console.log("✏️ 노드 수정됨:", updatedNode);

    if (!updatedNode.key || !updatedNode.name) return;

    myDiagram.startTransaction("update node");

    const node = myDiagram.model.findNodeDataForKey(updatedNode.key);
    if (node) {
      myDiagram.model.setDataProperty(node, "name", updatedNode.name);
    } else {
      console.error("⚠️ 수정할 노드를 찾을 수 없음:", updatedNode);
    }

    myDiagram.commitTransaction("update node");
  });

  // ✅ 노드 삭제 이벤트
  socket.on("nodeDeleted", (deletedNodeKeys) => {
    console.log("🗑️ 삭제된 노드 리스트:", deletedNodeKeys);

    if (!Array.isArray(deletedNodeKeys) || deletedNodeKeys.length === 0) {
      console.error("🚨 잘못된 삭제 요청:", deletedNodeKeys);
      return;
    }

    if (!myDiagram) return;

    myDiagram.startTransaction("delete nodes");

    // ✅ 삭제할 노드 집합
    const nodesToDelete = new Set(deletedNodeKeys);

    // 🔥 삭제할 노드의 모든 자식 노드를 추가적으로 찾기
    deletedNodeKeys.forEach((parentKey) => {
      myDiagram.model.nodeDataArray.forEach((node) => {
        if (node.parent === parentKey) {
          nodesToDelete.add(node.key); // 부모가 삭제되면 자식도 삭제 대상
        }
      });
    });

    // 🔥 현재 선택된 노드가 삭제 대상 목록에 있는지 확인하고, 있다면 선택 상태 초기화
    const selectedNodeKey = myDiagram.selection.first()?.data?.key;
    let shouldResetSelection = false;

    if (selectedNodeKey && nodesToDelete.has(selectedNodeKey)) {
      shouldResetSelection = true;
    }

    nodesToDelete.forEach((nodeKey) => {
      const node = myDiagram.model.findNodeDataForKey(nodeKey);
      if (node) {
        myDiagram.model.removeNodeData(node);
      }
    });

    myDiagram.commitTransaction("delete nodes");

    // 🔥 삭제된 노드가 현재 선택된 노드였다면, 다이어그램의 선택 해제 및 selectedNode 초기화
    if (shouldResetSelection) {
      myDiagram.clearSelection();

      // Vue 컴포넌트의 selectedNode 초기화 (MindMap.vue의 ref)
      // 외부에서 접근 가능한 방식으로 상태 초기화
      window.dispatchEvent(
        new CustomEvent("node-deleted", { detail: { resetSelection: true } })
      );
    }

    console.log("✅ 클라이언트에서 삭제 완료:", [...nodesToDelete]);
  });

  // ✅ 서버로부터 노드 이동 이벤트를 받아 적용
  socket.on("nodeMoved", (updatedNode) => {
    console.log("🔄 [Vue] 노드 이동 이벤트 수신:", updatedNode);

    // 서버에서 보낸 데이터 구조 확인
    const nodeData = updatedNode.dataValues || updatedNode;

    // 노드 ID와 새 부모 ID 추출
    const nodeId = nodeData.id;
    const newParentId = nodeData.parent_key;

    console.log(
      `🔍 [Vue] 노드 이동 처리: 노드 ID ${nodeId}, 새 부모 ID ${newParentId}`
    );

    if (!nodeId) {
      console.error("🚨 [Vue] 노드 ID 없음:", nodeData);
      return;
    }

    // GoJS 다이어그램 모델에서 노드 검색
    // 주의: GoJS에서 사용하는 키 이름이 서버의 ID와 다를 수 있음
    const node =
      myDiagram.findNodeForKey(nodeId) ||
      myDiagram.findNodeForKey(String(nodeId));

    if (node) {
      console.log("✅ [Vue] 노드 찾음:", node.key);

      myDiagram.startTransaction("move node");

      // GoJS 모델에서 사용하는 부모 필드명 확인
      // 모델에 따라 'parent', 'group', 'parentId' 등 다양한 이름을 사용할 수 있음
      const parentFieldName = "parent";

      // 노드 데이터 객체 가져오기
      const nodeDataObj = node.data || node;

      // 부모 노드 업데이트
      myDiagram.model.setDataProperty(
        nodeDataObj,
        parentFieldName,
        newParentId
      );

      myDiagram.commitTransaction("move node");

      // 레이아웃 강제 업데이트
      myDiagram.layout.invalidateLayout();
      myDiagram.requestUpdate();

      console.log(
        `✅ [Vue] 노드 부모 업데이트 완료: ${nodeId} → ${newParentId}`
      );
    } else {
      console.warn(`🚨 [Vue] 노드 찾기 실패: ${nodeId}`);

      // 다이어그램의 모든 노드 키 출력하여 디버깅
      console.log("🔍 [Vue] 현재 다이어그램 노드 키 목록:");
      myDiagram.nodes.each((n) => console.log(n.key));
    }
  });

  console.log("✅ WebSocket 이벤트 리스너 등록 완료");
};

/**
 * WebSocket 이벤트 해제 함수 (컴포넌트 언마운트 시 호출)
 * @param {string} roomId - 방 ID
 * @param {string} userId - 사용자 ID
 */
export const unregisterSocketHandlers = (roomId, userId) => {
  if (!roomId || !userId) {
    console.warn("🚨 unregisterSocketHandlers: roomId 또는 userId가 없음.");
    return;
  }

  const roomIdValue =
    typeof roomId === "object" && roomId.value ? roomId.value : roomId;

  socket.off("nodeAdded");
  socket.off("nodeUpdated");
  socket.off("nodeDeleted");
  socket.off("nodeMoved"); // nodeMoved 이벤트도 해제

  // 방에서 나가기
  if (roomIdValue) {
    socket.emit("leave-room", { roomId: roomIdValue, userId });
    console.log(`🚪 ${userId} 님이 ${roomIdValue} 방에서 나감`);
  } else {
    console.warn("⚠️ unregisterSocketHandlers: roomIdValue가 없음.");
  }
};
