const connection = require("../../config/db");

// 🟢 노드 추가
exports.addNodes = (addedNodes) => {
  return new Promise((resolve, reject) => {
    if (!addedNodes || addedNodes.length === 0) {
      return reject(new Error("추가할 노드 데이터가 없습니다."));
    }

    const values = addedNodes.map((node) => [
      node.name,
      node.parent ?? null,
      node.isSelected,
    ]);

    connection.query(
      "INSERT INTO nodes (name, parent, isSelected) VALUES ?",
      [values],
      (err, result) => {
        if (err) return reject(err);

        // ✅ 새로 추가된 노드 ID 가져오기
        connection.query(
          "SELECT * FROM nodes ORDER BY `key` DESC LIMIT ?",
          [addedNodes.length],
          (err, newNodes) => {
            if (err) return reject(err);
            resolve(newNodes); // ✅ 추가된 노드 정보 반환
          }
        );
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
        resolve(keys); // ✅ 삭제된 노드 ID 반환
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

    connection.query(query, values, (err, result) => {
      if (err) return reject(err);

      // ✅ 수정된 노드 정보를 다시 조회해서 반환
      connection.query(
        "SELECT * FROM nodes WHERE `key` = ?",
        [updatedNode.key],
        (err, updatedNodes) => {
          if (err) return reject(err);
          resolve(updatedNodes[0]); // ✅ 수정된 노드 데이터 반환
        }
      );
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
