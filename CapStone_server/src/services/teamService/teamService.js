const Team  = require("../../models/teams");
const TeamMember = require("../../models/teamMembers");

const createTeam = async (user, projectName) => {
  const team = await Team.create({
    name: `${projectName} Team`,
    leader_email: user.email,
  });

  console.log("생성된 팀:", team); // 반환된 team 객체 확인
  console.log("팀 ID:", team.team_id); // team_id가 제대로 설정되었는지 확인

  // 팀 멤버 추가 (방장 유저)
  await TeamMember.create({
    team_id: team.team_id,
    user_id: user.user_id,
  });

  return team;
};

module.exports = { createTeam };
