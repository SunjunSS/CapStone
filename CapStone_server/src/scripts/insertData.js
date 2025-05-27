const dotenv = require("dotenv");
const path = require("path");
dotenv.config({ path: path.join(__dirname, "../../.env") });

const {
  sequelize,
  User,
  Project,
  ProjectMembers,
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

    // ✅ 3. projects 테이블에 프로젝트 추가
    const project = await Project.create({
      name: "새 프로젝트",
      updateAt: null,
    });
    console.log(`✅ 프로젝트 추가됨: ${project.name}`);

    // ✅ 2. projectmembers 테이블에 추가
    await ProjectMembers.create({
      user_id: user.user_id, // User의 user_id
      project_id: project.project_id,
      isAdmin: 4,
    });
    console.log(`✅프로젝트 멤버 추가됨: ${user.name} -> ${project.name}`);

    // ✅ 4. nodes 테이블에 루트 노드 추가
    const node = await Node.create({
      project_id: project.project_id,
      parent_key: null,
      content: "자식",
      isSelected: false,
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
