# Messenger App

실시간 메신저 웹 애플리케이션 (Next.js + Firebase)

## 기능

- Google 로그인을 통한 사용자 인증
- 1:1 및 그룹 채팅
- 실시간 메시지收发
- 파일/이미지 전송 (최대 10MB)
- 라이트/다크 모드 지원

## 기술 스택

- **프론트엔드**: Next.js 15, TypeScript, Tailwind CSS
- **백엔드**: Firebase (Auth, Firestore, Storage)
- **스타일링**: Tailwind CSS

## 시작하기

### 1. Firebase 프로젝트 설정

1. [Firebase Console](https://console.firebase.google.com/)에서 새 프로젝트 생성
2. **Authentication** 활성화
   - Google 로그인 공급자 활성화
3. **Firestore Database** 생성
   - 테스트 모드로 시작 (나중에 보안 규칙 설정)
4. **Storage** 활성화
   - 테스트 모드로 시작

### 2. 환경 변수 설정

```bash
cp .env.example .env.local
```

`.env.local` 파일을 열고 Firebase 콘솔에서 가져온 값으로 채우세요:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 3. 개발 서버 실행

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000)에서 앱 확인

### 4. 보안 규칙 배포 (선택)

```bash
# Firestore 규칙 배포
firebase deploy --only firestore:rules

# Storage 규칙 배포
firebase deploy --only storage:rules
```

## 프로젝트 구조

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # 인증 라우트
│   │   └── login/         # 로그인 페이지
│   ├── (chat)/            # 채팅 라우트
│   │   ├── chats/         #   │   └── chats/[id 대화 목록
│]/   # 개별 채팅
│   └── layout.tsx         # 루트 레이아웃
├── components/            # 리액트 컴포넌트
│   └── providers/         # Auth, ProtectedRoute
├── lib/
│   ├── firebase/          # Firebase 설정 및 유틸
│   └── utils.ts           # 유틸리티 함수
└── types/                 # TypeScript 타입 정의
```

## 배포

Vercel 또는 Firebase Hosting에 배포 가능:

```bash
# Vercel (권장)
vercel deploy

# Firebase Hosting
firebase init hosting
firebase deploy
```

## 라이선스

MIT
