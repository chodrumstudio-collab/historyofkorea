# 💻 오늘의 역사 웹사이트 - Cursor 개발 프롬프트

## 프로젝트 개요
"Today in History" (오늘의 역사) 모바일 웹사이트를 React, TypeScript, Tailwind CSS로 개발

---

## 기술 스택
- **React 18** with Vite
- **TypeScript**
- **Tailwind CSS**
- **Lucide React** (아이콘)

---

## 프로젝트 구조

```
src/
├── App.tsx
├── main.tsx
├── index.css
├── components/
│   ├── Header.tsx
│   ├── EventCard.tsx
│   ├── EventsSection.tsx
│   ├── BirthsSection.tsx
│   ├── FunFactCard.tsx
│   ├── TriviaCard.tsx
│   └── Footer.tsx
├── hooks/
│   └── useHistoryData.ts
├── types/
│   └── index.ts
└── utils/
    └── api.ts
```

---

## API 연동

### History Muffin Labs API
- **Endpoint**: `http://history.muffinlabs.com/date`
- **설명**: 오늘의 역사적 사건, 출생, 사망 정보 반환
- **응답 형식**: JSON

### API 응답 구조
```json
{
  "date": "November 3",
  "url": "https://wikipedia.org/wiki/November_3",
  "data": {
    "Events": [
      {
        "year": "2000",
        "text": "Event description...",
        "html": "<a href='...'>...</a>",
        "links": [{"title": "...", "link": "..."}]
      }
    ],
    "Births": [...],
    "Deaths": [...]
  }
}
```

---

## TypeScript 타입 정의 (types/index.ts)

```typescript
export interface HistoricalItem {
  year: string;
  text: string;
  html: string;
  links: Array<{
    title: string;
    link: string;
  }>;
}

export interface HistoryData {
  date: string;
  url: string;
  data: {
    Events: HistoricalItem[];
    Births: HistoricalItem[];
    Deaths: HistoricalItem[];
  };
}
```

---

## Custom Hook (hooks/useHistoryData.ts)

```typescript
// 구현 요구사항:
// 1. 컴포넌트 마운트 시 API에서 데이터 fetch
// 2. loading 상태 관리
// 3. error 상태 관리
// 4. data, loading, error 반환

export const useHistoryData = () => {
  // useState로 data, loading, error 상태 관리
  // useEffect로 API 호출
  // try-catch로 에러 핸들링
  // return { data, loading, error }
};
```

---

## 컴포넌트 구현 가이드

### 1. Header.tsx
- 현재 날짜를 한국어 형식으로 표시 (예: "11월 3일")
- 제목: "오늘의 역사"
- 깔끔하고 심플한 디자인

```tsx
// Props: none
// 기능: 
// - 현재 날짜를 JavaScript Date 객체로 가져오기
// - 한국어 형식으로 변환 (예: 11월 3일)
// - 제목과 함께 헤더 섹션 렌더링
```

### 2. EventCard.tsx
- Props: `year: string`, `text: string`, `link: string`
- 연도 배지와 이벤트 설명 표시
- 클릭 시 Wikipedia 링크를 새 탭에서 열기

```tsx
interface EventCardProps {
  year: string;
  text: string;
  link: string;
}

// 스타일:
// - 흰색 배경, 둥근 모서리 (rounded-xl)
// - 그림자 효과 (shadow-md)
// - hover 효과
```

### 3. EventsSection.tsx
- Props: `events: HistoricalItem[]`
- 상위 5개 이벤트만 표시
- 섹션 헤더: "역사적 사건" + 📜 아이콘
- EventCard 컴포넌트 매핑

```tsx
interface EventsSectionProps {
  events: HistoricalItem[];
}

// 기능:
// - events.slice(0, 5)로 상위 5개만 선택
// - map으로 EventCard 렌더링
// - 적절한 key prop 설정
```

### 4. BirthsSection.tsx
- Props: `births: HistoricalItem[]`
- 상위 4명의 출생 정보 표시
- 섹션 헤더: "오늘 태어난 인물" + 🎂 아이콘
- 그리드 레이아웃 (모바일: 2열)

```tsx
interface BirthsSectionProps {
  births: HistoricalItem[];
}

// 스타일:
// - grid grid-cols-2 gap-4
// - 각 카드: 연도, 이름, 간단한 설명
```

### 5. FunFactCard.tsx
- 흥미로운 사실을 하이라이트 박스로 표시
- 밝은 배경 + 💡 아이콘
- 제목: "오늘의 재미있는 사실"

```tsx
interface FunFactCardProps {
  fact: string;
}

// 스타일:
// - 밝은 노란색/호박색 배경 (bg-amber-50)
// - 큰 텍스트 (text-lg)
// - 중앙 정렬
```

### 6. TriviaCard.tsx
- 퀴즈 질문 표시
- 정답 표시/숨김 토글 버튼
- 제목: "오늘의 퀴즈" + 🎯 아이콘

