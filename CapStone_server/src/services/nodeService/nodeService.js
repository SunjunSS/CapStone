const { sequelize } = require("../../models");
const nodeRepository = require("../../repositories/nodeRepository");
const projectRepository = require("../../repositories/projectRepository");
const openaiService = require("./openaiService");

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

    await projectRepository.touchProjectUpdatedAt(projectIdAsNumber);

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

exports.addKeywordsAsNodes = async (projectId, keywordList) => {
  try {
    if (!keywordList || keywordList.length === 0) {
      throw new Error("추가할 키워드 목록이 비어 있습니다.");
    }

    const createdNodes = [];

    for (const keywordObj of keywordList) {
      const { name, parent_key } = keywordObj;

      const newNode = await nodeRepository.createNode(
        name, // content
        parent_key, // parent_key
        projectId, // project_id
        false // isSelected (기본값 false)
      );

      createdNodes.push({
        id: newNode.id,
        key: newNode.id,
        name: newNode.content,
        parent: newNode.parent_key ?? 0,
        project_id: newNode.project_id,
        isSelected: newNode.isSelected,
      });
    }

    console.log(`✅ ${keywordList.length}개의 키워드 노드를 추가했습니다.`);

    return { success: true, nodes: createdNodes };
  } catch (error) {
    console.error("❌ 키워드 노드 추가 실패:", error);
    return { success: false, error: error.message };
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

    await projectRepository.touchProjectUpdatedAt(project_id, transaction);

    console.log("✅ 루트 노드 생성 완료:", newNode.toJSON());

    return newNode;
  } catch (error) {
    console.error("❌ 루트 노드 생성 중 오류:", error.message);
    throw new Error("루트 노드 생성 중 오류 발생");
  }
};

// 🔴 부모 노드 삭제 시, AI 추천 노드도 함께 삭제
exports.deleteNodeWithChildren = async (id, project_id) => {
  if (!id) {
    throw new Error("삭제할 노드의 id 값이 필요합니다.");
  }

  try {
    const nodeId = parseInt(id, 10);

    // ✅ 삭제 전, 프로젝트의 모든 노드 가져오기
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

    // ✅ 삭제할 노드 + 자식 노드 목록 수집
    const nodesToRemove = new Set(
      getAllChildNodes(nodeId).map((node) => node.id)
    );
    nodesToRemove.add(nodeId);

    console.log(`🗑️ 삭제할 노드 목록:`, [...nodesToRemove]);

    // ✅ 노드 삭제 실행
    await nodeRepository.deleteNodesByIds([...nodesToRemove], project_id);

    await projectRepository.touchProjectUpdatedAt(project_id);
    console.log(`🗑️ 요청된 노드 및 하위 노드 삭제 완료`);
    return [...nodesToRemove];
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

    await projectRepository.touchProjectUpdatedAt(project_id, transaction);

    await transaction.commit();
    return { id: parseInt(id, 10), key: parseInt(id, 10), name };
  } catch (error) {
    await transaction.rollback();
    console.error("❌ 노드 수정 실패:", error.message);
    throw new Error("노드 수정 중 오류 발생");
  }
};

// ✅ 노드 이동 서비스 함수 (부모가 자식 노드로 이동하는지 검증 추가)
exports.moveNode = async (movedNodeId, newParentId, project_id) => {
  console.log("📌 [moveNode] 서비스 호출됨:", {
    movedNodeId,
    newParentId,
    project_id,
  });

  const nodes = await nodeRepository.getAllNodesByProject(project_id);
  if (!nodes || nodes.length === 0) {
    throw new Error("해당 프로젝트의 노드 데이터를 찾을 수 없습니다.");
  }

  // 🔍 자식 노드인지 확인하는 재귀 함수
  const isDescendant = (nodeId, potentialParentId) => {
    const childNodes = nodes.filter((node) => node.parent_key === nodeId);
    for (const child of childNodes) {
      if (
        child.id === potentialParentId ||
        isDescendant(child.id, potentialParentId)
      ) {
        return true;
      }
    }
    return false;
  };

  // 🚨 부모 노드가 자식 노드로 이동하려는 경우 에러 발생
  if (isDescendant(movedNodeId, newParentId)) {
    console.error(
      "🚨 이동 불가: 부모 노드가 자식 노드의 하위로 이동할 수 없음!",
      {
        movedNodeId,
        newParentId,
      }
    );
    throw new Error("부모 노드는 자식 노드의 하위로 이동할 수 없습니다.");
  }

  // ✅ 노드 이동 로직 실행
  const node = await nodeRepository.findNodeById(movedNodeId, project_id);
  if (!node) throw new Error("노드를 찾을 수 없습니다.");

  node.parent_key = newParentId;
  await node.save();

  await projectRepository.touchProjectUpdatedAt(project_id);
  console.log("✅ [moveNode] 노드 부모 업데이트 완료");
  return node;
};

