#1 시연영상 링크

https://youtu.be/Y0cK2a4HlEY 

# 🧠 VoiceMindMap
> 음성 회의를 자동으로 마인드맵으로 시각화해주는 AI 기반 협업 도구

🎯 프로젝트 개요 (About)
VoiceMindMap은 회의 중 참여자의 음성을 실시간으로 텍스트로 변환하고,
발언자 구분과 함께 주제별로 자동 마인드맵을 생성하는 웹 기반 협업 도구입니다.

🎤 음성 인식 → ✍️ 실시간 텍스트 변환 → 🧠 키워드 추출 → 🌐 마인드맵 시각화

> 회의 내용을 구조화하고, 효율적인 의사소통을 돕습니다.

✨ 주요 기능 (Features)
- 🎤 실시간 음성 회의 지원 (WebRTC 기반)
- 🔈 발언자 구분 및 음성 텍스트화 (Clova Speech API)
- 🧠 키워드 추출 및 주제 분류 (OpenAI API 활용)
- 🌳 마인드맵 자동 생성 (2D & 3D 모드 지원)
- 🖼️ PDF 회의록 및 마인드맵 이미지 저장 기능
- 👥 팀원 초대 및 실시간 동기화 (Socket.IO)

🖼️ 데모 이미지 / GIF
## 📸 Demo
![demo](link-to-demo.gif)

🛠️ 기술 스택
- **Frontend**: Vue 3, Vite, GoJS, Three.js, Tailwind CSS
- **Backend**: Node.js, Express, Sequelize (MySQL)
- **Realtime**: Socket.IO, WebRTC
- **AI**: Clova Speech Recognition, OpenAI GPT API

🚀 실행 방법 (Getting Started)
### 1. Clone the repository
git clone https://github.com/your-username/voicemindmap.git

### 2. Install dependencies
cd frontend && npm install
cd ../backend && npm install

### 3. Run
npm run dev # on both frontend and backend

🗂️ 폴더 구조 (예시)
📁 frontend/
├── components/
├── pages/
├── assets/
└── App.vue

📁 backend/
├── routes/
├── controllers/
├── models/
└── app.js

📄 라이선스 / 기여 / 연락처
## 📝 License
This project is licensed under the MIT License.

## 🤝 Contributing
Pull requests are welcome! Feel free to fork and suggest improvements.

## 📬 Contact
김문권 - [ok63477@gmail.com](mailto:ok63477@gmail.com)
김선준 - [tofhadlfksek@gmail.com](mailto:tofhadlfksek@gmail.com)
문기업 - [tofhadlfksek@gmail.com](mailto:tofhadlfksek@gmail.com)
이희찬 - [tofhadlfksek@gmail.com](mailto:tofhadlfksek@gmail.com)

