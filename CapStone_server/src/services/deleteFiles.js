const fs = require("fs");

/**
 * 파일 경로 배열을 받아 모든 파일을 삭제하는 함수
 * @param {string[] | string | object[]} filePaths - 삭제할 파일 경로 배열 (객체도 지원)
 */
function deleteFiles(filePaths) {
  if (!filePaths) {
    console.error("❌ 삭제할 파일 경로가 없습니다.");
    return;
  }

  // 단일 경로 문자열이면 배열로 변환
  if (!Array.isArray(filePaths)) {
    filePaths = [filePaths];
  }

  // 배열이 비어 있다면 삭제할 파일이 없음
  if (filePaths.length === 0) {
    console.log("❌ 삭제할 파일이 없습니다.");
    return;
  }

  // 파일 삭제 처리
  filePaths.forEach((filePath) => {
    // 객체일 경우 적절한 속성을 추출
    if (typeof filePath === "object") {
      if (filePath.path) {
        filePath = filePath.path;
      } else if (filePath.file) {
        filePath = filePath.file;
      } else {
        console.error(`❌ 잘못된 파일 경로 형식: ${JSON.stringify(filePath)}`);
        return;
      }
    }

    // 최종적으로 문자열이 아닐 경우 오류 처리
    if (typeof filePath !== "string") {
      console.error(
        `❌ 파일 경로가 문자열이 아닙니다: ${JSON.stringify(filePath)}`
      );
      return;
    }

    // 파일 삭제 실행
    fs.unlink(filePath, (err) => {
      console.log(`삭제할 wav 파일 경로: ${filePath}`);

      if (err) {
        console.error(`❌ 파일 삭제 오류: ${filePath} - ${err.message}`);
      } else {
        console.log(`✅ 삭제된 파일: ${filePath}`);
      }
    });
  });
}

module.exports = { deleteFiles };
