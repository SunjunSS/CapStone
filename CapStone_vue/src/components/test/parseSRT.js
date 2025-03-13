export default function meetingContent(content) {
  let report = "";

  // 입력이 JSON 객체인지 확인
  if (typeof content !== "object" || content === null) {
    console.error("잘못된 형식의 응답", typeof content);
    return "<p style='color: #bbb;'>응답 형식 오류</p>";
  }

  try {
    // ** SRT 내용 출력 **
    const srtContent = content.srt;
    if (srtContent && Array.isArray(srtContent)) {
      report += "<h3>📌 대화내용 (SRT)</h3>";
      srtContent.forEach((entry) => {
        const time = entry.time.replace(/,(\d{3})$/, ",$1"); // 시간 포맷 정리
        const speaker = entry.speaker;
        const speech = entry.speech.replace(/\n/g, "<br>"); // 줄바꿈 처리
        report += `<br>
          <p><strong>${time}</strong><br><strong>${speaker}:</strong> ${speech}</p>
        `;
      });
    } else {
      report += "<p style='color: #bbb;'>SRT 데이터 없음</p>";
    }

    // ** 회의록 내용 출력 **
    const minutes = content.minutes;
    if (minutes) {
      report += `
        <h3>📌 회의록</h3>
        <br>
        <h4>회의 목적</h4>
        
        <p>${minutes.purpose || "데이터 없음"}</p>
        
        <h4>주요 주제</h4>
        <ul>
          ${
            Array.isArray(minutes.topics)
              ? minutes.topics.map((topic) => `<li>${topic}</li>`).join("")
              : "<li>주제 없음</li>"
          }
        </ul>
        <h4>다음 할 일</h4>
        <ul>
          ${
            Array.isArray(minutes.next_steps)
              ? minutes.next_steps.map((step) => `<li>${step}</li>`).join("")
              : "<li>할 일 없음</li>"
          }
        </ul>
        <h4>요약</h4>
        <p>${minutes.summary || "요약 없음"}</p>
      `;
    } else {
      report += "<p style='color: #bbb;'>회의록 데이터 없음</p>";
    }

    // ** 키워드 출력 **
    if (minutes && Array.isArray(minutes.keywords)) {
      report += `
        <h3>🔑 주요 키워드</h3>
        <br>
        <ul>
          ${minutes.keywords.map((keyword) => `<li>${keyword}</li>`).join("")}
        </ul>
      `;
    } else {
      report += "<p style='color: #bbb;'>키워드 데이터 없음</p>";
    }
  } catch (error) {
    console.error("Error parsing response:", error);
    report += "<p style='color: #bbb;'>파싱 중 오류 발생</p>";
  }

  console.log(`vue응답값: ${report}`);

  return report;
}
