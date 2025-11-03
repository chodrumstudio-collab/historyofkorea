/**
 * Vercel Serverless Function
 * TikTok 자동 포스팅 API 엔드포인트
 * 매일 실행 (Vercel Cron 또는 외부 스케줄러)
 */

export default async function handler(request: any, response: any) {
  // CORS 헤더 설정
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  // GET 요청만 허용 (보안)
  if (request.method !== 'GET' && request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  // 인증 확인 (선택사항)
  const authHeader = request.headers.authorization;
  const expectedAuth = process.env.CRON_SECRET;
  
  if (expectedAuth && authHeader !== `Bearer ${expectedAuth}`) {
    return response.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // 오늘의 날짜 계산
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    
    const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월',
      '7월', '8월', '9월', '10월', '11월', '12월'];
    const dateString = `${monthNames[month - 1]}_${day}일`;

    // 한국어 위키피디아에서 데이터 가져오기
    const wikiUrl = `https://ko.wikipedia.org/api/rest_v1/page/html/${encodeURIComponent(dateString)}`;
    const htmlResponse = await fetch(wikiUrl);
    
    if (!htmlResponse.ok) {
      throw new Error('Wikipedia API failed');
    }
    
    const html = await htmlResponse.text();
    
    // 간단한 HTML 파싱
    const eventsMatch = html.match(/<section[^>]*>.*?<h2[^>]*id="사건"[^>]*>.*?<\/h2>\s*<ul[^>]*id="[^"]*">(.*?)<\/ul>/s);
    const events: string[] = [];
    
    if (eventsMatch) {
      const eventItems = eventsMatch[1].match(/<li[^>]*>(.*?)<\/li>/gs) || [];
      for (const item of eventItems.slice(0, 3)) {
        const yearMatch = item.match(/(\d{4})년/);
        const year = yearMatch ? yearMatch[1] : '';
        let text = item.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        text = text.replace(/^\d{4}년\s*/, '').trim();
        if (text && year) {
          events.push(`${year}년: ${text.substring(0, 100)}`);
        }
      }
    }

    // 출생 인물 파싱
    const birthsMatch = html.match(/<section[^>]*>.*?<h2[^>]*id="탄생"[^>]*>.*?<\/h2>\s*<ul[^>]*id="[^"]*">(.*?)<\/ul>/s);
    const births: string[] = [];
    
    if (birthsMatch) {
      const birthItems = birthsMatch[1].match(/<li[^>]*>(.*?)<\/li>/gs) || [];
      for (const item of birthItems.slice(0, 2)) {
        const yearMatch = item.match(/(\d{4})년/);
        const year = yearMatch ? yearMatch[1] : '';
        let text = item.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        text = text.replace(/^\d{4}년\s*/, '').trim();
        if (text && year) {
          births.push(`${year}년: ${text.substring(0, 80)}`);
        }
      }
    }

    // TikTok 게시 내용 생성
    let tikTokContent = `📅 ${month}월 ${day}일의 역사\n\n`;
    
    if (events.length > 0) {
      tikTokContent += '📜 주요 사건:\n';
      events.forEach((event, index) => {
        tikTokContent += `${index + 1}. ${event}\n`;
      });
    }
    
    if (births.length > 0) {
      tikTokContent += '\n🎂 오늘 태어난 인물:\n';
      births.forEach((birth, index) => {
        tikTokContent += `${index + 1}. ${birth}\n`;
      });
    }
    
    tikTokContent += '\n#역사 #오늘의역사 #한국역사 #역사스토리';
    
    // TikTok API 호출 (API 키가 있는 경우)
    const tikTokApiKey = process.env.TIKTOK_API_KEY;
    const tikTokAccessToken = process.env.TIKTOK_ACCESS_TOKEN;
    
    if (tikTokApiKey && tikTokAccessToken) {
      try {
        // TikTok Content Creation API
        // 실제 API는 TikTok for Developers 문서 참조: https://developers.tiktok.com/doc/content-posting-api/
        const tikTokResponse = await fetch('https://open.tiktokapis.com/v2/post/publish/', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${tikTokAccessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            post_info: {
              title: tikTokContent.substring(0, 150),
              privacy_level: 'PUBLIC_TO_EVERYONE',
            },
          }),
        });

        if (tikTokResponse.ok) {
          const result = await tikTokResponse.json();
          return response.status(200).json({
            success: true,
            message: 'TikTok에 게시되었습니다',
            content: tikTokContent,
            tiktokResult: result,
          });
        } else {
          const error = await tikTokResponse.json();
          return response.status(200).json({
            success: false,
            message: 'TikTok API 에러',
            content: tikTokContent,
            error: error,
          });
        }
      } catch (tiktokError) {
        return response.status(200).json({
          success: false,
          message: 'TikTok 게시 실패',
          content: tikTokContent,
          error: tiktokError instanceof Error ? tiktokError.message : String(tiktokError),
        });
      }
    } else {
      // API 키가 없으면 콘텐츠만 반환 (테스트용)
      return response.status(200).json({
        success: false,
        message: 'TikTok API 키가 설정되지 않았습니다',
        content: tikTokContent,
        note: 'TikTok for Developers에서 API 키를 발급받고 Vercel 환경 변수에 설정하세요',
        setupGuide: 'https://developers.tiktok.com/doc/content-posting-api/',
      });
    }
  } catch (error) {
    console.error('Error:', error);
    return response.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
