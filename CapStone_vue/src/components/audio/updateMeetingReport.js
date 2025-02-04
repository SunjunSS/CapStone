

export function updateMeetingReport(content) {


  if (typeof content !== "string") {
    console.error("Expected content to be a string, but got:", typeof content);
    this.meetingContent = "<p style='color: #bbb;'>응답 형식 오류</p>";
    return;
  }

  try {
    // OpenAI 응답에서 SRT 파일과 회의록 분리
    const srtMatch = content.match(/### SRT 파일:\s*([\s\S]+?)\s*---/);
    const reportMatch = content.match(/### 회의록:\s*([\s\S]+)/);

    const srtText = srtMatch ? srtMatch[1].trim() : "";
    const reportText = reportMatch ? reportMatch[1].trim() : "";

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

      // ** SRT HTML 변환 **
      this.meetingContent = formattedContent
        .map(
          (block) => `
            <p><strong>${block.index}번 음성</strong> (${block.time})</p>
            <p>${block.text.trim()}</p>
          `
        )
        .join("");
    } else {
      this.meetingContent = "<p style='color: #bbb;'>SRT 데이터 없음</p>";
    }

    // ** 회의록 HTML 변환 **
    if (reportText) {
      this.meetingContent += `
        <h3>📌 회의록</h3>
        <pre>${reportText}</pre>
      `;
    } else {
      this.meetingContent += "<p style='color: #bbb;'>회의록 데이터 없음</p>";
    }
  } catch (error) {
    console.error("Error parsing response:", error);
    this.meetingContent = "<p style='color: #bbb;'>파싱 중 오류 발생</p>";
  }
};

export default updateMeetingReport;
