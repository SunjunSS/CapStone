const { Node, sequelize } = require("../../models"); // ✅ 한 번만 선언
const { updateProjectName } = require("../projectService/projectService"); // ✅ projectService에서 함수 가져오기

// 🟢 특정 프로젝트의 노드 추가
exports.addNodes = async (addedNodes, project_id) => {
  if (!addedNodes || addedNodes.length === 0) {
    throw new Error("추가할 노드 데이터가 없습니다.");
  }

  try {
    const projectIdAsNumber = parseInt(project_id, 10); // ✅ project_id를 숫자로 변환

    // ✅ 배열이지만 한 개만 받으므로 0번 인덱스를 사용
    const { name, parent, isSelected } = addedNodes[0];

    // 🔥 단일 노드 추가 (create 사용)
    const newNode = await Node.create({
      content: name || "새 노드",
      parent_key: parent > 0 ? parent : null,
      project_id: projectIdAsNumber,
      isSelected: isSelected, // ✅ isSelected 필드를 addedNodes[0] 값과 동일하게 설정
    });

    console.log("✅ 성공적으로 추가된 노드:", newNode.toJSON());

    return [
      {
        id: newNode.id,
        key: newNode.id, // ✅ key 필드를 id 값과 동일하게 설정
        name: newNode.content, // ✅ DB의 `content` 값을 `name`으로 반환
        parent: newNode.parent_key ?? 0, // 부모가 없으면 0으로 설정
        project_id: newNode.project_id,
        isSelected: isSelected,
      },
    ];
  } catch (error) {
    console.error("❌ 노드 추가 중 오류 발생:", error.message);
    throw new Error(`노드 추가 중 오류 발생: ${error.message}`);
  }
};

exports.createRootNode = async (project_id, project_name, transaction) => {
  try {
    const newNode = await Node.create(
      {
        content: project_name, // ✅ 프로젝트 이름을 루트 노드 내용으로 사용
        parent_key: null, // 루트 노드는 부모 없음
        project_id: project_id,
        isSelected: false,
      },
      { transaction }
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

// ✏️ 특정 프로젝트의 특정 노드 수정 (트랜잭션 적용)
exports.updateNode = async (id, project_id, name) => {
  if (!id || !name) {
    throw new Error("수정할 노드의 id 값과 name 값이 필요합니다.");
  }

  const transaction = await sequelize.transaction(); // ✅ 트랜잭션 시작

  try {
    // ✅ 수정할 노드를 트랜잭션 내에서 조회
    const node = await Node.findOne({ where: { id, project_id }, transaction });

    if (!node) {
      throw new Error("수정할 노드를 찾을 수 없습니다.");
    }

    // ✅ 노드 내용 업데이트 (트랜잭션 포함)
    const [updatedCount] = await Node.update(
      { content: name },
      { where: { id, project_id }, transaction }
    );

    if (updatedCount === 0) {
      throw new Error("노드를 찾을 수 없거나 수정할 수 없습니다.");
    }

    console.log(`✅ 노드(${id}) 수정 완료:`, name);

    // ✅ 루트 노드일 경우 프로젝트 테이블의 이름도 변경
    if (node.parent_key === 0 || node.parent_key === null) {
      console.log(`🔄 루트 노드 감지. 프로젝트(${project_id}) 이름도 변경`);
      await updateProjectName(project_id, name, transaction); // ✅ 트랜잭션 포함
    }

    await transaction.commit(); // ✅ 모든 작업이 성공하면 커밋
    return { id: parseInt(id, 10), key: parseInt(id, 10), name };
  } catch (error) {
    await transaction.rollback(); // ❌ 오류 발생 시 롤백
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
      data: nodes.map(
        ({ id, content, parent_key, project_id, isSelected }) => ({
          id, // 🔥 `node_key` 제거
          key: id, // ✅ key 필드를 id 값과 동일하게 설정
          name: content,
          parent: parent_key ?? 0, // 부모 없으면 0
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
