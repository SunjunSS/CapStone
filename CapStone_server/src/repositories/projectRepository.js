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
