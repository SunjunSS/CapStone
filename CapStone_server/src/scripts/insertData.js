const dotenv = require("dotenv");
const path = require("path");
dotenv.config({ path: path.join(__dirname, "../../.env") });

const {
  sequelize,
  User,
  Team,
  TeamMember,
  Project,
  Node,
  initDB,
} = require("../models");

const insertData = async () => {
  try {
    console.log("🚀 데이터 삽입 시작...");

    // ✅ 1. users 테이블에 사용자 추가
    const user = await User.create({
      name: "김문권",
      email: "11@1.1",
      password: "11",
    });
    console.log(`✅ 사용자 추가됨: ${user.name} (${user.email})`);

    // ✅ 2. teams 테이블에 팀 추가
    const team = await Team.create({
      name: "Capstone Team",
      leader_email: user.email, // 리더 이메일
    });
    console.log(`✅ 팀 추가됨: ${team.name}`);

    // ✅ 3. team_members 테이블에 추가
    await TeamMember.create({
      user_id: user.user_id, // User의 user_id
      team_id: team.team_id, // Team의 team_id
    });
    console.log(`✅ 팀 멤버 추가됨: ${user.name} -> ${team.name}`);

    // ✅ 4. projects 테이블에 프로젝트 추가
    const project = await Project.create({
      name: "새 프로젝트",
      description: "캡스톤",
      topic: "라면면", // topic 필드 추가
      team_id: team.team_id,
    });
    console.log(`✅ 프로젝트 추가됨: ${project.name}`);

    // ✅ 5. nodes 테이블에 루트 노드 추가
    const node = await Node.create({
      project_id: project.project_id,
      parent_key: null,
      content: "자식",
    });
    console.log(`✅ 노드 추가됨: ${node.content}`);

    console.log("🎉 모든 데이터 삽입 완료!");
  } catch (error) {
    console.error("❌ 데이터 삽입 중 오류 발생:", error);
  } finally {
    await sequelize.close(); // DB 연결 종료
    console.log("🔌 데이터베이스 연결 종료");
  }
};

// ✅ 데이터베이스 동기화 후 데이터 삽입 실행
const run = async () => {
  await initDB(); // 데이터베이스 동기화
  await insertData(); // 데이터 삽입 실행
};

run();
