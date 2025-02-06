const express = require("express");
const cors = require("cors");

const app = express();

// JSON 파싱 및 CORS 미들웨어 설정
app.use(express.json());
app.use(cors());

// 마인드맵 데이터를 저장할 변수 (초기 데이터)
let mindmapData = [
  { key: 1, name: "캡스톤 마인드맵 탐색", parent: 0, isSelected: false },
  { key: 2, name: "퍼블릭시트", parent: 1, isSelected: false },
  { key: 3, name: "글로벌", parent: 1, isSelected: false },
  { key: 4, name: "마인드맵 생성", parent: 1, isSelected: false },
  { key: 5, name: "출처 정보 제공", parent: 2, isSelected: false },
  { key: 6, name: "음성인식", parent: 3, isSelected: false },
  { key: 7, name: "노이즈 제거", parent: 3, isSelected: false },
  { key: 8, name: "이미지 LLM", parent: 4, isSelected: false },
  { key: 9, name: "마인드맵 생성 트직 구현", parent: 4, isSelected: false },
];

// 🟢 1️⃣ 노드 추가 API (POST /api/mindmap/save)
app.post("/api/mindmap/save", (req, res) => {
  try {
    console.log("📥 받은 데이터:", req.body);

    const addedNodes = req.body.addedNodes || req.body.nodes || [];

    if (addedNodes.length === 0) {
      return res.status(400).json({
        success: false,
        message: "추가할 노드 데이터가 없습니다",
      });
    }

    // 새로운 노드 추가
    addedNodes.forEach((newNode) => {
      if (!mindmapData.some((node) => node.key === newNode.key)) {
        mindmapData.push(newNode);
      }
    });

    console.log("✅ 저장 후 마인드맵 데이터:", mindmapData);

    res.status(200).json({
      success: true,
      message: "마인드맵 데이터가 성공적으로 저장되었습니다",
      data: mindmapData,
    });
  } catch (error) {
    console.error("❌ 마인드맵 저장 중 오류 발생:", error);
    res.status(500).json({
      success: false,
      message: "마인드맵 데이터 저장 실패",
      error: error.message,
    });
  }
});

// 🔴 2️⃣ 노드 삭제 API (DELETE /api/mindmap/delete)
app.delete("/api/mindmap/delete", (req, res) => {
  try {
    console.log("🗑️ 삭제 요청 데이터:", req.body);

    const deletedNodes = req.body.deletedNodes || [];

    if (deletedNodes.length === 0) {
      return res.status(400).json({
        success: false,
        message: "삭제할 노드 데이터가 없습니다",
      });
    }

    // 삭제된 노드 제거
    mindmapData = mindmapData.filter(
      (node) => !deletedNodes.some((deleted) => deleted.key === node.key)
    );

    console.log("✅ 삭제 후 마인드맵 데이터:", mindmapData);

    res.status(200).json({
      success: true,
      message: "노드가 성공적으로 삭제되었습니다",
      data: mindmapData,
    });
  } catch (error) {
    console.error("❌ 노드 삭제 중 오류 발생:", error);
    res.status(500).json({
      success: false,
      message: "노드 삭제 실패",
      error: error.message,
    });
  }
});

// 🟡 3️⃣ 노드 수정 API (PATCH /api/mindmap/update)
app.patch("/api/mindmap/update", (req, res) => {
  try {
    console.log("✏️ 수정 요청 데이터:", req.body);

    const updatedNode = req.body.updatedNode;

    if (!updatedNode || !updatedNode.key) {
      return res.status(400).json({
        success: false,
        message: "수정할 노드 데이터가 없습니다",
      });
    }

    // 기존 데이터에서 해당 노드 찾기
    let nodeIndex = mindmapData.findIndex(
      (node) => node.key === updatedNode.key
    );

    if (nodeIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "해당 키를 가진 노드를 찾을 수 없습니다",
      });
    }

    // 기존 데이터 수정
    mindmapData[nodeIndex] = { ...mindmapData[nodeIndex], ...updatedNode };

    console.log("✅ 수정 후 마인드맵 데이터:", mindmapData);

    res.status(200).json({
      success: true,
      message: "노드가 성공적으로 수정되었습니다",
      data: mindmapData[nodeIndex],
    });
  } catch (error) {
    console.error("❌ 노드 수정 중 오류 발생:", error);
    res.status(500).json({
      success: false,
      message: "노드 수정 실패",
      error: error.message,
    });
  }
});

// 🟢 4️⃣ 마인드맵 데이터 조회 API (GET /api/mindmap)
app.get("/api/mindmap", (req, res) => {
  res.status(200).json({
    success: true,
    data: mindmapData,
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 서버가 포트 ${PORT}에서 실행 중입니다`);
});
