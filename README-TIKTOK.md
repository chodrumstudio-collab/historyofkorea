# TikTok 자동 포스팅 설정

이 프로젝트는 매일 오늘의 역사 데이터를 TikTok에 자동으로 게시할 수 있습니다.

## 설정 방법

### 1. TikTok for Developers 계정 생성

1. https://developers.tiktok.com 접속
2. TikTok 계정으로 로그인
3. "Create an App" 클릭하여 새 앱 생성
4. Content Creation API 권한 활성화
5. API 키 및 Access Token 발급

### 2. Vercel 환경 변수 설정

Vercel 대시보드에서 다음 환경 변수를 추가하세요:

```
TIKTOK_API_KEY=your_api_key_here
TIKTOK_ACCESS_TOKEN=your_access_token_here
CRON_SECRET=your_secret_key_here (선택사항)
```

### 3. 자동 실행 확인

- Vercel Cron이 매일 오전 9시 (KST)에 `/api/tiktok-post` 엔드포인트를 호출합니다
- 또는 수동으로 `https://your-domain.vercel.app/api/tiktok-post`에 GET 요청하여 테스트할 수 있습니다

## 수동 실행

브라우저나 curl로 실행:

```bash
curl https://your-domain.vercel.app/api/tiktok-post
```

## 게시 내용 형식

매일 다음과 같은 형식으로 TikTok에 게시됩니다:

```
📅 11월 3일의 역사

📜 주요 사건:
1. 1862년: 조선, 경기도 광주에서...
2. 1929년: 대한민국, 광주에서...
3. 1945년: 대한민국, 평양에서...

🎂 오늘 태어난 인물:
1. 1500년: 르네상스 시대 이탈리아의 조각가...
2. 1560년: 이탈리아의 화가...

#역사 #오늘의역사 #한국역사 #역사스토리
```

## 주의사항

- TikTok API는 비즈니스 계정이 필요할 수 있습니다
- API 사용 제한이 있을 수 있습니다
- TikTok의 자동화 정책을 확인하세요
- 테스트 후 실제 게시를 활성화하세요

