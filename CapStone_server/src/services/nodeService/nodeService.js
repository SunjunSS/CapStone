const { Node } = require("../../models");

// 🟢 특정 프로젝트의 노드 추가
exports.addNodes = async (addedNodes, project_id) => {
  if (!addedNodes || addedNodes.length === 0) {
    throw new Error("추가할 노드 데이터가 없습니다.");
  }

  try {
    const projectIdAsNumber = parseInt(project_id, 10); // ✅ project_id를 숫자로 변환

    // 🔥 새로운 노드 데이터 생성
    const newNodes = addedNodes.map(({ name, parent }) => ({
      content: name || "새 노드", // ✅ 기본값 설정
      parent_key: parent > 0 ? parent : null, // ✅ 부모 ID가 유효하지 않으면 NULL로 설정
      project_id: projectIdAsNumber,
    }));

    // 🔥 DB에 저장
    const createdNodes = await Node.bulkCreate(newNodes, { validate: true });

    console.log(
      "✅ 성공적으로 추가된 노드:",
      JSON.stringify(createdNodes, null, 2)
    );

    return createdNodes.map(({ id, content, parent_key, project_id }) => ({
      id,
      key: id, // ✅ key 필드를 id 값과 동일하게 설정
      name: content,
      parent: parent_key ?? 0, // 부모가 없으면 0으로 설정
      project_id,
      isSelected: false,
    }));
  } catch (error) {
    console.error("❌ 노드 추가 중 오류 발생:", error.message);
    throw new Error(`노드 추가 중 오류 발생: ${error.message}`);
  }
};

// 🔴 특정 프로젝트의 특정 노드 삭제 (자식 노드 포함)
exports.deleteNodeWithChildren = async (id, project_id) => {
  if (!id) {
    throw new Error("삭제할 노드의 id 값이 필요합니다.");
  }

  try {
    const nodeId = parseInt(id, 10);

    // ✅ 삭제할 노드 및 자식 노드 찾기
    const nodesToDelete = await Node.findAll({
      where: { project_id },
    });

    // ✅ 삭제할 노드 리스트 찾기 (재귀적으로 삭제)
    const getAllChildNodes = (parentId) => {
      let toDelete = nodesToDelete.filter(
        (node) => node.parent_key === parentId
      );
      toDelete.forEach((node) => {
        toDelete = toDelete.concat(getAllChildNodes(node.id)); // 🔥 `node_key` 대신 `id`
      });
      return toDelete;
    };

    const nodesToRemove = new Set(
      getAllChildNodes(nodeId).map((node) => node.id)
    ); // 🔥 `node_key` → `id`
    nodesToRemove.add(nodeId); // 부모 노드 추가

    const sortedNodesToRemove = [...nodesToRemove].sort((a, b) => a - b);

    console.log(`🗑️ 삭제할 노드 목록 (정렬 완료):`, sortedNodesToRemove);

    // ✅ 노드 삭제 실행
    await Node.destroy({
      where: {
        id: sortedNodesToRemove, // 🔥 `node_key` 대신 `id`
        project_id,
      },
    });

    console.log(`🗑️ 요청된 노드 ${nodeId} 및 자식 노드 삭제 완료`);
    return sortedNodesToRemove;
  } catch (error) {
    console.error("❌ 노드 삭제 중 오류 발생:", error.message);
    throw new Error("노드 삭제 중 오류 발생");
  }
};

// ✏️ 특정 프로젝트의 특정 노드 수정
exports.updateNode = async (id, project_id, name) => {
  if (!id || !name) {
    throw new Error("수정할 노드의 id 값과 name 값이 필요합니다.");
  }

  try {
    const [updatedCount] = await Node.update(
      { content: name },
      { where: { id, project_id } } // 🔥 `node_key` → `id`
    );

    if (updatedCount === 0) {
      throw new Error("노드를 찾을 수 없거나 수정할 수 없습니다.");
    }

    return { id: parseInt(id, 10), key: parseInt(id, 10), name };
  } catch (error) {
    console.error("❌ 노드 수정 실패:", error.message);
    throw new Error("노드 수정 중 오류 발생");
  }
};

// 🟢 특정 프로젝트의 마인드맵 조회
exports.getMindmapByProjectId = async (project_id) => {
  try {
    const nodes = await Node.findAll({
      where: { project_id },
      order: [["id", "ASC"]],
    });

    return {
      success: true,
      data: nodes.map(({ id, content, parent_key, project_id }) => ({
        id, // 🔥 `node_key` 제거
        key: id, // ✅ key 필드를 id 값과 동일하게 설정
        name: content,
        parent: parent_key ?? 0, // 부모 없으면 0
        project_id,
        isSelected: false,
      })),
    };
  } catch (error) {
    console.error("❌ 프로젝트별 마인드맵 조회 실패:", error);
    throw new Error("마인드맵 데이터를 가져오는 중 오류 발생");
  }
};
