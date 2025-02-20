const { Op } = require("sequelize");
const Project = require("../models/projects");
const User = require("../models/users");
const Team = require("../models/teams");

const socketSessions = require("./socketSessions");

module.exports = (socket) => {
  console.log("🟢 mainHomeHandler initialized for", socket.id);

  // 프로젝트 처리
  socket.on("get_project", async ({ email }) => {

    console.log("DB내 프로젝트 접근중...");

    try {
      
      const user = await User.findOne({ where: { email } });
      const userId = user ? user.user_id : null;

      if (!user) {
        return socket.emit("login_error", {
          message: "존재하지 않는 이메일입니다.",
        });
      }

      const teams = await Team.findAll({ where: { leader_email: email } });

      if (!teams.length) {
        return socket.emit("return_project", {
          user,
          projects: [],
          message: "속한 팀이 없습니다.",
        });
      }

      // team_id 리스트 추출
      const teamIds = teams.map((team) => team.team_id);
      // team_id를 기반으로 프로젝트 조회
      const projects = await Project.findAll({
        where: { team_id: { [Op.in]: teamIds } },
      });


      console.log(`projects: ${projects[0].name}`);

      // 클라이언트에 프로젝트 반환
      socket.emit("return_project", {
        user,
        projects,
        message: "프로젝트 목록 요청 성공",
      });

      
    } catch (error) {
      socket.emit("project_error", {
        message: `프로젝트 처리 중 오류가 발생했습니다. ${error.message}`,
      });
    }
  });

  // 소켓 연결 해제 처리
  socket.on("disconnect", () => {
    console.log("🔴 프로젝트 연결 종료:", socket.id);
  });
};