// 🟢 특정 프로젝트의 마인드맵 조회
exports.getMindmapByProjectId = async (project_id) => {
  try {
    const nodes = await nodeRepository.getAllNodesByProject(project_id);
    console.log(`📌가져온 데이터: ${nodes}`);
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

// 선택된 노드의 하위 노드 ai요청을 위한 서비스 로직
exports.getSuggestedChildNodes = async (project_id, key) => {
  try {
    console.log("🚩 [getSuggestedChildNodes] 시작됨:", { project_id, key });

    // 노드 데이터 가져오기
    const nodes = await nodeRepository.getAllNodesByProject(project_id);
    if (!nodes || nodes.length === 0) {
      throw new Error("해당 프로젝트의 노드 데이터를 찾을 수 없습니다.");
    }

    const nodeData = nodes.map((node) => node.dataValues);
    console.log("📚 전체 노드 데이터:", nodeData);

    // 루트 노드 확인
    const rootNode = nodeData.find(
      (node) => node.parent_key === null || node.parent_key === 0
    );
    if (!rootNode) {
      throw new Error("루트 노드를 찾을 수 없습니다.");
    }
    console.log("🌳 루트 노드:", rootNode);

    // 선택된 노드 확인
    const selectedNode = nodeData.find((node) => node.id == key);
    if (!selectedNode) {
      throw new Error(`선택된 노드 (key=${key})를 찾을 수 없습니다.`);
    }
    console.log("👉 선택된 노드:", selectedNode);

    // 부모 노드 확인
    const parentNode = nodeData.find(
      (node) => node.id === selectedNode.parent_key
    );
    const parentName = parentNode ? parentNode.content : "없음";
    console.log("👪 부모 노드 이름:", parentName);

    // 모든 노드 이름 목록
    const relatedNodes = nodeData.map((node) => node.content);
    console.log("📝 프로젝트의 모든 노드 이름:", relatedNodes);

    const project = await projectRepository.getProjectById(project_id);
    const rawCategory = project?.category || "default";
    // 띄어쓰기 제거 예시 (공백 제거)
    const category = rawCategory.replace(/\s+/g, "");

    // OpenAI API 호출 전 로그 추가
    console.log("🚀 OpenAI API 호출 준비중...");

    const aiSuggestions = await openaiService.getMindmapSuggestions(
      rootNode.content,
      selectedNode.content,
      parentName,
      relatedNodes,
      category
    );

    if (!aiSuggestions || aiSuggestions.length === 0) {
      throw new Error("OpenAI에서 추천 결과를 받아오지 못했습니다.");
    }

    console.log("💡 OpenAI 추천 결과:", aiSuggestions);

    return aiSuggestions;
  } catch (error) {
    console.error("❌ [getSuggestedChildNodes] 오류 발생:", error.message);
    throw error; // 반드시 throw를 해야 컨트롤러에서 오류 확인 가능
  }
};

// 마인드 맵 노드 중 최고 골라주는 api 요청
exports.getBestMindmapIdea = async (project_id) => {
  try {
    const nodes = await nodeRepository.getAllNodesByProject(project_id);
    if (!nodes || nodes.length === 0) {
      throw new Error("해당 프로젝트에 노드가 없습니다.");
    }

    // 🔥 노드 리스트에서 루트 노드 찾기
    const rootNode = nodes.find(
      (node) => node.parent_key === null || node.parent_key === 0
    );
    if (!rootNode) {
      throw new Error("루트 노드를 찾을 수 없습니다.");
    }

    const nodeList = nodes.map((node) => node.content);

    // 🔥 루트 노드를 제외하고 AI 요청
    const aiResponse = await openaiService.getBestMindmapIdea(
      nodeList,
      rootNode.content
    );

    console.log("💡 OpenAI 프로젝트 분석 결과:", aiResponse);
    return aiResponse;
  } catch (error) {
    console.error("❌ AI 프로젝트 분석 중 오류 발생:", error);
    throw new Error("AI 프로젝트 분석 중 오류 발생");
  }
};
