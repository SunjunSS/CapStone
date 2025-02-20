const Project  = require("../../models/projects");

const createProject = async (name, description, topic, team_id) => {
  const project = await Project.create({
    name,
    description,
    topic,
    team_id: team_id, 
  });

  return project;
};

module.exports = { createProject };
