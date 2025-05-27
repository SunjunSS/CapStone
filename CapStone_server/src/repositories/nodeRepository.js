const { Node } = require("../models");

exports.createNode = async (
  content,
  parent_key,
  project_id,
  isSelected,
  transaction
) => {
  return await Node.create(
    { content, parent_key, project_id, isSelected },
    { transaction }
  );
};

exports.findNodeById = async (id, project_id, transaction = null) => {
  return await Node.findOne({ where: { id, project_id }, transaction });
};

exports.updateRootNodeName = async (project_id, newName, transaction) => {
  return await Node.update(
    { content: newName },
    { where: { project_id, parent_key: null }, transaction }
  );
};

exports.updateNodeContent = async (
  id,
  project_id,
  content,
  transaction = null
) => {
  return await Node.update(
    { content },
    { where: { id, project_id }, transaction }
  );
};

exports.deleteNodesByIds = async (ids, project_id) => {
  return await Node.destroy({
    where: { id: ids, project_id },
  });
};

exports.getAllNodesByProject = async (project_id) => {
  return await Node.findAll({ where: { project_id }, order: [["id", "ASC"]] });
};

// 특정 프로젝트의 모든 노드 삭제
exports.deleteNodesByProjectId = async (project_id, transaction) => {
  return await Node.destroy({
    where: { project_id },
    transaction,
  });
};
