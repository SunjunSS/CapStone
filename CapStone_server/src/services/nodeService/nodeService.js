const connection = require("../../config/db");

// 🟢 노드 추가
exports.addNodes = (addedNodes) => {
  return new Promise((resolve, reject) => {
    if (!addedNodes || addedNodes.length === 0) {
      console.error("Error: 추가할 노드 데이터가 없습니다."); // 로그 추가
      return reject(new Error("추가할 노드 데이터가 없습니다."));
    }

    const values = addedNodes.map((node) => [
      node.key,
      node.name,
      node.parent ?? 0,
      node.isSelected,
    ]);

    console.log("INSERT VALUES:", values); // 입력값 디버깅 로그 추가

    connection.query(
      "INSERT INTO nodes (`key`, name, parent, isSelected) VALUES ?",
      [values],
      (err, result) => {
        if (err) {
          console.error("MySQL Error:", err); // MySQL 오류 로그 추가
          return reject(err);
        }
        console.log("INSERT RESULT:", result); // 성공 시 결과 로그 추가
        resolve({ success: true, message: "마인드맵 저장 완료" });
      }
    );
  });
};

// 🔴 노드 삭제
exports.deleteNodes = (deletedNodes) => {
  return new Promise((resolve, reject) => {
    if (!deletedNodes || deletedNodes.length === 0) {
      return reject(new Error("삭제할 노드 데이터가 없습니다."));
    }

    const keys = deletedNodes.map((node) => node.key);

    connection.query(
      "DELETE FROM nodes WHERE `key` IN (?)",
      [keys],
      (err, result) => {
        if (err) return reject(err);
        resolve({ success: true, message: "노드 삭제 완료" });
      }
    );
  });
};

// 🟡 노드 수정
exports.updateNode = (updatedNode) => {
  return new Promise((resolve, reject) => {
    if (!updatedNode || !updatedNode.key) {
      return reject(new Error("수정할 노드 데이터가 없습니다."));
    }

    const query = "UPDATE nodes SET name = ?, isSelected = ? WHERE `key` = ?";
    const values = [updatedNode.name, updatedNode.isSelected, updatedNode.key];

    console.log("UPDATE VALUES:", values); // 입력값 디버�� 로그 추가

    connection.query(query, values, (err, result) => {
      if (err) return reject(err);
      resolve({ success: true, message: "노드 수정 완료" });
    });
  });
};

// 🟢 마인드맵 조회
exports.getMindmap = () => {
  return new Promise((resolve, reject) => {
    connection.query("SELECT * FROM nodes", (err, results) => {
      if (err) return reject(err);

      resolve({
        success: true,
        data: results.map((node) => ({ ...node, parent: node.parent ?? 0 })),
      });
    });
  });
};
