const { Project, ProjectMembers, Node, sequelize } = require("../../models");

// 🔹 기본 프로젝트 이름 설정
const defaultProjectName = "나의 새 마인드맵";

// ✅ 프로젝트 생성 + 사용자 매핑 + 루트 노드 추가
exports.createProjectWithUser = async (user_id) => {
  const transaction = await sequelize.transaction(); // 트랜잭션 시작
  try {
    // 1️⃣ 프로젝트 생성 (기본 이름 사용)
    const project = await Project.create(
      { name: defaultProjectName },
      { transaction }
    );

    // 2️⃣ ProjectMember 테이블에 user_id 추가 (isAdmin: true)
    await ProjectMembers.create(
      { user_id, project_id: project.project_id, isAdmin: 3 },
      { transaction }
    );

    // 3️⃣ 프로젝트의 루트 노드 생성
    await Node.create(
      {
        project_id: project.project_id,
        parent: null, // 루트 노드이므로 parent 없음
        content: defaultProjectName,
      },
      { transaction }
    );

    await transaction.commit(); // ✅ 트랜잭션 커밋
    return project;
  } catch (error) {
    await transaction.rollback(); // ❌ 오류 발생 시 롤백
    console.error("❌ 프로젝트 생성 중 오류:", error);
    throw error;
  }
};

exports.getUserProjects = async (user_id) => {
  try {
    const projects = await Project.findAll({
      attributes: ["project_id", "name"], // ✅ ID와 이름만 선택
      include: [
        {
          model: ProjectMembers,
          where: { user_id }, // ✅ 특정 user_id가 속한 프로젝트만 가져오기
          required: true,
          attributes: ["isAdmin"], // ✅ 관리자 여부도 반환 가능
        },
      ],
      raw: true, // 🔹 결과를 JSON 형태로 반환 (불필요한 Nesting 방지)
    });

    return projects.map((project) => ({
      project_id: project.project_id,
      name: project.name,
      isAdmin: project["ProjectMembers.isAdmin"], // 🔹 관리자인지 여부 포함 가능
    }));
  } catch (error) {
    console.error("❌ 유저의 프로젝트 조회 중 오류 발생:", error);
    throw error;
  }
};
