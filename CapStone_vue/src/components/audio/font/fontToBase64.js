// // font-to-base64.js
// const fs = require("fs");
import fs from "fs"

const fontPath = "./NotoSansKR-Bold.ttf"; // TTF 경로
const outputPath = "./NotoSansKR-Bold.js"; // 출력 파일

const fontData = fs.readFileSync(fontPath);
const base64 = fontData.toString("base64");

const exportString = `export default "${base64}";\n`;
fs.writeFileSync(outputPath, exportString);

console.log("✅ 변환 완료: NotoSansKR-Regular.js 생성됨");
