/**
 * 텍스트를 한국어로 번역하는 유틸리티
 * 여러 번역 API를 시도하여 안정성 확보
 */

// 딜레이 함수
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// localStorage에서 번역 캐시 관리
const TRANSLATION_CACHE_KEY = 'history_translations_cache';
const CACHE_EXPIRY_DAYS = 7; // 7일간 캐시 유지

interface TranslationCache {
  [key: string]: {
    translation: string;
    timestamp: number;
  };
}

function getTranslationCache(): TranslationCache {
  try {
    const cached = localStorage.getItem(TRANSLATION_CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (error) {
    console.warn('캐시 읽기 실패:', error);
  }
  return {};
}

function saveTranslationCache(cache: TranslationCache) {
  try {
    localStorage.setItem(TRANSLATION_CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.warn('캐시 저장 실패:', error);
  }
}

function getCachedTranslation(text: string): string | null {
  const cache = getTranslationCache();
  const cached = cache[text];
  
  if (cached) {
    const age = Date.now() - cached.timestamp;
    const expiry = CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
    
    if (age < expiry) {
      return cached.translation;
    } else {
      // 만료된 캐시 삭제
      delete cache[text];
      saveTranslationCache(cache);
    }
  }
  
  return null;
}

function cacheTranslation(text: string, translation: string) {
  const cache = getTranslationCache();
  cache[text] = {
    translation,
    timestamp: Date.now(),
  };
  saveTranslationCache(cache);
}

// 전역 rate limit 플래그 - 429 에러 후 긴 대기 시간
let rateLimitCooldown = false;
let rateLimitCooldownUntil = 0;

// 재시도 로직이 포함된 번역 함수
async function translateWithRetry(
  text: string,
  maxRetries: number = 2,
  retryDelay: number = 30000 // 30초로 증가
): Promise<string | null> {
  // Rate limit cooldown 체크
  if (rateLimitCooldown && Date.now() < rateLimitCooldownUntil) {
    const waitTime = rateLimitCooldownUntil - Date.now();
    console.log(`⏸️ Rate limit cooldown 중입니다. ${Math.ceil(waitTime / 1000)}초 후 재시도...`);
    await delay(waitTime);
    rateLimitCooldown = false; // Cooldown 해제
  }

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // MyMemory Translation API 사용 (CORS 허용)
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|ko`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      // 성공적으로 응답받았을 때
      if (response.ok) {
        const result = await response.json();
        if (result.responseData && result.responseData.translatedText) {
          const translated = result.responseData.translatedText;
          // 번역 결과가 원본과 다를 때만 반환
          if (translated !== text && translated.trim().length > 0) {
            return translated;
          }
        }
      }

      // 429 에러: 즉시 포기하고 원본 반환 (백그라운드 처리이므로 실패해도 OK)
      if (response.status === 429) {
        // Rate limit에 걸렸으면 즉시 포기
        rateLimitCooldown = true;
        rateLimitCooldownUntil = Date.now() + 10 * 60 * 1000; // 10분간 cooldown
        
        console.warn(`⚠️ API rate limit 도달! 번역을 건너뜁니다. (원본 영어 표시)`);
        return null; // 즉시 포기하여 빠른 실패
      }

      // 기타 에러도 재시도 (429 제외)
      if (!response.ok && attempt < maxRetries - 1) {
        await delay(retryDelay * (attempt + 1));
        continue;
      }
    } catch (error) {
      // 네트워크 에러도 재시도
      if (attempt < maxRetries - 1) {
        await delay(retryDelay * (attempt + 1));
        continue;
      }
    }
  }

  return null; // 모든 재시도 실패
}

// 대체 번역 API (LibreTranslate - 공개 API)
async function translateWithLibreTranslate(text: string): Promise<string | null> {
  try {
    // LibreTranslate는 CORS 제한이 있을 수 있으므로 시도만 함
    const response = await fetch('https://libretranslate.de/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: text,
        source: 'en',
        target: 'ko',
        format: 'text',
      }),
    });

    if (response.ok) {
      const result = await response.json();
      if (result.translatedText) {
        return result.translatedText;
      }
    }
  } catch (error) {
    // CORS 에러 등은 조용히 실패
  }

  return null;
}

// 번역 함수 (rate limiting 방지 및 재시도 로직 포함)
export async function translateToKorean(text: string): Promise<string> {
  // 이미 한글이면 번역 불필요
  if (!needsTranslation(text)) {
    return text;
  }

  // 캐시에서 먼저 확인
  const cached = getCachedTranslation(text);
  if (cached) {
    console.log('✅ 캐시에서 번역 결과를 찾았습니다.');
    return cached;
  }

  // 텍스트가 너무 길면 원본 반환 (API 제한 때문)
  if (text.length > 500) {
    console.warn('텍스트가 너무 길어 번역을 건너뜁니다.');
    return text;
  }

  // 첫 번째 시도: MyMemory API (재시도 포함)
  const translated = await translateWithRetry(text);
  if (translated) {
    // 성공한 번역을 캐시에 저장
    cacheTranslation(text, translated);
    return translated;
  }

  // 두 번째 시도: LibreTranslate (MyMemory 실패 시)
  const libreTranslated = await translateWithLibreTranslate(text);
  if (libreTranslated) {
    // 성공한 번역을 캐시에 저장
    cacheTranslation(text, libreTranslated);
    return libreTranslated;
  }

  // 모든 방법 실패 시 원본 반환
  console.warn('번역 실패, 원본 텍스트 사용:', text.substring(0, 50));
  return text;
}

// 배치 번역 (여러 텍스트를 한 번에, rate limiting 방지)
export async function translateBatch(texts: string[], delayMs: number = 200): Promise<string[]> {
  const translatedTexts: string[] = [];
  
  // 순차적으로 번역하여 rate limiting 방지
  for (let i = 0; i < texts.length; i++) {
    const translated = await translateToKorean(texts[i]);
    translatedTexts.push(translated);
    
    // 마지막 항목이 아니면 딜레이
    if (i < texts.length - 1) {
      await delay(delayMs);
    }
  }
  
  return translatedTexts;
}

/**
 * 텍스트가 이미 한글이거나 번역이 필요 없는지 확인
 */
function needsTranslation(text: string): boolean {
  // 한글 유니코드 범위 체크
  const koreanRegex = /[가-힣]/;
  // 한글이 포함되어 있으면 번역 불필요
  if (koreanRegex.test(text)) {
    return false;
  }
  // 영어 알파벳이 포함되어 있으면 번역 필요
  const englishRegex = /[a-zA-Z]/;
  return englishRegex.test(text);
}

/**
 * HistoricalItem의 text를 번역
 */
export async function translateHistoricalItem(
  item: { text: string; [key: string]: any }
): Promise<string> {
  if (!needsTranslation(item.text)) {
    return item.text;
  }
  return await translateToKorean(item.text);
}

/**
 * HistoryData 전체를 번역 (상위 항목만 번역하여 API 제한 방지)
 * 캐시를 활용하여 이미 번역된 항목은 재번역하지 않습니다.
 * 번역 실패 시에도 원본을 반환하여 사용자 경험을 보장합니다.
 */
export async function translateHistoryData(data: {
  date: string;
  url: string;
  data: {
    Events: Array<{ text: string; [key: string]: any }>;
    Births: Array<{ text: string; [key: string]: any }>;
    Deaths: Array<{ text: string; [key: string]: any }>;
  };
}): Promise<typeof data> {
  // 더 많은 항목 번역 (표시되는 항목 모두)
  const EVENTS_TO_TRANSLATE = 5; // 상위 5개
  const BIRTHS_TO_TRANSLATE = 4; // 상위 4개
  
  console.log(`📝 번역 시작: Events ${EVENTS_TO_TRANSLATE}개, Births ${BIRTHS_TO_TRANSLATE}개 번역합니다...`);
  console.log('💾 캐시를 활용하여 이미 번역된 항목은 재번역하지 않습니다.');
  console.log('⏱️ API rate limit 방지를 위해 각 요청 사이에 대기합니다.');
  
  // 캐시 확인: 모든 항목이 캐시에 있는지 확인
  let cachedCount = 0;
  const eventsToCheck = data.data.Events.slice(0, EVENTS_TO_TRANSLATE);
  const birthsToCheck = data.data.Births.slice(0, BIRTHS_TO_TRANSLATE);
  
  for (const event of eventsToCheck) {
    if (getCachedTranslation(event.text)) cachedCount++;
  }
  for (const birth of birthsToCheck) {
    if (getCachedTranslation(birth.text)) cachedCount++;
  }
  
  const totalItems = EVENTS_TO_TRANSLATE + BIRTHS_TO_TRANSLATE;
  
  // 모두 캐시에 있으면 대기 시간 없이 진행
  if (cachedCount === totalItems) {
    console.log('✅ 모든 항목이 캐시에 있습니다. 즉시 번역합니다.');
  } else {
    // 일부만 캐시에 있거나 없는 경우, 짧은 초기 대기
    console.log(`💾 ${cachedCount}/${totalItems} 항목이 캐시에 있습니다. 새 번역을 시작합니다...`);
    await delay(2000); // 2초로 단축
  }
  
  // Events 번역 (상위 5개)
  const eventsToTranslate = data.data.Events.slice(0, EVENTS_TO_TRANSLATE);
  const translatedEvents: Array<{ text: string; [key: string]: any }> = [];
  
  for (let i = 0; i < eventsToTranslate.length; i++) {
    const event = eventsToTranslate[i];
    
    // 캐시 확인
    const cached = getCachedTranslation(event.text);
    if (cached) {
      console.log(`✅ [캐시] Events ${i + 1}/${eventsToTranslate.length} 번역됨`);
      translatedEvents.push({ ...event, text: cached });
      continue; // 캐시에서 찾았으면 API 호출 없이 다음 항목으로
    }
    
    // 첫 번째 항목 제외하고 요청 간 딜레이 (캐시에 없을 때만)
    if (i > 0) {
      const needsDelay = !getCachedTranslation(event.text);
      if (needsDelay) {
        console.log(`⏱️ Events 번역 중... (${i + 1}/${eventsToTranslate.length}) - 15초 대기`);
        await delay(15000); // 15초 딜레이 (rate limit 회피)
      }
    }
    
    try {
      console.log(`🌐 번역 중: ${event.text.substring(0, 50)}...`);
      const translated = await translateHistoricalItem(event);
      translatedEvents.push({ ...event, text: translated });
      console.log(`✅ 번역 완료`);
    } catch (error) {
      console.warn('❌ 번역 실패, 원본 사용:', event.text.substring(0, 50));
      translatedEvents.push(event); // 번역 실패 시 원본 반환
    }
  }
  
  // 나머지 Events는 원본 유지
  const remainingEvents = data.data.Events.slice(EVENTS_TO_TRANSLATE);
  
  // Events와 Births 사이 더 긴 대기 (새 번역이 필요할 때만)
  const birthsToTranslate = data.data.Births.slice(0, BIRTHS_TO_TRANSLATE);
  const needsNewBirthTranslation = birthsToTranslate.some(b => !getCachedTranslation(b.text));
  if (needsNewBirthTranslation) {
    console.log('✅ Events 번역 완료. Births 번역 시작 전 20초 대기...');
    await delay(20000); // 20초 대기
  }
  
  // Births 번역 (상위 4개)
  const translatedBirths: Array<{ text: string; [key: string]: any }> = [];
  
  for (let i = 0; i < birthsToTranslate.length; i++) {
    const birth = birthsToTranslate[i];
    
    // 캐시 확인
    const cached = getCachedTranslation(birth.text);
    if (cached) {
      console.log(`✅ [캐시] Births ${i + 1}/${birthsToTranslate.length} 번역됨`);
      translatedBirths.push({ ...birth, text: cached });
      continue; // 캐시에서 찾았으면 API 호출 없이 다음 항목으로
    }
    
    // 첫 번째 항목 제외하고 요청 간 딜레이 (캐시에 없을 때만)
    if (i > 0) {
      const needsDelay = !getCachedTranslation(birth.text);
      if (needsDelay) {
        console.log(`⏱️ Births 번역 중... (${i + 1}/${birthsToTranslate.length}) - 15초 대기`);
        await delay(15000); // 15초 딜레이
      }
    }
    
    try {
      console.log(`🌐 번역 중: ${birth.text.substring(0, 50)}...`);
      const translated = await translateHistoricalItem(birth);
      translatedBirths.push({ ...birth, text: translated });
      console.log(`✅ 번역 완료`);
    } catch (error) {
      console.warn('❌ 번역 실패, 원본 사용:', birth.text.substring(0, 50));
      translatedBirths.push(birth); // 번역 실패 시 원본 반환
    }
  }
  
  // 나머지 Births는 원본 유지
  const remainingBirths = data.data.Births.slice(BIRTHS_TO_TRANSLATE);

  // Deaths는 번역하지 않음 (사용하지 않음)

  console.log('✅ 모든 번역 완료!');
  return {
    ...data,
    data: {
      Events: [...translatedEvents, ...remainingEvents],
      Births: [...translatedBirths, ...remainingBirths],
      Deaths: data.data.Deaths, // 번역하지 않음
    },
  };
}

