export function thisMeetingContent(content) {
  let report = "";

  if (typeof content !== "string") {
    console.error("Expected content to be a string, but got:", typeof content);
    return "<p style='color: #bbb;'>응답 형식 오류</p>";
  }

  try {

    const cleanedContent = content.replace(/,\s*"refusal":null}[\s\S]*$/, "");
    const formattedText = cleanedContent
      .replace(/\\n/g, "<br>")
      .replace(/\n/g, "<br>");


    // OpenAI 응답에서 SRT 파일과 회의록, 키워드 분리
       const srtMatch = formattedText.match(
         /### SRT 파일:\s*([\s\S]+?)### 회의록:/
       );
       const reportMatch = formattedText.match(
         /### 회의록:\s*([\s\S]+?)### 키워드/
       );
       const keywordsMatch = formattedText.match(/### 키워드\s*([\s\S]+)/);

    const srtText = srtMatch ? srtMatch[1].trim() : "";
    const reportText = reportMatch ? reportMatch[1].trim() : "";
    const keywordsText = keywordsMatch ? keywordsMatch[1].trim() : "";

    // ** SRT 파싱 및 HTML 변환 **
    if (srtText) {
      const lines = srtText.split("\n");
      const formattedContent = [];
      let block = { index: null, time: null, text: "" };

      lines.forEach((line) => {
        if (/^\d+$/.test(line)) {
          if (block.index) formattedContent.push(block); // 이전 블록 저장
          block = { index: line, time: null, text: "" };
        } else if (line.includes("-->")) {
          block.time = line.replace(",", ".");
        } else if (line.trim()) {
          block.text += `${line.trim()} `;
        }
      });
      if (block.index) formattedContent.push(block); // 마지막 블록 추가

      // ** SRT HTML 변환 (줄바꿈 적용) **
      report += formattedContent
        .map(
          (block) => `
            <p><strong>${block.index}번 음성</strong> (${block.time})</p>
            <p>${block.text.trim().replace(/\n/g, "<br>")}</p>
          `
        )
        .join("");
    } else {
      report += "<p style='color: #bbb;'>SRT 데이터 없음</p>";
    }

    // ** 회의록 HTML 변환 (줄바꿈 적용) **
    if (reportText) {
      report += `
        <h3>📌 회의록</h3>
        <p style="white-space: pre-wrap; word-wrap: break-word;">${reportText.replace(
          /\n/g,
          "<br>"
        )}</p>
      `;
    } else {
      report += "<p style='color: #bbb;'>회의록 데이터 없음</p>";
    }

    // ** 키워드 HTML 변환 (줄바꿈 적용) **
    if (keywordsText) {
      report += `
        <h3>🔑 주요 키워드</h3>
        <p style="white-space: pre-wrap; word-wrap: break-word;">${keywordsText.replace(
          /\n/g,
          "<br>"
        )}</p>
      `;
    } else {
      report += "<p style='color: #bbb;'>키워드 데이터 없음</p>";
    }
  } catch (error) {
    console.error("Error parsing response:", error);
    report += "<p style='color: #bbb;'>파싱 중 오류 발생</p>";
  }

  return report;
}

export default thisMeetingContent;
