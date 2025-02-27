import { ref } from "vue";
import * as go from "gojs";
import axios from "axios"; // 📌 axios 추가
import API_BASE_URL from "../config/apiConfig"; // ✅ 설정 파일에서 가져오기

const isSaving = ref(false);
const lastSaveTime = ref(null);
const serverError = ref(null);

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
export const saveMindmapToServer = async (addedNodes, project_id, roomId) => {
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
      roomId, // 🔥 반드시 포함!
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
export const deleteMindmapNodes = async (deletedKey, project_id, roomId) => {
  if (!deletedKey || !project_id) {
    console.warn("🚨 삭제할 노드의 key 값 또는 project_id가 없습니다.");
    return false;
  }

  try {
    console.log(
      `🗑️ 서버로 삭제 요청 (project_id=${project_id}, key=${deletedKey})`
    );

    // ✅ 서버에 삭제 요청만 보냄 (실제 삭제는 WebSocket 이벤트에서 처리)
    await axios.delete(`${getMindmapUrl(project_id)}/${deletedKey}`, {
      data: { roomId }, // ✅ WebSocket과 동기화
    });

    console.log("🟢 서버에 삭제 요청 완료 (실제 삭제는 WebSocket에서 처리)");
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
export const updateMindmapNode = async (updatedNode, project_id, roomId) => {
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
        roomId, // ✅ roomId 추가
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
