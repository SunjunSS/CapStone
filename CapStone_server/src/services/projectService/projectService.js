const { Project, Team, TeamMember, Node } = require("../../models");
const sequelize = require("../../config/localDB");

exports.createProjectWithTeamAndNodes = async (user_id) => {
  const transaction = await sequelize.transaction(); // 트랜잭션 시작
  try {
    // 1️⃣ 새로운 팀 생성
    const team = await Team.create({}, { transaction });

    // 2️⃣ 생성된 team_id를 기반으로 프로젝트 생성 (name을 "나의 새 마인드맵"으로 고정)
    const project = await Project.create(
      { name: "나의 새 마인드맵", team_id: team.team_id },
      { transaction }
    );

    // 3️⃣ TeamMember 테이블에 user_id와 team_id 매핑 추가 (isAdmin = 2)
    await TeamMember.create(
      { user_id, team_id: team.team_id, isAdmin: 2 },
      { transaction }
    );

    // 4️⃣ Nodes 테이블에 초기 노드 추가 (parent는 null, content는 "나의 새 마인드맵")
    await Node.create(
      {
        project_id: project.project_id,
        parent: null,
        content: "나의 새 마인드맵",
      },
      { transaction }
    );

    await transaction.commit(); // 트랜잭션 커밋
    return project;
  } catch (error) {
    await transaction.rollback(); // 오류 발생 시 롤백
    throw error;
  }
};

exports.getUserProjects = async (user_id) => {
  try {
    const projects = await Project.findAll({
      attributes: ["project_id", "name"], // ✅ ID와 NAME만 선택적으로 가져오기
      include: {
        model: Team,
        required: true, // ✅ Team이 필수적으로 연결되어 있어야 함
        include: {
          model: TeamMember,
          where: { user_id }, // ✅ 특정 user_id가 속한 팀만 필터링
          required: true, // ✅ TeamMember가 존재해야만 해당 Team 포함
        },
      },
    });

    return projects.map((project) => ({
      project_id: project.project_id,
      name: project.name,
    }));
  } catch (error) {
    console.error("유저의 프로젝트 조회 오류:", error);
    throw error;
  }
};
