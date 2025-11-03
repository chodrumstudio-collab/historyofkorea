import { HistoryData, HistoricalItem } from '../types';

// 한국어 Wikipedia API를 사용하여 오늘의 역사 데이터 가져오기
// Wikipedia API는 다국어을 지원하며 한국어 데이터를 직접 제공할 수 있습니다

/**
 * 현재 날짜를 "월일" 형식으로 반환 (예: "11월_2일")
 */
function getTodayDateString(): string {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  
  const monthNames = [
    '1월', '2월', '3월', '4월', '5월', '6월',
    '7월', '8월', '9월', '10월', '11월', '12월'
  ];
  
  return `${monthNames[month - 1]}_${day}일`;
}

/**
 * 텍스트가 한국 관련인지 확인 (한국어 키워드 체크)
 * 이 함수는 외부에서도 사용 가능하도록 export
 */
export function isKoreanRelated(text: string): boolean {
  const koreanKeywords = [
    '한국', '조선', '대한민국', '서울', '부산', '경주', '신라', '백제', '고구려',
    'Korea', 'Korean', 'Seoul', 'South Korea', 'North Korea',
    '조선민주주의인민공화국', '북한', '남한', '고려', '발해', '왜란', '임진왜란',
    '6.25', '한국전쟁', 'Korean War', 'DMZ', '판문점'
  ];
  
  const lowerText = text.toLowerCase();
  return koreanKeywords.some(keyword => lowerText.includes(keyword.toLowerCase()));
}

/**
 * 한국 관련 항목을 우선순위로 정렬
 */
function prioritizeKoreanItems(items: HistoricalItem[]): HistoricalItem[] {
  if (!items || !Array.isArray(items)) {
    console.warn('prioritizeKoreanItems: items가 배열이 아닙니다.', items);
    return [];
  }
  
  try {
    const koreanItems = items.filter(item => item && item.text && isKoreanRelated(item.text));
    const otherItems = items.filter(item => item && item.text && !isKoreanRelated(item.text));
    
    // 한국 관련 항목을 앞에 배치
    return [...koreanItems, ...otherItems];
  } catch (error) {
    console.warn('prioritizeKoreanItems 실패, 원본 반환:', error);
    return items;
  }
}

/**
 * Wikipedia 한국어 HTML에서 구조화된 데이터 파싱
 */
