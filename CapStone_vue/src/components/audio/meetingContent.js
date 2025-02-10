export default function thisMeetingContent(content) {




  let report = "";

  if (typeof content !== "string") {
    console.error("Expected content to be a string, but got:", typeof content);
    return "<p style='color: #bbb;'>응답 형식 오류</p>";
  }

  try {
    const cleanedContent = content.replace(/,\s*"refusal":null}[\s\S]*$/, "");
    const formattedText = cleanedContent
      .replace(/\\n/g, "<br>")
      .replace(/\n/g, "<br>")
      .replace(/---/g, "")
      .replace(/"/g, "")
      .replace(/###/g, "")
      .replace(/\\/g,"");

    // SRT 파일, 회의록, 키워드 추출
    const srtMatch = formattedText.match(/SRT 파일:\s*([\s\S]+?)회의록:/);
    const reportMatch = formattedText.match(/회의록:\s*([\s\S]+?)키워드/);
    const keywordsMatch = formattedText.match(/키워드\s*([\s\S]+)/);

    const srtText = srtMatch ? srtMatch[1].trim() : "";
    console.log(`srtText ${srtText}`);
    const reportText = reportMatch ? reportMatch[1].trim() : "";
    const keywordsText = keywordsMatch ? keywordsMatch[1].trim() : "";

    // ** SRT 내용 그대로 출력 **
    if (srtText) {
      // SRT 내용의 시간을 소수점 없이 표시
      const cleanedSrtText = srtText.replace(
        /(\d{2}:\d{2}:\d{2}),\d{3}/g,
        "$1"
      );
      report += `
        <h3>📌 대화내용 (SRT)</h3>
        <p style="white-space: pre-wrap; word-wrap: break-word;">${cleanedSrtText.replace(
          /\n/g,
          "<br>"
        )}</p> 
      `;
    } else {
      report += "<p style='color: #bbb;'>SRT 데이터 없음</p>";
    }

    // ** 회의록 HTML 변환 **
    if (reportText) {
      report += `
        <h3>📌 회의록</h3>
        <br>
        <p style="white-space: pre-wrap; word-wrap: break-word;">${reportText.replace(
          /\n/g,
          "<br>"
        )}</p>
      `;
    } else {
      report += "<p style='color: #bbb;'>회의록 데이터 없음</p>";
    }

    // ** 키워드 HTML 변환 **
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
