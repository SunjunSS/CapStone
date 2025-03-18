const { Project } = require("../models");

exports.createProject = async (name, transaction) => {
  return await Project.create({ name }, { transaction });
};

exports.updateProjectName = async (project_id, newName, transaction) => {
  return await Project.update(
    { name: newName },
    { where: { project_id }, transaction }
  );
};

exports.getUserProjects = async (projectIds) => {
  return await Project.findAll({
    attributes: ["project_id", "name"],
    where: { project_id: projectIds },
    raw: true,
  });
};

// 프로젝트 삭제
exports.deleteProject = async (project_id, transaction) => {
  return await Project.destroy({
    where: { project_id },
    transaction,
  });
};

// 특정 프로젝트 정보 조회회
exports.getProjectById = async (project_id) => {
  return await Project.findOne({
    where: { project_id },
    raw: true, // JSON 형식으로 반환
  });
};
