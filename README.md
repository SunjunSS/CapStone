# 🧠 마음지도
음성 회의를 자동으로 마인드맵으로 시각화해주는 AI 기반 협업 도구

<br>

## 📚 목차
- [🎯 프로젝트 개요](#-프로젝트-개요-about)
- [✨ 주요 기능](#-주요-기능-features)
- [🛠️ 기술 스택](#-기술-스택)
- [📸 Demo](#-demo)
- [🚀 실행 방법](#-실행-방법-getting-started)
- [📬 Contact](#-contact)

<br> 

# 🎯 프로젝트 개요 (About)
마음지도는 회의 중 참여자의 음성을 실시간으로 텍스트로 변환하고,<br>
발언자 구분과 함께 주제별로 자동 마인드맵을 생성하는 웹 기반 협업 도구입니다.

🎤 음성 인식 → ✍️ 실시간 텍스트 변환 → 🧠 키워드 추출 → 🌐 마인드맵 시각화

회의 내용을 구조화하고, 효율적인 의사소통을 돕습니다.

<br>

# ✨ 주요 기능 (Features)
- 🎤 실시간 음성 회의 지원 (WebRTC 기반)
- 🔈 발언자 구분 및 음성 텍스트화 (Clova Speech API)
- 🧠 키워드 추출 및 주제 분류 (OpenAI API 활용)
- 🌳 마인드맵 자동 생성 (2D & 3D 모드 지원)
- 🖼️ PDF 회의록 및 마인드맵 이미지 저장 기능
- 👥 팀원 초대 및 실시간 동기화 (Socket.IO)

<br>

# 🛠️ 기술 스택

<div align="center">

<!-- 1행 -->
<img src="https://img.shields.io/badge/AWS-FF9900?style=for-the-badge&logo=amazonaws&logoColor=white"/>
<img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black"/>
<img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white"/>
<img src="https://img.shields.io/badge/Express-888888?style=for-the-badge&logo=express&logoColor=white"/>
<br/>

<!-- 2행 -->
<img src="https://img.shields.io/badge/Vue.js-42B883?style=for-the-badge&logo=vue.js&logoColor=white"/>
<img src="https://img.shields.io/badge/Vite-9466FF?style=for-the-badge&logo=vite&logoColor=white"/>
<img src="https://img.shields.io/badge/GoJS-00ADD8?style=for-the-badge&logo=gojs&logoColor=white"/>
<img src="https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=three.js&logoColor=white"/>
<br/>

<!-- 3행 -->
<img src="https://img.shields.io/badge/LottieFiles-00BFFF?style=for-the-badge&logo=lottiefiles&logoColor=white"/>
<img src="https://img.shields.io/badge/Sequelize-53B4E6?style=for-the-badge&logo=sequelize&logoColor=white"/>
<img src="https://img.shields.io/badge/MySQL-00758F?style=for-the-badge&logo=mysql&logoColor=white"/>
<img src="https://img.shields.io/badge/Socket.IO-333333?style=for-the-badge&logo=socket.io&logoColor=white"/>
<br/>

<!-- 4행 -->
<img src="https://img.shields.io/badge/WebRTC-F37A1F?style=for-the-badge&logo=webrtc&logoColor=white"/>
<img src="https://img.shields.io/badge/Clova-03C75A?style=for-the-badge&logo=naver&logoColor=white"/>
<img src="https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white"/>

</div>


# 📸 Demo

**2분 시연 영상**  
https://youtu.be/0z52JlTuuMM  
<br/>

**마음지도 기능 설명 영상**  
https://youtu.be/e7piBzln1PM  
<br/>


### 1. 메인화면

  ![image](https://github.com/user-attachments/assets/67082198-8756-425c-a0eb-4b57756d8349)

### 2. 회원가입

  ![image](https://github.com/user-attachments/assets/a0287399-1d43-4a65-803b-5e5705970a79)

### 3. 이메일 인증

  사전 설정해둔 계정을 통해 gmail 혹은 naver의 이메일 계정으로 인증코드를 발송해줍니다. 
  해당 발송 코드를 입력함으로 실제 이메일 계정의 가입인지를 확인할 수 있습니다.

  ![image](https://github.com/user-attachments/assets/ce40ae48-8639-4dc2-97a0-db72bebf956e)

    
### 4. 로그인

  회원가입한 계정을 통해 로그인이 가능합니다.

  ![image](https://github.com/user-attachments/assets/52e4a26c-a942-405c-bf66-d998530eaba0)

  
### 5. 메인화면(로그인)

  ![image](https://github.com/user-attachments/assets/54c27cb7-6b2a-452e-ae13-1e0ac99a3122)


  
### 6. 프로젝트 생성 및 주제설정

  사용자는 프로젝트 생성시에 각 주제에 특화된 데이터를 통해 사전 학습된 AI모델을 선택하여 주제에 특화된 AI 추천을 받을 수 있습니다.
  ![image](https://github.com/user-attachments/assets/4d8c06b4-0931-4f99-ade0-8141c63be7c4)

  
### 7. 팀원초대(권한 설정 및 탈퇴 기능)

  이메일 계정을 통해 사용자를 팀에 초대할 수 있습니다. 뷰어와 편집자의 권한으로 나누어 아이디어 노드에 대한 편집권한을 설정해줄 수 있습니다.
  초대한 팀원은 탈퇴 또한 가능합니다.

  ![image](https://github.com/user-attachments/assets/94c959ea-20c7-45ad-9d91-fe5290fe9d81)
  
### 7-1. 뷰어 설정 시 편집 불가

  뷰어는 편집권한이 없기에 편집이 불가합니다.

  ![image](https://github.com/user-attachments/assets/95328cca-0bdc-42c3-821d-63d451c29b6a)

### 8. 음성회의 및 실시간 자동 노드 추가

  음성회의 중에 실시간으로 음성파일을 분석하여 키워드를 추출합니다.
  추출된 키워드는 전체 아이디어 노드를 분석하여 적절한 부모 아이디어노드의 하위에 자동으로 추가됩니다. 

  ![image](https://github.com/user-attachments/assets/2f9670e7-4ff9-4ab1-a215-c7b91e7e7ea2)

### 9. 아이디어 노드 관리

  아이디어 노드는 추가, 삭제, 이동, 텍스트 편집이 가능하며, 이를 통해 아이디어와 주제들을 구조화하고 시각화할 수 있습니다.

  ![image](https://github.com/user-attachments/assets/9f53d3bf-4f14-4682-8568-ac3af372bfe4)

  
### 10. AI기반 아이디어 노드 추천

  아이디어 노드를 선택한 후 AI추천 버튼을 누르면, 해당 아이디어 노드의 내용과 연관된 키워드를 추천해줍니다.
  사용자는 추천된 키워드를 추가 or 삭제가 가능합니다.

  ![image](https://github.com/user-attachments/assets/09af5cec-4372-4492-9fba-19475d5aa6bb)

### 11. 3D 아이디어 노드

  2D 형식의 아이디어 노드를 3D로 표현해주는 기능입니다. 이를 통해 더욱 다채로운 시각적 경험을 제공합니다.

  ![image](https://github.com/user-attachments/assets/672d02cb-fd2c-40c6-804e-bc3dfbc8a4cb)

### 12. 회의결과(음성파일. 회의록 PDF)

  회의가 종료되고 나면, 회의록이 정리되어 출력됩니다.
  회의록에서는 화자의 닉네임과 음성 텍스트가 매칭되어 누구의 발언인지 정확하게 파악이 가능하며, 말한 시간도 확인이 가능합니다. 
  AI의 분석을 통해 주제와 다음할일, 회의 요약 등의 내용이 제공되며, 멤버들의 음성파일과 회의록을 PDF형식의 파일로 다운로드가 가능합니다.
  이를 통해 회의의 진행과 결과물 산출이 자동화되어 회의가 간소화되고 생산성이 증대되는 효과를 기대할 수 있습니다.

  #### <음성회의 결과>
  ![image](https://github.com/user-attachments/assets/b0520724-a510-40fb-8168-44af7e54eafe)

  #### <회의록 PDF>
  ![image](https://github.com/user-attachments/assets/d33eb66c-11dd-45fb-8003-941aef9d0fc6)

  <br>

  ![image](https://github.com/user-attachments/assets/5b60078f-a04f-4de7-accb-24f116cd7702)


  

### 13. 화면 캡쳐

  ![image](https://github.com/user-attachments/assets/ebfd63fb-cfe0-4457-b547-ab91e78a3cff)

  
### 14. 화이트 보드

  화이트 보드에서는 캡쳐한 이미지등을 붙여넣을 수 있고 자유로운 메모가 가능합니다.
  회의 중 떠오른 아이디어나 생각들을 기록할 수 있으며, 저장 기능을 통해 회의 중에 추가적으로 참고할 자료들을 도출할 수 있습니다. 

  ![image](https://github.com/user-attachments/assets/75143d97-3fb0-42f9-83b0-b5a08b6c3f0c)

### 15. AI기반 주제 추천

  해당 프로젝트 내에서 작성된 아이디어 노드를 기반으로 AI가 최적의 아이디어를 5개 추천해줍니다.
  이를 통해 적합한 내용을 선별하여 추후 프로젝트 진행을 위한 구체적인 계획 실행에 반영이 가능합니다. 

  ![image](https://github.com/user-attachments/assets/f8c4fa67-64ee-405e-bb11-22ea00d0cf84)

  
### 16. 프로젝트 관리(즐겨찾기, 삭제)

  즐겨찾기 기능을 통해 중요한 프로젝트는 즐겨찾기 화면에 추가 가능하며, 삭제 또한 가능합니다.

  ![image](https://github.com/user-attachments/assets/a1f3d2a3-f2ec-4272-b085-cfaffa727722)


<br>

# 🚀 실행 방법 (Getting Started)
### 1. 저장소 클론
```
git clone https://github.com/SunjunSS/CapStone.git
```

### 2. 프론트 및 백엔드 npm 모듈 설치
```
cd CapStone/CapStone_vue && npm install
cd CapStone/CapStone_server/src && npm install
```

### 3. 환경 변수 설정
```
# Backend 환경변수

# 1. ClovaSpeech Api 키
SECRET= '클로바 시크릿 키'
INVOKE_URL='클로바 invoke 키'

# 2. Open ai API 키
OPENAI_API_KEY='OpenAi API 키'

# 3. DB 설정
DB_HOST="IP주소"
DB_USER="사용자"
DB_PASSWORD="비밀번호"
DB_NAME="DB이름"
DB_PORT="포트번호"

# 4. 이메일 계정 등록
EMAIL_USER="G메일 주소"
EMAIL_PASS="구글계정 앱 비밀번호"

# Frontend 환경 변수

VITE_API_BASE_URL=http://localhost:3000
```

### 4. 프론트 및 백엔드 실행
```
npm run dev # 프론트 실행
node server.js # 백엔드 실행
```

<br>

# 📬 Contact
김문권 - [ok63477@gmail.com]
<br>
김선준 - [zinzza122@naver.com]
<br>
문기업 - [2071187@hansung.ac.kr]
<br>
이희찬 - [chan5337@hansug.ac.kr]

<br>

  