function parseKoreanWikipediaHTML(html: string): {
  events: Array<{ year: string; text: string; html: string; links: Array<{ title: string; link: string }> }>;
  births: Array<{ year: string; text: string; html: string; links: Array<{ title: string; link: string }> }>;
} {
  const events: Array<{ year: string; text: string; html: string; links: Array<{ title: string; link: string }> }> = [];
  const births: Array<{ year: string; text: string; html: string; links: Array<{ title: string; link: string }> }> = [];

  try {
    // HTML 문자열을 DOM처럼 파싱 (간단한 정규식 기반)
    // "사건" 섹션 찾기 - 더 유연한 패턴 사용
    // 방법 1: section 태그 안에서 찾기
    let eventsSectionMatch = html.match(/<section[^>]*>.*?<h2[^>]*id="사건"[^>]*>.*?<\/h2>\s*<ul[^>]*id="[^"]*">(.*?)<\/ul>/s);
    
    // 방법 2: section 없이 바로 찾기
    if (!eventsSectionMatch) {
      eventsSectionMatch = html.match(/<h2[^>]*id="사건"[^>]*>.*?<\/h2>\s*<ul[^>]*id="[^"]*">(.*?)<\/ul>/s);
    }
    
    if (eventsSectionMatch) {
      const eventsList = eventsSectionMatch[1];
      // li 태그를 더 유연하게 찾기 (id가 있거나 없거나)
      const eventItems = eventsList.match(/<li[^>]*>(.*?)<\/li>/gs) || [];
      
      console.log(`📋 Events 항목 ${eventItems.length}개 발견`);
      
      for (const item of eventItems.slice(0, 20)) { // 최대 20개
        // 연도 추출 - 더 유연한 패턴
        let yearMatch = item.match(/<a[^>]*href="\.\/(\d{4})년"[^>]*>(\d{4})년<\/a>/);
        if (!yearMatch) {
          yearMatch = item.match(/(\d{4})년/);
        }
        // 여전히 없으면 숫자 4자리 찾기
        if (!yearMatch) {
          yearMatch = item.match(/(\d{4})/);
        }
        const year = yearMatch ? yearMatch[1] : '?';
        
        if (!year || year === '?') {
          console.warn('⚠️ 연도를 찾을 수 없음:', item.substring(0, 100));
        }
        
        // HTML 태그 제거하고 텍스트만 추출
        let text = item
          .replace(/<[^>]+>/g, ' ') // HTML 태그 제거
          .replace(/\s+/g, ' ') // 공백 정리
          .trim();
        
        // 연도 제거 (여러 패턴 지원)
        text = text
          .replace(/^\d{4}년\s*-?\s*/, '') // "1862년 - " 패턴
          .replace(/^\d{4}년\s+/, '') // "1862년 " 패턴
          .trim();
        
        if (text && text.length > 5) {
          // 링크 추출
          const links: Array<{ title: string; link: string }> = [];
          const linkMatches = item.matchAll(/<a[^>]*href="\.\/([^"]+)"[^>]*title="([^"]+)"[^>]*>/g);
          for (const match of linkMatches) {
            links.push({
              title: match[2],
              link: `https://ko.wikipedia.org/wiki/${encodeURIComponent(match[1])}`
            });
          }
          
          events.push({
            year,
            text,
            html: item,
            links
          });
        }
      }
    }

    // "탄생" 섹션 찾기 - 더 유연한 패턴 사용
    let birthsSectionMatch = html.match(/<section[^>]*>.*?<h2[^>]*id="탄생"[^>]*>.*?<\/h2>\s*<ul[^>]*id="[^"]*">(.*?)<\/ul>/s);
    
    // 방법 2: section 없이 바로 찾기
    if (!birthsSectionMatch) {
      birthsSectionMatch = html.match(/<h2[^>]*id="탄생"[^>]*>.*?<\/h2>\s*<ul[^>]*id="[^"]*">(.*?)<\/ul>/s);
    }
    
    if (birthsSectionMatch) {
      const birthsList = birthsSectionMatch[1];
      // li 태그를 더 유연하게 찾기
      const birthItems = birthsList.match(/<li[^>]*>(.*?)<\/li>/gs) || [];
      
      console.log(`📋 Births 항목 ${birthItems.length}개 발견`);
      
      for (const item of birthItems.slice(0, 20)) { // 최대 20개
        // 연도 추출 - 더 유연한 패턴
        let yearMatch = item.match(/<a[^>]*href="\.\/(\d{4})년"[^>]*>(\d{4})년<\/a>/);
        if (!yearMatch) {
          yearMatch = item.match(/(\d{4})년/);
        }
        // 여전히 없으면 숫자 4자리 찾기
        if (!yearMatch) {
          yearMatch = item.match(/(\d{4})/);
        }
        const year = yearMatch ? yearMatch[1] : '?';
        
        if (!year || year === '?') {
          console.warn('⚠️ 연도를 찾을 수 없음:', item.substring(0, 100));
        }
        
        // HTML 태그 제거하고 텍스트만 추출
        let text = item
          .replace(/<[^>]+>/g, ' ') // HTML 태그 제거
          .replace(/\s+/g, ' ') // 공백 정리
          .trim();
        
        // 연도 제거 (여러 패턴 지원)
        text = text
          .replace(/^\d{4}년\s*-?\s*/, '') // "1862년 - " 패턴
          .replace(/^\d{4}년\s+/, '') // "1862년 " 패턴
          .trim();
        
        if (text && text.length > 5) {
          // 링크 추출
          const links: Array<{ title: string; link: string }> = [];
          const linkMatches = item.matchAll(/<a[^>]*href="\.\/([^"]+)"[^>]*title="([^"]+)"[^>]*>/g);
          for (const match of linkMatches) {
            links.push({
              title: match[2],
              link: `https://ko.wikipedia.org/wiki/${encodeURIComponent(match[1])}`
            });
          }
          
          births.push({
            year,
            text,
            html: item,
            links
          });
        }
      }
    }
  } catch (error) {
    console.warn('한국어 위키피디아 HTML 파싱 실패:', error);
  }

  return { events, births };
}

