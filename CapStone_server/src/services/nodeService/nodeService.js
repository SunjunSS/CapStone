const { Node } = require("../../models"); // ✅ models/index.js에서 가져오기

// 🟢 노드 추가
exports.addNodes = async (addedNodes) => {
  try {
    console.log("📌 [DEBUG] 받은 addedNodes 데이터:", addedNodes); // ✅ 디버깅용 로그 추가

    if (!addedNodes || addedNodes.length === 0) {
      throw new Error("추가할 노드 데이터가 없습니다.");
    }

    // ✅ `project_id` 값 확인 (없으면 에러 발생)
    addedNodes.forEach((node) => {
      if (!node.project_id) {
        throw new Error(
          `❌ 노드 추가 실패: project_id 값이 없습니다. key=${
            node.key
          }, 받은 데이터: ${JSON.stringify(node)}`
        );
      }
    });

    // ✅ 필드명 변환하여 DB에 삽입
    const newNodes = await Node.bulkCreate(
      addedNodes.map(({ key, name, parent, project_id }) => ({
        node_key: key,
        content: name,
        parent_key: parent,
        project_id, // ✅ 필수 필드 포함
      }))
    );

    console.log(
      "✅ [DEBUG] 삽입된 노드 데이터:",
      newNodes.map((n) => n.toJSON())
    ); // ✅ 삽입된 데이터 확인

    return newNodes.map(
      ({ id, node_key, content, parent_key, project_id }) => ({
        id, // ✅ 노드의 ID 반환
        key: node_key,
        name: content,
        parent: parent_key ?? 0,
        project_id, // ✅ 프로젝트 ID 반환
      })
    );
  } catch (error) {
    console.error("❌ 노드 추가 실패:", error);
    throw error;
  }
};

// 🔴 노드 삭제
exports.deleteNodes = async (deletedNodes) => {
  try {
    if (!deletedNodes || deletedNodes.length === 0) {
      throw new Error("삭제할 노드 데이터가 없습니다.");
    }

    const keys = deletedNodes.map((node) => node.key);

    // ✅ 노드 삭제
    await Node.destroy({ where: { node_key: keys } });

    return keys;
  } catch (error) {
    console.error("❌ 노드 삭제 실패:", error);
    throw error;
  }
};

// 🟡 노드 수정
exports.updateNode = async (updatedNode) => {
  try {
    if (!updatedNode || !updatedNode.key) {
      throw new Error("수정할 노드 데이터가 없습니다.");
    }

    // ✅ 필드명 변환하여 업데이트
    await Node.update(
      { content: updatedNode.name },
      { where: { node_key: updatedNode.key } }
    );

    const updated = await Node.findOne({
      where: { node_key: updatedNode.key },
    });

    return {
      key: updated.node_key,
      name: updated.content,
      parent: updated.parent_key ?? 0,
    };
  } catch (error) {
    console.error("❌ 노드 수정 실패:", error);
    throw error;
  }
};

// 🟢 마인드맵 조회 (모든 노드 조회)
exports.getMindmap = async () => {
  try {
    const nodes = await Node.findAll();

    console.log(
      "📌 조회된 노드 목록:",
      nodes.map((node) => node.toJSON())
    );

    return {
      success: true,
      data: nodes.map(({ id, node_key, content, parent_key, project_id }) => ({
        id, // ✅ 데이터베이스의 고유 ID 포함
        key: node_key, // ✅ 프론트에서 사용하는 key로 변환
        name: content, // ✅ 프론트에서 사용하는 name으로 변환
        parent: parent_key ?? 0, // ✅ 부모 노드 (없으면 0)
        project_id, // ✅ 프로젝트 ID 포함
      })),
    };
  } catch (error) {
    console.error("❌ 마인드맵 조회 실패:", error);
    throw error;
  }
};
