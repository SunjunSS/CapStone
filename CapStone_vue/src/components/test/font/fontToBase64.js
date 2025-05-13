// font-to-base64.js
const fs = require("fs");

const fontPath = "./NotoSansKR-Regular.ttf"; // TTF 경로
const outputPath = "./NotoSansKR-Regular.js"; // 출력 파일

const fontData = fs.readFileSync(fontPath);
const base64 = fontData.toString("base64");

const exportString = `export default "${base64}";\n`;
fs.writeFileSync(outputPath, exportString);

console.log("✅ 변환 완료: NotoSansKR-Regular.js 생성됨");