/**
 * Wikipedia 한국어 API를 통해 한국어 역사 데이터 가져오기
 */
async function fetchKoreanHistoryFromWikipedia(dateString: string): Promise<HistoryData | null> {
  try {
    // HTML 형식으로 가져오기
    const wikiUrl = `https://ko.wikipedia.org/api/rest_v1/page/html/${encodeURIComponent(dateString)}`;
    
    const response = await fetch(wikiUrl, {
      headers: {
        'Accept': 'text/html',
      },
    });
    
    if (!response.ok) {
      console.warn(`한국어 위키피디아 API 실패: ${response.status}`);
      return null;
    }
    
    const html = await response.text();
    const { events, births } = parseKoreanWikipediaHTML(html);
    
    if (events.length === 0 && births.length === 0) {
      console.warn('한국어 위키피디아에서 데이터를 찾을 수 없습니다.');
      return null;
    }
    
    console.log(`✅ 한국어 데이터 추출 성공: ${events.length}개 사건, ${births.length}개 출생`);
    
    return {
      date: dateString.replace('_', ' '),
      url: `https://ko.wikipedia.org/wiki/${encodeURIComponent(dateString)}`,
      data: {
        Events: events,
        Births: births,
        Deaths: [], // 사망 정보는 추후 추가 가능
      },
    };
  } catch (error) {
    console.warn('한국어 위키피디아 API 호출 실패:', error);
    return null;
  }
}

// localStorage에서 날짜별 데이터 캐싱
const CACHE_KEY_PREFIX = 'history_data_';
const CACHE_EXPIRY_HOURS = 24; // 24시간 동안 캐시 유지

/**
 * 오늘 날짜를 YYYY-MM-DD 형식으로 반환
 */
function getTodayCacheKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${CACHE_KEY_PREFIX}${year}-${month}-${day}`;
}

/**
 * 캐시된 데이터 가져오기
 */
function getCachedData(): HistoryData | null {
  try {
    const cacheKey = getTodayCacheKey();
    const cached = localStorage.getItem(cacheKey);
    
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      const age = Date.now() - timestamp;
      const expiry = CACHE_EXPIRY_HOURS * 60 * 60 * 1000;
      
      // 캐시가 유효한 경우 (24시간 이내)
      if (age < expiry) {
        // 데이터 구조 검증
        if (data && data.data && Array.isArray(data.data.Events) && Array.isArray(data.data.Births)) {
          console.log('✅ 캐시에서 데이터 로드');
          return data;
        } else {
          console.warn('⚠️ 캐시 데이터 구조가 올바르지 않음. 캐시 삭제');
          localStorage.removeItem(cacheKey);
        }
      } else {
        // 만료된 캐시 삭제
        localStorage.removeItem(cacheKey);
      }
    }
  } catch (error) {
    console.warn('캐시 읽기 실패:', error);
    // 손상된 캐시 삭제
    try {
      localStorage.removeItem(getTodayCacheKey());
    } catch (e) {
      // 무시
    }
  }
  
  return null;
}

/**
 * 데이터를 캐시에 저장
 */
function saveToCache(data: HistoryData): void {
  try {
    const cacheKey = getTodayCacheKey();
    const cacheData = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    console.log('💾 데이터를 캐시에 저장했습니다');
  } catch (error) {
    console.warn('캐시 저장 실패:', error);
  }
}

/**
 * 대체 API 1: history.muffinlabs.com (원본)
 */
async function fetchFromMuffinLabs(): Promise<HistoryData | null> {
  try {
    const response = await fetch('https://history.muffinlabs.com/date', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.warn(`❌ API 응답 실패: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const data = await response.json();
    
    // 데이터 구조 검증
    if (!data || !data.data || !Array.isArray(data.data.Events) || !Array.isArray(data.data.Births)) {
      console.warn('❌ API 데이터 구조가 올바르지 않음');
      return null;
    }
    
    console.log(`✅ API 데이터 가져오기 성공: ${data.data.Events.length}개 사건, ${data.data.Births.length}개 출생`);
    return data;
  } catch (error) {
    console.warn('❌ Muffin Labs API 실패:', error instanceof Error ? error.message : error);
    return null;
  }
}

