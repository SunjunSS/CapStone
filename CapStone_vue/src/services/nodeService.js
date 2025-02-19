import { ref } from "vue";
import * as go from "gojs";
import axios from "axios"; // 📌 axios 추가

const isSaving = ref(false);
const lastSaveTime = ref(null);
const serverError = ref(null);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL; // ✅ 환경변수 사용
// const API_MINDMAP_URL = `${API_BASE_URL}/api/mindmap`;
// ✅ project_id를 기반으로 API URL 생성하는 함수
const getMindmapUrl = (project_id) =>
  `${API_BASE_URL}/api/mindmap/${project_id}`;

/**
 * 서버에서 마인드맵 데이터를 불러오는 함수
 * @param {go.Diagram} myDiagram - gojs 다이어그램 객체
 */
export const loadMindmapFromServer = async (myDiagram, project_id) => {
  try {
    if (!project_id) {
      throw new Error("🚨 project_id가 필요합니다.");
    }

    serverError.value = null;

    const response = await axios.get(getMindmapUrl(project_id)); // ✅ project_id 사용
    const data = response.data;

    if (!data.success) {
      throw new Error(data.message);
    }

    if (data.data && data.data.length > 0) {
      console.log("🟢 서버에서 로드된 데이터:", data.data);

      if (myDiagram) {
        myDiagram.clear();
      }

      myDiagram.model = new go.TreeModel(data.data);
    } else {
      console.log("⚠️ 서버에 저장된 데이터가 없습니다.");
    }
  } catch (error) {
    console.error("❌ 마인드맵 로드 중 오류 발생:", error);
    serverError.value = error.message;
  }
};

/**
 * 마인드맵 데이터를 서버에 저장하는 함수 (새로운 노드 추가)
 * @param {Array} addedNodes - 추가할 노드 리스트
 * @returns {boolean} 성공 여부
 */
export const saveMindmapToServer = async (addedNodes, project_id) => {
  if (!addedNodes || addedNodes.length === 0 || isSaving.value) {
    console.warn("🚨 서버로 보낼 새로운 노드가 없습니다.");
    return false;
  }

  try {
    if (!project_id) {
      throw new Error("🚨 project_id가 필요합니다.");
    }

    isSaving.value = true;
    serverError.value = null;

    console.log("🚀 서버로 전송할 데이터:", addedNodes);

    const response = await axios.post(`${getMindmapUrl(project_id)}`, {
      addedNodes,
      roomId: "room-1", // 🔥 반드시 포함!
    });

    console.log("🟢 서버 응답:", response.data);

    if (!response.data.success) {
      throw new Error(response.data.message);
    }

    lastSaveTime.value = new Date();

    return true;
  } catch (error) {
    console.error("❌ 마인드맵 저장 중 오류 발생:", error);
    serverError.value = error.message;
    return false;
  } finally {
    isSaving.value = false;
  }
};

/**
 * 특정 노드를 삭제하는 API 요청
 * @param {Array} deletedNodes - 삭제할 노드 리스트
 * @returns {boolean} 성공 여부
 */
export const deleteMindmapNodes = async (deletedNodes, project_id) => {
  if (!deletedNodes || deletedNodes.length === 0 || !project_id) {
    console.warn("🚨 삭제할 노드가 없거나 project_id가 없습니다.");
    return false;
  }

  try {
    console.log(
      `🗑️ 서버로 삭제 요청 (project_id=${project_id}):`,
      deletedNodes
    );

    // ✅ 한 번의 요청으로 삭제할 key 값만 서버로 보냄
    const nodeKeys = deletedNodes.map((node) => node.key);

    const response = await axios.delete(
      `${getMindmapUrl(project_id)}/${nodeKeys[0]}`,
      {
        data: { roomId: "room-1" },
      }
    );

    console.log("🟢 삭제 응답:", response.data);

    if (!response.data.success) {
      throw new Error(response.data.message);
    }

    // ✅ 서버에서 삭제된 노드 key 리스트를 반환받아 UI에서 업데이트
    return true;
  } catch (error) {
    console.error("❌ 노드 삭제 중 오류 발생:", error);
    serverError.value = error.message;
    return false;
  }
};

/**
 * 특정 노드 정보를 수정하는 API 요청
 * @param {Object} updatedNode - 수정할 노드 정보
 * @returns {boolean} 성공 여부
 */
export const updateMindmapNode = async (updatedNode, project_id) => {
  if (!updatedNode || !updatedNode.key) {
    console.warn("🚨 수정할 노드 데이터가 없습니다.");
    return false;
  }

  try {
    if (!project_id) {
      throw new Error("🚨 project_id가 필요합니다.");
    }

    console.log("✏️ 서버로 수정 요청 데이터:", updatedNode);

    const response = await axios.patch(
      `${getMindmapUrl(project_id)}/${updatedNode.key}`,
      {
        name: updatedNode.name,
        roomId: "room-1", // ✅ roomId 추가
      }
    );

    console.log("🟢 수정 응답:", response.data);

    if (!response.data.success) {
      throw new Error(response.data.message);
    }

    return true;
  } catch (error) {
    console.error("❌ 노드 수정 중 오류 발생:", error);
    serverError.value = error.message;
    return false;
  }
};

// 상태 값도 필요하면 export
export { isSaving, lastSaveTime, serverError };
