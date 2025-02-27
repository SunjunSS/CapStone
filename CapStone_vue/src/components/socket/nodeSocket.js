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

  console.log("✅ WebSocket 이벤트 리스너 등록 완료");

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

    // ✅ Set을 사용하여 중복 방지
    const nodesToDelete = new Set(deletedNodeKeys);

    nodesToDelete.forEach((nodeKey) => {
      const node = myDiagram.model.findNodeDataForKey(nodeKey);
      if (node) {
        myDiagram.model.removeNodeData(node);
      }
    });

    myDiagram.commitTransaction("delete nodes");

    console.log("✅ 클라이언트에서 삭제 완료:", [...nodesToDelete]);
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

  // 방에서 나가기
  if (roomIdValue) {
    socket.emit("leave-room", { roomId: roomIdValue, userId });
    console.log(`🚪 ${userId} 님이 ${roomIdValue} 방에서 나감`);
  } else {
    console.warn("⚠️ unregisterSocketHandlers: roomIdValue가 없음.");
  }
};
