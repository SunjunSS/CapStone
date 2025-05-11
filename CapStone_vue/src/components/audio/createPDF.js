import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import notoKR from "./font/NotoSansKR-Regular"



export default async function createPDF(data) {
  // ✅ PDF 생성
  const doc = new jsPDF();

  doc.addFileToVFS("NotoSansKR-Regular.ttf", notoKR);
  doc.addFont("NotoSansKR-Regular.ttf", "NotoSansKR", "normal");
  doc.setFont("NotoSansKR");

  const now = new Date();
  const dateStr = now.toLocaleDateString().replace(/\.$/, "");
  const timeStr = now.toLocaleTimeString();

  const { speakerNames, srt, minutes } = data;

  doc.setFontSize(18);
  doc.text("회의록", 10, 15);
  doc.setFontSize(12);
  doc.text(`1. 날짜: ${dateStr}`, 10, 25);
  doc.text(`2. 시간: ${timeStr}`, 10, 33);
  doc.text(`3. 참여자: ${speakerNames.join(", ")}`, 10, 41);

  doc.text(" ", 10, 34); // 첫 번째 줄
  doc.text(" ", 10, 42); // 두 번째 줄

  doc.setFontSize(15);
  doc.text("4. 회의록", 10, 50);

  autoTable(doc, {
    startY: 58,
    body: [
      ["회의 목적", minutes.purpose],
      ["주요 주제", minutes.topics.join(",")],
      ["다음 할 일", minutes.next_steps.join(",")],
      ["요약", minutes.summary],
    ],
    headStyles: { font: "NotoSansKR", fontSize: 12 },
    bodyStyles: { font: "NotoSansKR", fontSize: 12 },
    styles: {
      font: "NotoSansKR",
      halign: "left",
      valign: "top",
      overflow: "linebreak",
    },
    theme: "grid",
    columnStyles: {
      0: { fontStyle: "normal", cellWidth: 40 },
      1: { cellWidth: "auto" },
    },
  });

  // 🔑 키워드
  doc.text("5. 주요 키워드", 10, doc.lastAutoTable.finalY + 10);
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 16,
    body: minutes.keywords.map((k) => [k]),
    theme: "striped",
    styles: { font: "NotoSansKR", halign: "left" },
  });

  // 📝 SRT 대화
  doc.addPage();

  doc.text("6. 대화내용 (SRT)", 10, 15);

  const srtTable = srt.map((item) => [
    item.time,
    `${item.speaker}: ${item.speech}`,
  ]);

  autoTable(doc, {
    startY: 16,
    head: [["Time", "Content"]],
    body: srtTable,
    styles: { font: "NotoSansKR", overflow: "linebreak" },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: "auto" },
    },
    theme: "grid",
  });

  return doc;
}
