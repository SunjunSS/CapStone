const { sequelize } = require("../../models");
const nodeRepository = require("../../repositories/nodeRepository");
const projectRepository = require("../../repositories/projectRepository");

// 🟢 특정 프로젝트의 노드 추가
exports.addNodes = async (addedNodes, project_id) => {
  if (!addedNodes || addedNodes.length === 0) {
    throw new Error("추가할 노드 데이터가 없습니다.");
  }

  try {
    const projectIdAsNumber = parseInt(project_id, 10);

    // ✅ 배열이지만 한 개만 받으므로 0번 인덱스를 사용
    const { name, parent, isSelected } = addedNodes[0];

    // 🔥 단일 노드 추가
    const newNode = await nodeRepository.createNode(
      name || "새 노드",
      parent > 0 ? parent : null,
      projectIdAsNumber,
      isSelected
    );

    console.log("✅ 성공적으로 추가된 노드:", newNode.toJSON());

    return [
      {
        id: newNode.id,
        key: newNode.id,
        name: newNode.content,
        parent: newNode.parent_key ?? 0,
        project_id: newNode.project_id,
        isSelected: isSelected,
      },
    ];
  } catch (error) {
    console.error("❌ 노드 추가 중 오류 발생:", error.message);
    throw new Error(`노드 추가 중 오류 발생: ${error.message}`);
  }
};

// 🟢 루트 노드 생성
exports.createRootNode = async (project_id, project_name, transaction) => {
  try {
    const newNode = await nodeRepository.createNode(
      project_name,
      null,
      project_id,
      false,
      transaction
    );

    console.log("✅ 루트 노드 생성 완료:", newNode.toJSON());
    return newNode;
  } catch (error) {
    console.error("❌ 루트 노드 생성 중 오류:", error.message);
    throw new Error("루트 노드 생성 중 오류 발생");
  }
};

// 🔴 특정 프로젝트의 특정 노드 삭제 (자식 노드 포함)
exports.deleteNodeWithChildren = async (id, project_id) => {
  if (!id) {
    throw new Error("삭제할 노드의 id 값이 필요합니다.");
  }

  try {
    const nodeId = parseInt(id, 10);

    // ✅ 삭제 전, 자식 노드 목록을 가져오기 (ID만 추출)
    const nodesToDelete = await nodeRepository.getAllNodesByProject(project_id);
    const getAllChildNodes = (parentId) => {
      let toDelete = nodesToDelete.filter(
        (node) => node.parent_key === parentId
      );
      toDelete.forEach((node) => {
        toDelete = toDelete.concat(getAllChildNodes(node.id));
      });
      return toDelete;
    };

    const nodesToRemove = new Set(
      getAllChildNodes(nodeId).map((node) => node.id)
    );
    nodesToRemove.add(nodeId);
    const sortedNodesToRemove = [...nodesToRemove];

    console.log(`🗑️ 삭제할 노드 목록 (정렬 완료):`, sortedNodesToRemove);

    // ✅ 노드 삭제 실행
    await nodeRepository.deleteNodesByIds(nodeId, project_id);

    console.log(`🗑️ 요청된 노드 ${nodeId} 및 자식 노드 삭제 완료`);
    return sortedNodesToRemove;
  } catch (error) {
    console.error("❌ 노드 삭제 중 오류 발생:", error.message);
    throw new Error("노드 삭제 중 오류 발생");
  }
};

// ✏️ 특정 프로젝트의 특정 노드 수정 (트랜잭션 적용)
exports.updateNode = async (id, project_id, name) => {
  if (!id || !name) {
    throw new Error("수정할 노드의 id 값과 name 값이 필요합니다.");
  }

  const transaction = await sequelize.transaction();

  try {
    // ✅ 수정할 노드 조회
    const node = await nodeRepository.findNodeById(id, project_id, transaction);

    if (!node) {
      throw new Error("수정할 노드를 찾을 수 없습니다.");
    }

    // ✅ 노드 내용 업데이트
    const updatedCount = await nodeRepository.updateNodeContent(
      id,
      project_id,
      name,
      transaction
    );

    if (updatedCount === 0) {
      throw new Error("노드를 찾을 수 없거나 수정할 수 없습니다.");
    }

    console.log(`✅ 노드(${id}) 수정 완료:`, name);

    // ✅ 루트 노드일 경우 프로젝트 테이블의 이름도 변경
    if (node.parent_key === null) {
      console.log(`🔄 루트 노드 감지. 프로젝트(${project_id}) 이름도 변경`);
      await projectRepository.updateProjectName(project_id, name, transaction);
    }

    await transaction.commit();
    return { id: parseInt(id, 10), key: parseInt(id, 10), name };
  } catch (error) {
    await transaction.rollback();
    console.error("❌ 노드 수정 실패:", error.message);
    throw new Error("노드 수정 중 오류 발생");
  }
};

// 🟢 특정 프로젝트의 마인드맵 조회
exports.getMindmapByProjectId = async (project_id) => {
  try {
    const nodes = await nodeRepository.getAllNodesByProject(project_id);

    return {
      success: true,
      data: nodes.map(
        ({ id, content, parent_key, project_id, isSelected }) => ({
          id,
          key: id,
          name: content,
          parent: parent_key ?? 0,
          project_id,
          isSelected: isSelected,
        })
      ),
    };
  } catch (error) {
    console.error("❌ 프로젝트별 마인드맵 조회 실패:", error);
    throw new Error("마인드맵 데이터를 가져오는 중 오류 발생");
  }
};