```tsx
interface TriviaCardProps {
  question: string;
  answer: string;
}

// 기능:
// - useState로 showAnswer 상태 관리
// - "정답 보기" 버튼 클릭 시 토글
// - 조건부 렌더링으로 답변 표시
```

### 7. Footer.tsx
- 간단한 출처 표시
- "Data source: Wikipedia"

```tsx
// 스타일:
// - 회색 배경 (bg-gray-100)
// - 작은 텍스트 (text-sm)
// - 중앙 정렬
```

---

## 메인 App 컴포넌트 (App.tsx)

```tsx
function App() {
  const { data, loading, error } = useHistoryData();

  // Loading 상태 처리
  if (loading) {
    return <div>로딩 중...</div>;
  }

  // Error 상태 처리
  if (error) {
    return <div>데이터를 불러오는데 실패했습니다.</div>;
  }

  // 데이터 렌더링
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto">
        <Header />
        <main className="p-4 space-y-8">
          <EventsSection events={data?.data.Events || []} />
          <BirthsSection births={data?.data.Births || []} />
          <FunFactCard fact="재미있는 사실 예시" />
          <TriviaCard 
            question="퀴즈 질문" 
            answer="퀴즈 답변" 
          />
        </main>
        <Footer />
      </div>
    </div>
  );
}
```

---

## Tailwind CSS 설정

### tailwind.config.js
```javascript
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#1E40AF',    // 파란색
        accent: '#F59E0B',      // 금색
        background: '#F9FAFB',  // 연한 회색
      },
    },
  },
  plugins: [],
}
```

### 주요 Tailwind 클래스 사용
- **둥근 모서리**: `rounded-lg`, `rounded-xl`
- **그림자**: `shadow-md`, `shadow-sm`
- **간격**: `p-4`, `p-6`, `gap-4`, `space-y-6`
- **반응형**: `max-w-md`, `mx-auto`
- **타이포그래피**: `text-xl`, `font-bold`, `text-gray-600`

---

## 핵심 기능

1. **한국어 날짜 형식** - JavaScript Date 객체 사용
2. **데이터 제한** - 상위 5개 이벤트, 4명의 인물만 표시
3. **외부 링크** - Wikipedia 링크는 `target="_blank"` 사용
4. **로딩 상태** - 스켈레톤 또는 스피너 표시
5. **에러 처리** - API 호출 실패 시 에러 메시지
6. **모바일 우선** - 반응형 디자인
7. **부드러운 스크롤** - smooth scrolling

---

## 성능 최적화

- `React.memo`로 정적 컴포넌트 메모이제이션
- 리스트에 적절한 `key` prop 사용
- 필요시 lazy loading

---

## 접근성 (A11y)

- 시맨틱 HTML 사용 (`header`, `main`, `section`, `footer`)
- 적절한 제목 계층 구조 (h1, h2, h3)
- 장식용 아이콘에 alt 텍스트
- 키보드 네비게이션 지원

---

## 에러 핸들링

- API 호출에 try-catch 사용
- 실패한 요청에 대한 fallback UI
- 디버깅을 위한 console.log

---

## 구현 단계

1. ✅ Vite + React + TypeScript 프로젝트 설정
2. ✅ Tailwind CSS 및 Lucide React 설치
3. ✅ 타입 정의 생성
4. ✅ API 유틸리티 함수 작성
5. ✅ useHistoryData hook 생성
6. ✅ 개별 컴포넌트 빌드
7. ✅ App.tsx에서 컴포넌트 조합
8. ✅ Tailwind로 스타일링
9. ✅ 실제 API 데이터로 테스트
10. ✅ 최적화 및 배포

---

## 설치 명령어

```bash
# 프로젝트 생성
npm create vite@latest today-in-history -- --template react-ts

# 디렉토리 이동
cd today-in-history

# 의존성 설치
npm install

# Tailwind CSS 설치
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Lucide React 설치 (아이콘)
npm install lucide-react

# 개발 서버 실행
npm run dev
```

---

## 시작하기

기본적인 API 연동과 데이터 표시부터 시작하고, 점진적으로 UI를 개선하세요.

**우선순위:**
1. API 연동 및 데이터 fetch
2. 기본 컴포넌트 구조
3. 스타일링 및 레이아웃
4. 상세 기능 추가
5. 최적화

---

## 참고 사항

- 모바일 우선 개발 (375px 기준)
- 데스크톱까지 반응형 확장 (max-width: 768px)
- 실제 API 데이터로 자주 테스트
- 한국어 텍스트 렌더링 확인

---

## 배포

추천 플랫폼:
- **Vercel** (가장 쉬움)
- **Netlify**
- **GitHub Pages**

```bash
# 빌드
npm run build

# Vercel 배포
npx vercel
```

---

**프로젝트 완료 체크리스트:**
- [ ] API 데이터 정상 fetch
- [ ] 모든 섹션 렌더링
- [ ] 한국어 날짜 표시
- [ ] 반응형 디자인 작동
- [ ] 로딩/에러 상태 처리
- [ ] 외부 링크 작동
- [ ] 접근성 확인
- [ ] 성능 최적화
- [ ] 배포 완료

Good luck! 🚀
