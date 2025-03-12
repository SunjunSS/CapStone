// parseSRT.js

export default function parseSRT(content) {
  if (!content) {
    return "<p style='color: #bbb;'>아직 회의록이 없습니다.</p>";
  }

  try {
    const lines = content.trim().split("\n");
    const formattedContent = [];
    let block = { index: null, time: null, text: "" };

    lines.forEach((line) => {
      if (/^\d+$/.test(line)) {
        if (block.index) {
          formattedContent.push(block);
        }
        block = { index: line, time: null, text: "" };
      } else if (line.includes("-->")) {
        block.time = line.replace(",", ".");
      } else if (line.trim()) {
        block.text += `${line.trim()} `;
      }
    });

    if (block.index) {
      formattedContent.push(block);
    }

    return formattedContent
      .map(
        (block) => `
          <p><strong>${block.index}번 음성</strong> (${block.time})</p>
          <p>${block.text.trim()}</p>
        `
      )
      .join("");
  } catch (error) {
    console.error("Error parsing SRT data:", error);
    return "<p style='color: #bbb;'>파싱 중 오류가 발생했습니다.</p>";
  }
}

