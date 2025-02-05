const express = require("express");
const cors = require("cors");

const app = express();

// JSON 파싱 및 CORS 미들웨어 설정
app.use(express.json());
app.use(cors());

// 마인드맵 데이터를 저장할 변수
let mindmapData = [];

// 마인드맵 데이터 저장 API
app.post('/api/mindmap/save', (req, res) => {
  try {
    const { nodes } = req.body;
    
    if (!nodes) {
      return res.status(400).json({
        success: false,
        message: '노드 데이터가 없습니다'
      });
    }

    // 마인드맵 데이터 저장
    mindmapData = nodes;
    
    // 저장된 데이터 로깅
    console.log('저장된 마인드맵 데이터:', mindmapData);

    res.status(200).json({
      success: true,
      message: '마인드맵 데이터가 성공적으로 저장되었습니다',
      data: mindmapData
    });

  } catch (error) {
    console.error('마인드맵 저장 중 오류 발생:', error);
    res.status(500).json({
      success: false,
      message: '마인드맵 데이터 저장 실패',
      error: error.message
    });
  }
});

// 마인드맵 데이터 조회 API
app.get('/api/mindmap', (req, res) => {
  res.status(200).json({
    success: true,
    data: mindmapData
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다`);
});