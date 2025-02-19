const { createProject } = require("../services/projectService/projectService");
const { createTeamController } = require("../controllers/teamController");
const  User  = require("../models/users");

exports.createProjectController = async (user_id, name, description, topic) => {
  try {
    // 요청한 유저가 존재하는지 확인
    console.log("User 모델 경로 확인:", require("../models/users"));
    console.log("User 모델:", User);
    console.log(`유저 id: ${user_id}`);
    const user = await User.findOne({ where: { user_id } });
    if (!user) throw new Error("유저를 찾을 수 없습니다.");

    // 팀 생성 및 연결을 teamController로 분리하여 호출
    const team = await createTeamController(user, name);

    // 프로젝트 생성
    const project = await createProject(name, description, topic, team.team_id);

    // 생성된 팀을 프로젝트에 연결
    await project.update({ team_id: team.team_id });

    return { project, team };
  } catch (error) {
    throw error;
  }
};
