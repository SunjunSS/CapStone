CapStone_server/
├── src/
│   ├── config/            # 환경설정 파일 (예: DB 연결, WebSocket 설정)
│   │   ├── db.js
│   │   ├── socket.js
│   │   └── env.js
│   ├── controllers/       # 비즈니스 로직 (API 핸들러)
│   │   ├── authController.js
│   │   ├── mapController.js
│   │   └── voiceController.js
│   ├── models/            # 데이터베이스 모델
│   │   ├── user.js
│   │   ├── mindmap.js
│   │   └── voiceSession.js
│   ├── routes/            # 라우팅 정의
│   │   ├── authRoutes.js
│   │   ├── mapRoutes.js
│   │   └── voiceRoutes.js
│   ├── services/          # 주요 서비스 로직 (DB 액세스, WebSocket , 외부 api 호출등)
│   │   ├── authService.js
│   │   ├── mapService.js
│   │   └── voiceService.js
│   ├── sockets/           # WebSocket 이벤트 처리
│   │   ├── mapSocket.js
│   │   └── voiceSocket.js
│   ├── utils/             # 유틸리티 함수 (공통 함수)
│   │   ├── logger.js
│   │   ├── validator.js
│   │   └── helper.js
│   ├── app.js             # Express 앱 설정
│   └── server.js          # 서버 실행 엔트리 포인트
├── tests/                 # 테스트 파일 (유닛 및 통합 테스트)
│   ├── auth.test.js
│   ├── map.test.js
│   └── voice.test.js
├── storage/               # 자료 저장 (이미지, 오디오, json형식 데이터 등등)
│   ├── audio/
│   │   └── 회의록.mp3
│   ├── images/
│   │   └── 팀 logo.png
│   ├── 회의록/
│   │   └── 팀 회의록1차.json
│   └── mindmaps/
│       └── 마인드맵 1차.json
│
│
├── .env                 # 환경 변수 설정 파일
└── package.json         # 프로젝트 의존성




< 폴더 구조 설명 >

# 1.config/:
데이터베이스 연결, WebSocket 설정, 환경 변수 로드 등 공통 설정을 관리합니다.

# 2. controllers/:
API 요청을 처리하는 함수들을 정의합니다. 클라이언트에서 들어온 요청을 서비스 계층으로 전달합니다.

# 3. models/:
데이터베이스 스키마와 모델 정의를 포함합니다. MongoDB 사용 시 Mongoose를 활용할 수 있습니다.
데이터베이스와의 CRUD (Create, Read, Update, Delete) 작업을 처리하는 코드가 포함.

# 4. routes/:
API 경로를 정의하고, 각 경로를 적절한 컨트롤러와 연결합니다.

# 5. services/:
비즈니스 로직과 데이터베이스 상호작용을 담당합니다. 이를 통해 컨트롤러와 데이터베이스 간의 결합을 낮춥니다.

# 6. sockets/:
WebSocket 관련 로직을 처리합니다. 예를 들어, 실시간 마인드맵 업데이트 이벤트를 처리하거나 음성 채널 연결을 관리합니다.

# 7. utils/:
로깅, 데이터 검증, 공통적으로 사용되는 도구를 포함합니다.
예시: 로그인 검증, 토큰 검증, 에러 처리(일관성) 등등

# 8. tests/:
각 모듈의 유닛 테스트와 통합 테스트를 작성합니다.



# 9. 서버 구조 요약
  server.js: 서버 실행을 담당하며, Express와 WebSocket 서버를 초기화합니다.
  app.js: Express 애플리케이션 설정과 미들웨어를 정의합니다.
  WebSocket 서버는 socket.js를 통해 설정하고 sockets/ 폴더 내 파일로 이벤트를 관리합니다.

# 10. 로직 정리

  비즈니스 로직: 애플리케이션의 핵심 기능을 정의합니다. (예: 마인드맵 생성 시 조건 검증 후 DB에 저장하는 서비스로직의 함수 호출)
  서비스 로직: 비즈니스 로직을 실제로 구현하는 부분으로, 데이터베이스나 외부 API와 상호작용합니다. (예: 마인드맵을 DB에 저장)
  유틸리티 함수: 여러 곳에서 재사용되는 공통적인 작업을 처리하는 함수들입니다. (예: 이메일 검증, 암호화 함수, 에러 처리 함수)

# 11. 사용 패턴
  가장 쉽게 적용가능한 mvc패턴을 사용했습니다. (view - 프론트 / controller, model - 서버의 폴더로 구조화)
