const { Node } = require("../../models");

// 🟢 특정 프로젝트의 노드 추가
exports.addNodes = async (addedNodes, project_id) => {
  if (!addedNodes || addedNodes.length === 0) {
    throw new Error("추가할 노드 데이터가 없습니다.");
  }

  try {
    // console.log("📌 추가할 노드 데이터:", JSON.stringify(addedNodes, null, 2));
    // console.log("📌 project_id 값:", project_id);

    // // 🔥 Node 모델 필드 확인
    // console.log("📌 Node 모델 필드 확인:", Node.rawAttributes);

    const projectIdAsNumber = parseInt(project_id, 10); // ✅ project_id를 숫자로 변환

    // 🔥 기존 `node_key` 중 가장 큰 값 가져오기
    const maxKeyResult = await Node.findOne({
      attributes: [
        [Node.sequelize.fn("MAX", Node.sequelize.col("node_key")), "maxKey"],
      ],
      where: { project_id: projectIdAsNumber },
      raw: true,
    });

    const maxKey = maxKeyResult?.maxKey ?? 0; // 기존 key 값이 없으면 0부터 시작
    // console.log(`🆕 새로운 node_key 시작값: ${maxKey + 1}`);

    // 🔥 새로운 노드의 key 자동 생성
    let newKey = maxKey + 1;
    const newNodes = addedNodes.map(({ name, parent }) => ({
      node_key: newKey++, // ✅ 새로운 key 값 자동 할당
      content: name || "새 노드", // ✅ 기본값 설정
      parent_key: parent ?? null,
      project_id: projectIdAsNumber,
    }));

    // 🔥 DB에 저장
    const createdNodes = await Node.bulkCreate(newNodes, { validate: true });

    console.log(
      "✅ 성공적으로 추가된 노드:",
      JSON.stringify(createdNodes, null, 2)
    );

    return createdNodes.map(
      ({ id, node_key, content, parent_key, project_id }) => ({
        id,
        key: node_key,
        name: content,
        parent: parent_key ?? 0,
        project_id,
        isSelected: false,
      })
    );
  } catch (error) {
    console.error("❌ 노드 추가 중 오류 발생:", error.message);
    throw new Error(`노드 추가 중 오류 발생: ${error.message}`);
  }
};

// 🔴 특정 프로젝트의 특정 노드 삭제 (요청된 노드만 삭제)
exports.deleteNode = async (key, project_id) => {
  if (!key) {
    throw new Error("삭제할 노드의 key 값이 필요합니다.");
  }

  try {
    const nodeKey = parseInt(key, 10);

    // // ✅ 요청된 노드가 존재하는지 확인
    // const node = await Node.findOne({
    //   where: { node_key: nodeKey, project_id },
    // });

    // if (!node) {
    //   console.warn(`⚠️ 노드 ${nodeKey}는 이미 삭제되었거나 존재하지 않습니다.`);
    //   return nodeKey; // 이미 삭제된 경우라도 key 반환
    // }

    // ✅ 요청된 노드만 삭제 (자식 노드는 DB에서 자동 삭제됨)
    await Node.destroy({ where: { node_key: nodeKey, project_id } });

    console.log(
      `🗑️ 요청된 노드 ${nodeKey} 삭제 완료 (DB에서 하위 노드는 자동 삭제됨)`
    );
    return nodeKey; // 요청한 노드 key만 반환
  } catch (error) {
    console.error("❌ 노드 삭제 중 오류 발생:", error.message);
    throw new Error("노드 삭제 중 오류 발생");
  }
};

// ✏️ 특정 프로젝트의 특정 노드 수정
exports.updateNode = async (key, project_id, name) => {
  if (!key || !name) {
    throw new Error("수정할 노드의 key 값과 name 값이 필요합니다.");
  }

  try {
    const [updatedCount] = await Node.update(
      { content: name },
      { where: { node_key: key, project_id } }
    );

    if (updatedCount === 0) {
      throw new Error("노드를 찾을 수 없거나 수정할 수 없습니다.");
    }

    return { key: parseInt(key, 10), name };
  } catch (error) {
    console.error("❌ 노드 수정 실패:", error.message);
    throw new Error("노드 수정 중 오류 발생");
  }
};

// 🟢 특정 프로젝트의 마인드맵 조회
exports.getMindmapByProjectId = async (project_id) => {
  try {
    const nodes = await Node.findAll({
      where: { project_id }, // project_id가 일치하는 노드만 가져옴
      order: [["id", "ASC"]], // 정렬 추가 (선택 사항)
    });

    return {
      success: true,
      data: nodes.map(({ id, node_key, content, parent_key, project_id }) => ({
        id,
        key: node_key,
        name: content,
        parent: parent_key ?? 0,
        project_id,
        isSelected: false,
      })),
    };
  } catch (error) {
    console.error("❌ 프로젝트별 마인드맵 조회 실패:", error);
    throw new Error("마인드맵 데이터를 가져오는 중 오류 발생");
  }
};
