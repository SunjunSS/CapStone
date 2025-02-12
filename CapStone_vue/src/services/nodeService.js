import { ref } from "vue";
import * as go from "gojs";
import axios from "axios"; // 📌 axios 추가

const isSaving = ref(false);
const lastSaveTime = ref(null);
const serverError = ref(null);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL; // ✅ 환경변수 사용
const API_MINDMAP_URL = `${API_BASE_URL}/api/mindmap`;
console.log("마인드맵 api 주소값:", API_MINDMAP_URL);
/**
 * 서버에서 마인드맵 데이터를 불러오는 함수
 * @param {go.Diagram} myDiagram - gojs 다이어그램 객체
 */
export const loadMindmapFromServer = async (myDiagram) => {
  try {
    serverError.value = null;

    const response = await axios.get(API_MINDMAP_URL);
    const data = response.data;

    if (!data.success) {
      throw new Error(data.message);
    }

    if (data.data && data.data.length > 0) {
      myDiagram.model = new go.TreeModel(data.data);
      console.log("🟢 서버에서 로드된 데이터:", data.data);
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
export const saveMindmapToServer = async (addedNodes) => {
  if (!addedNodes || addedNodes.length === 0 || isSaving.value) {
    console.warn("🚨 서버로 보낼 새로운 노드가 없습니다.");
    return false;
  }

  try {
    isSaving.value = true;
    serverError.value = null;

    console.log("🚀 서버로 전송할 데이터:", addedNodes);

    const response = await axios.post(`${API_MINDMAP_URL}/save`, {
      addedNodes,
    });

    console.log("🟢 서버 응답:", response.data);

    if (!response.data.success) {
      throw new Error(response.data.message);
    }

    lastSaveTime.value = new Date();
    return true; // ✅ 성공 여부 반환
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
export const deleteMindmapNodes = async (deletedNodes) => {
  if (!deletedNodes || deletedNodes.length === 0) {
    console.warn("🚨 삭제할 노드가 없습니다.");
    return false;
  }

  try {
    console.log("🗑️ 삭제할 데이터:", deletedNodes);

    const response = await axios.delete(`${API_MINDMAP_URL}/delete`, {
      data: { deletedNodes },
    });

    console.log("🟢 삭제 요청 응답:", response.data);

    if (!response.data.success) {
      throw new Error(response.data.message);
    }

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
export const updateMindmapNode = async (updatedNode) => {
  if (!updatedNode || !updatedNode.key) {
    console.warn("🚨 수정할 노드 데이터가 없습니다.");
    return false;
  }

  try {
    console.log("✏️ 수정 요청 데이터:", updatedNode);

    const response = await axios.patch(`${API_MINDMAP_URL}/update`, {
      updatedNode,
    });

    console.log("🟢 수정 요청 응답:", response.data);

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
