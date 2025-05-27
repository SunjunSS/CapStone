const fs = require("fs").promises;
const path = require("path");

/**
 * 특정 폴더 내 모든 파일을 삭제하는 함수 (비동기 처리)
 * @param {string} folderPath - 삭제할 폴더 경로
 */
async function deleteFiles(folderPath) {
  try {
    // 폴더 존재 여부 확인
    await fs.access(folderPath);

    // 폴더 내 파일 목록 가져오기
    const files = await fs.readdir(folderPath);
    // 삭제할 파일 필터링 (.gitkeep 제외)
    const filesToDelete = files.filter((file) => file !== ".gitkeep");

    if (filesToDelete.length === 0) {
      console.log(`ℹ️ 폴더가 이미 비어 있습니다: ${folderPath}`);
      return;
    }

    // 순차적으로 파일 삭제
    for (const file of filesToDelete) {
      const filePath = path.join(folderPath, file);
      try {
        await fs.unlink(filePath);
        console.log(`✅ 삭제된 파일: ${filePath}`);
      } catch (err) {
        console.error(`❌ 파일 삭제 오류: ${filePath} - ${err.message}`);
      }
    }

    console.log(`✅ 모든 파일 삭제 완료: ${folderPath}`);
  } catch (err) {
    console.error(`❌ 폴더 접근 오류: ${folderPath} - ${err.message}`);
  }
}

module.exports = { deleteFiles };
