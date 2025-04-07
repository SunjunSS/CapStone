import fs from "fs";
import path from "path";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";



export default async function createPDF(data) {
  // ✅ PDF 생성
  const doc = new jsPDF();

  const fontPath = path.resolve("../audio/font/NotoSansKR-Regular.ttf");

  // 폰트 파일 읽기
  const fontData = fs.readFileSync(fontPath);
  const fontBase64 = fontData.toString("base64");

  doc.addFileToVFS("NotoSansKR-Regular.ttf", fontBase64);
  doc.addFont("NotoSansKR-Regular.ttf", "NotoSansKR", "normal");
  doc.setFont("NotoSansKR");

  const now = new Date();
  const dateStr = now.toLocaleDateString().replace(/\.$/, "");
  const timeStr = now.toLocaleTimeString();

  const { speakerNames, srt, minutes } = data;

  doc.text(`날짜: ${dateStr}`, 10, 10);
  doc.text(`시간: ${timeStr}`, 10, 18);
  doc.text(`참여자: ${speakerNames.join(", ")}`, 10, 26);

  doc.text(" ", 10, 34); // 첫 번째 줄
  doc.text(" ", 10, 42); // 두 번째 줄

  doc.setFontSize(15);
  doc.text("● 회의록", 10, 50);

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
  doc.text("● 주요 키워드", 10, doc.lastAutoTable.finalY + 10);
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 16,
    body: minutes.keywords.map((k) => [k]),
    theme: "striped",
    styles: { font: "NotoSansKR", halign: "left" },
  });

  // 📝 SRT 대화
  doc.addPage();
  doc.text("● 대화내용 (SRT)", 10, 10);

  const srtTable = srt.map((item) => [
    item.time,
    `${item.speaker}: ${item.speech}`,
  ]);

  autoTable(doc, {
    startY: 16,
    head: [["시간", "내용"]],
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
