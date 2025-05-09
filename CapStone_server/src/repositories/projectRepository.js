const { Project } = require("../models");
const { Sequelize } = require("sequelize");

exports.createProject = async (name, transaction) => {
  return await Project.create({ name }, { transaction });
};

exports.updateProjectName = async (project_id, newName, transaction) => {
  return await Project.update(
    { name: newName },
    { where: { project_id }, transaction }
  );
};

// 수정 시간만 갱신하는 함수
exports.touchProjectUpdatedAt = async (project_id, transaction = null) => {
  return await Project.update(
    { updatedAt: Sequelize.literal("CURRENT_TIMESTAMP") },
    { where: { project_id }, transaction }
  );
};

// projectRepository.js 파일의 getUserProjects 함수 수정
exports.getUserProjects = async (projectIds) => {
  try {
    return await Project.findAll({
      attributes: ["project_id", "name", "deleted", "updatedAt"], // 'deleted' 필드 추가
      where: {
        project_id: projectIds,
      },
    });
  } catch (error) {
    console.error("❌ 프로젝트 조회 중 오류 발생:", error);
    throw error;
  }
};

// 프로젝트 삭제
exports.deleteProject = async (project_id, transaction) => {
  return await Project.destroy({
    where: { project_id },
    transaction,
  });
};

// 특정 프로젝트 정보 조회
exports.getProjectById = async (project_id) => {
  return await Project.findOne({
    where: { project_id },
    raw: true, // JSON 형식으로 반환
  });
};

exports.updateProjectDeletedFlag = async (project_id, deleted, transaction) => {
  return await Project.update(
    { deleted },
    {
      where: { project_id },
      transaction,
    }
  );
};

// 카테고리 속성 수정
exports.updateProjectCategory = async (project_id, category, transaction) => {
  return await Project.update(
    { category },
    {
      where: { project_id },
      transaction,
    }
  );
};