/**
 * 대체 API 2: CORS 프록시를 통한 접근
 */
async function fetchWithProxy(): Promise<HistoryData | null> {
  try {
    // 여러 무료 CORS 프록시 중 하나 사용
    const proxies = [
      'https://api.allorigins.win/raw?url=',
      'https://corsproxy.io/?',
    ];
    
    const apiUrl = 'https://history.muffinlabs.com/date';
    
    for (const proxy of proxies) {
      try {
        const response = await fetch(`${proxy}${encodeURIComponent(apiUrl)}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ 프록시를 통해 데이터 가져오기 성공');
          return data;
        }
      } catch (error) {
        console.warn('프록시 실패, 다음 프록시 시도:', error);
        continue;
      }
    }
    
    return null;
  } catch (error) {
    console.warn('프록시 API 실패:', error);
    return null;
  }
}

/**
 * 한국어 역사 데이터를 제공하는 API
 * 여러 소스를 시도하고, 실패 시 캐시된 데이터 사용
 */
export async function fetchHistoryData(): Promise<HistoryData> {
  const todayDate = getTodayDateString();
  
  // 우선순위 1: 한국어 Wikipedia에서 직접 가져오기 (한글로 된 원본 데이터)
  console.log('🔄 한국어 위키피디아에서 데이터 가져오기 시도...');
  let data = await fetchKoreanHistoryFromWikipedia(todayDate);
  
  // 한국어 데이터가 있으면 캐시 확인 없이 바로 사용
  if (data && data.data.Events.length > 0) {
    console.log(`✅ 한국어 위키피디아 데이터 사용! (${data.data.Events.length}개 사건, ${data.data.Births.length}개 출생)`);
    
    // 한국 관련 항목 우선순위 정렬
    const processedData: HistoryData = {
      ...data,
      data: {
        Events: prioritizeKoreanItems(data.data.Events),
        Births: prioritizeKoreanItems(data.data.Births),
        Deaths: data.data.Deaths,
      },
    };
    
    // 캐시에 저장
    saveToCache(processedData);
    return processedData;
  }
  
  console.log('⚠️ 한국어 위키피디아에서 데이터를 가져오지 못했습니다.');
  
  // 한국어 데이터가 없으면 캐시 확인 (하지만 영어일 수 있음)
  const cached = getCachedData();
  if (cached) {
    console.log('⚠️ 캐시에서 데이터 로드 (영어일 수 있음)');
    // 캐시된 데이터도 한국 관련 항목 우선순위 적용
    return {
      ...cached,
      data: {
        Events: prioritizeKoreanItems(cached.data.Events),
        Births: prioritizeKoreanItems(cached.data.Births),
        Deaths: prioritizeKoreanItems(cached.data.Deaths),
      },
    };
  }
  
  // 한국어 데이터가 없으면 영어 API 사용 (Fallback)
  console.log('⚠️ 한국어 데이터 없음. 영어 API 사용...');
  
  // 여러 API 소스를 순차적으로 시도
  // 시도 1: 직접 API 호출
  console.log('🔄 API 1 시도: history.muffinlabs.com');
  data = await fetchFromMuffinLabs();
  
  // 시도 2: CORS 프록시 사용
  if (!data) {
    console.log('🔄 API 2 시도: CORS 프록시');
    data = await fetchWithProxy();
  }
  
  // 모든 시도 실패
  if (!data) {
    console.warn('⚠️ 모든 API 호출 실패. 캐시된 데이터 확인 중...');
    
    // 최근 캐시된 데이터 찾기 (최근 7일 이내)
    for (let i = 1; i <= 7; i++) {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - i);
      const pastDateKey = `${CACHE_KEY_PREFIX}${pastDate.getFullYear()}-${String(pastDate.getMonth() + 1).padStart(2, '0')}-${String(pastDate.getDate()).padStart(2, '0')}`;
      
      try {
        const pastCache = localStorage.getItem(pastDateKey);
        if (pastCache) {
          const { data: pastData } = JSON.parse(pastCache);
          if (pastData && pastData.data && Array.isArray(pastData.data.Events)) {
            console.log(`⚠️ ${i}일 전 데이터를 표시합니다.`);
            return {
              ...pastData,
              date: convertDateToKorean(todayDate.replace('_', ' ')),
            };
          }
        }
      } catch (error) {
        continue;
      }
    }
    
    throw new Error('데이터를 가져올 수 없습니다. 인터넷 연결을 확인하고 페이지를 새로고침하세요.');
  }
  
  // 날짜를 한국어 형식으로 변환
  let koreanDate: string;
  try {
    koreanDate = convertDateToKorean(data.date);
  } catch (error) {
    console.warn('날짜 변환 실패, 원본 사용:', error);
    koreanDate = data.date;
  }
  
  // 한국 관련 항목을 우선순위로 정렬 (에러 발생 시 원본 사용)
  let prioritizedEvents: HistoricalItem[];
  let prioritizedBirths: HistoricalItem[];
  let prioritizedDeaths: HistoricalItem[];
  
  try {
    prioritizedEvents = prioritizeKoreanItems(data.data.Events || []);
    prioritizedBirths = prioritizeKoreanItems(data.data.Births || []);
    prioritizedDeaths = prioritizeKoreanItems(data.data.Deaths || []);
  } catch (error) {
    console.warn('한국 관련 항목 우선순위 정렬 실패, 원본 사용:', error);
    prioritizedEvents = data.data.Events || [];
    prioritizedBirths = data.data.Births || [];
    prioritizedDeaths = data.data.Deaths || [];
  }
  
  const processedData: HistoryData = {
    ...data,
    date: koreanDate,
    data: {
      Events: prioritizedEvents,
      Births: prioritizedBirths,
      Deaths: prioritizedDeaths,
    },
  };
  
  // 데이터 구조 최종 검증
  if (!processedData.data || !Array.isArray(processedData.data.Events) || !Array.isArray(processedData.data.Births)) {
    console.error('❌ 처리된 데이터 구조가 올바르지 않음:', processedData);
    throw new Error('데이터 구조 처리 중 오류가 발생했습니다.');
  }
  
  console.log(`✅ 데이터 처리 완료: ${processedData.data.Events.length}개 사건, ${processedData.data.Births.length}개 출생`);
  
  // 성공적으로 가져온 데이터를 캐시에 저장
  try {
    saveToCache(processedData);
  } catch (error) {
    console.warn('캐시 저장 실패 (계속 진행):', error);
  }
  
  return processedData;
}

/**
 * 영어 날짜를 한국어 형식으로 변환
 * 예: "November 2" -> "11월 2일"
 */
function convertDateToKorean(englishDate: string): string {
  const months: { [key: string]: string } = {
    'January': '1월', 'February': '2월', 'March': '3월', 'April': '4월',
    'May': '5월', 'June': '6월', 'July': '7월', 'August': '8월',
    'September': '9월', 'October': '10월', 'November': '11월', 'December': '12월'
  };
  
  const parts = englishDate.split(' ');
  if (parts.length === 2) {
    const month = months[parts[0]];
    const day = parts[1];
    if (month) {
      return `${month} ${day}일`;
    }
  }
  
  return englishDate; // 변환 실패 시 원본 반환
}
