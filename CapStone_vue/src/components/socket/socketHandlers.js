import { socket } from "./socket"; // 기존 소켓 인스턴스 import
import * as go from "gojs";

/**
 * MindMap 소켓 이벤트 핸들러 모듈
 * @param {go.Diagram} myDiagram - go.js 다이어그램 객체
 */
export const registerSocketHandlers = (myDiagram) => {
  if (!myDiagram) {
    console.error("❌ myDiagram 객체가 없습니다. WebSocket 이벤트 등록 실패.");
    return;
  }

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
      console.error("node가 비어 있음:", updatedNode);
    }

    myDiagram.commitTransaction("update node");
  });

  // ✅ 노드 삭제 이벤트 (서버에서 승인된 삭제 요청)
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
 */
export const unregisterSocketHandlers = () => {
  socket.off("nodeAdded");
  socket.off("nodeUpdated");
  socket.off("nodeDeleted");
  console.log("❌ WebSocket 이벤트 리스너 해제 완료");
};
