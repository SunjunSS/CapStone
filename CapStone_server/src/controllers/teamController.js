const { createTeam } = require("../services/teamService/teamService");

exports.createTeamController = async (user, projectName) => {
  try {
    // 팀 생성
    const team = await createTeam(user, projectName);
    return team;
  } catch (error) {
    throw new Error("팀 생성 오류");
  }
};
