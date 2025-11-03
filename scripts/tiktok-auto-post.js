/**
 * TikTok 자동 포스팅 스크립트
 * 매일 오늘의 역사 데이터를 TikTok에 자동으로 게시합니다
 */

import { fetchHistoryData } from '../src/utils/api.js';

/**
 * TikTok API로 텍스트 게시
 */
async function postToTikTok(text, hashtags = []) {
  // TikTok API 엔드포인트 (실제 사용 시 TikTok for Developers에서 발급받은 API 키 필요)
  const TIKTOK_API_KEY = process.env.TIKTOK_API_KEY;
  const TIKTOK_ACCESS_TOKEN = process.env.TIKTOK_ACCESS_TOKEN;
  
  if (!TIKTOK_API_KEY || !TIKTOK_ACCESS_TOKEN) {
    console.warn('⚠️ TikTok API 키가 설정되지 않았습니다. 환경 변수를 확인하세요.');
    return null;
  }

  try {
    // TikTok Content Creation API 엔드포인트
    // 실제 엔드포인트는 TikTok for Developers 문서 참조
    const response = await fetch('https://open.tiktokapis.com/v2/post/publish/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TIKTOK_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        post_info: {
          title: text.substring(0, 150), // TikTok 제목 (최대 150자)
          privacy_level: 'PUBLIC_TO_EVERYONE',
        },
        source_info: {
          source: 'FILE_UPLOAD',
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('TikTok API 에러:', error);
      return null;
    }

    const result = await response.json();
    console.log('✅ TikTok 게시 성공:', result);
    return result;
  } catch (error) {
    console.error('❌ TikTok 게시 실패:', error);
    return null;
  }
}

/**
 * 오늘의 역사 데이터를 TikTok용 텍스트로 포맷팅
 */
function formatForTikTok(data) {
  const date = new Date();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  let text = `📅 ${month}월 ${day}일의 역사\n\n`;
  
  // 상위 3개 사건만 선택
  const topEvents = data.data.Events.slice(0, 3);
  
  if (topEvents.length > 0) {
    text += '📜 주요 사건:\n';
    topEvents.forEach((event, index) => {
      text += `${index + 1}. ${event.year}년: ${event.text.substring(0, 80)}...\n`;
    });
  }
  
  // 상위 2개 출생 인물
  const topBirths = data.data.Births.slice(0, 2);
  if (topBirths.length > 0) {
    text += '\n🎂 오늘 태어난 인물:\n';
    topBirths.forEach((birth, index) => {
      text += `${index + 1}. ${birth.year}년: ${birth.text.substring(0, 60)}...\n`;
    });
  }
  
  text += '\n#역사 #오늘의역사 #한국역사 #역사스토리';
  
  return text;
}

/**
 * 메인 함수 - 매일 실행
 */
async function main() {
  try {
    console.log('🔄 오늘의 역사 데이터 가져오기...');
    
    // 오늘의 역사 데이터 가져오기
    const historyData = await fetchHistoryData();
    
    if (!historyData || !historyData.data.Events.length) {
      console.warn('⚠️ 오늘의 역사 데이터가 없습니다.');
      return;
    }
    
    console.log(`✅ 데이터 로드 완료: ${historyData.data.Events.length}개 사건`);
    
    // TikTok용 텍스트 포맷팅
    const tikTokText = formatForTikTok(historyData);
    console.log('📝 TikTok 게시 내용:', tikTokText);
    
    // TikTok에 게시
    const result = await postToTikTok(tikTokText);
    
    if (result) {
      console.log('✅ TikTok 게시 완료!');
    } else {
      console.log('⚠️ TikTok 게시는 스킵되었습니다 (API 키 미설정 또는 에러)');
    }
    
  } catch (error) {
    console.error('❌ 에러 발생:', error);
  }
}

// 실행
main();

