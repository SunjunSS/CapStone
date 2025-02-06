import { ref } from "vue";
import * as go from "gojs";

const isSaving = ref(false);
const lastSaveTime = ref(null);
const serverError = ref(null);

/**
 * 서버에서 마인드맵 데이터를 불러오는 함수
 * @param {go.Diagram} myDiagram - gojs 다이어그램 객체
 */
export const loadMindmapFromServer = async (myDiagram) => {
  try {
    serverError.value = null;

    const response = await fetch("http://localhost:3000/api/mindmap");
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message);
    }

    // 서버에서 받은 데이터가 있는 경우에만 다이어그램 모델 업데이트
    if (data.data && data.data.length > 0) {
      myDiagram.model = new go.TreeModel(data.data);
      console.log("서버에서 로드된 데이터:", data.data);
    } else {
      console.log("서버에 저장된 데이터가 없습니다.");
    }
  } catch (error) {
    console.error("마인드맵 로드 중 오류 발생:", error);
    serverError.value = error.message;
  }
};

export const saveMindmapToServer = async (addedNodes) => {
  if (!addedNodes || addedNodes.length === 0 || isSaving.value) {
    console.warn("🚨 서버로 보낼 새로운 노드가 없습니다.");
    return;
  }

  try {
    isSaving.value = true;
    serverError.value = null;

    // 🔹 올바른 JSON 데이터 구조로 변환
    const payload = { addedNodes: JSON.parse(JSON.stringify(addedNodes)) };

    console.log("🚀 서버로 전송할 데이터:", payload);

    const response = await fetch("http://localhost:3000/api/mindmap/save", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload), // 🔥 `addedNodes` 키를 올바르게 설정
    });

    const data = await response.json();
    console.log("🟢 서버 응답:", data);

    if (!data.success) {
      throw new Error(data.message);
    }

    lastSaveTime.value = new Date();
    return true; // ✅ 성공 여부 반환
  } catch (error) {
    console.error("❌ 마인드맵 저장 중 오류 발생:", error);
    serverError.value = error.message;
    return false; // ❌ 실패 시 false 반환
  } finally {
    isSaving.value = false;
  }
};

// 상태 값도 필요하면 export
export { isSaving, lastSaveTime, serverError };
