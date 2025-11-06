import { HistoricalItem } from '../types';

interface FunFactCardProps {
  events?: HistoricalItem[];
  births?: HistoricalItem[];
}

/**
 * 날짜를 기반으로 일관된 인덱스를 생성하는 함수
 * 같은 날짜에는 항상 같은 인덱스를 반환
 */
function getDateBasedIndex(date: Date, max: number): number {
  const dateString = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  let hash = 0;
  for (let i = 0; i < dateString.length; i++) {
    const char = dateString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash) % max;
}

/**
 * 텍스트에서 주요 키워드 추출 (인물, 장소, 사건명 등)
 */
function extractKeyEntities(text: string): { entities: string[]; locations: string[]; actions: string[] } {
  // 인물/사건명 추출
  const entityPatterns = [
    /([가-힣]{2,10})이|가/g,
    /([가-힣]{2,10})의/g,
    /([가-힣]{2,10})은|는/g,
    /([가-힣]{2,10})를|을/g,
  ];
  
  // 장소 추출
  const locationPatterns = [
    /([가-힣]{2,10})에서/g,
    /([가-힣]{2,10})에/g,
    /([가-힣]{2,10})로|으로/g,
  ];
  
  // 동작 추출
  const actionPatterns = [
    /([가-힣]{2,8})(했다|하였다|되었다|되었다)/g,
    /([가-힣]{2,8})(했다|하였다|되었다|되었다)/g,
    /([가-힣]{2,8})(했다|하였다|되었다|되었다)/g,
  ];
  
  const entities: string[] = [];
  entityPatterns.forEach(pattern => {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      if (match[1] && match[1].length >= 2 && match[1].length <= 10) {
        entities.push(match[1]);
      }
    }
  });
  
  const locations: string[] = [];
  locationPatterns.forEach(pattern => {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      if (match[1] && match[1].length >= 2 && match[1].length <= 10) {
        locations.push(match[1]);
      }
    }
  });
  
  const actions: string[] = [];
  actionPatterns.forEach(pattern => {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      if (match[1] && match[1].length >= 2) {
        actions.push(match[1]);
      }
    }
  });
  
  return {
    entities: [...new Set(entities)].filter(e => e.length >= 2),
    locations: [...new Set(locations)].filter(l => l.length >= 2),
    actions: [...new Set(actions)].filter(a => a.length >= 2),
  };
}

/**
 * 재미있는 사실을 더 풍부하고 구체적으로 포맷팅
 */
function formatFunFact(item: HistoricalItem, isBirth: boolean): string {
  const year = item.year || '';
  const text = item.text;
  const links = item.links || [];
  
  // 연도 계산 (현재 연도와의 차이)
  let yearInfo = '';
  let centuryInfo = '';
  if (year && !isNaN(Number(year))) {
    const currentYear = new Date().getFullYear();
    const yearDiff = currentYear - Number(year);
    const yearNum = Number(year);
    
    if (yearDiff > 0) {
      if (yearDiff < 100) {
        yearInfo = `정확히 ${yearDiff}년 전인`;
      } else if (yearDiff < 500) {
        yearInfo = `${yearDiff}년 전인`;
      } else {
        yearInfo = `${yearDiff}년 전인`;
      }
    }
    
    // 세기 정보 추가
    const century = Math.floor((yearNum - 1) / 100) + 1;
    if (century <= 20) {
      centuryInfo = `${century}세기`;
    }
  }
  
  // 주요 키워드 추출
  const { entities, locations, actions } = extractKeyEntities(text);
  const mainEntity = entities.length > 0 ? entities[0] : null;
  const location = locations.length > 0 ? locations[0] : null;
  const action = actions.length > 0 ? actions[0] : null;
  
  // 더 구체적인 사실 패턴 생성
  const factPatterns: string[] = [];
  
  // 패턴 1: 연도와 세기 정보 포함
  if (year && centuryInfo) {
    factPatterns.push(
      `알고 계셨나요? ${year}년(${centuryInfo}) 오늘${yearInfo ? `, ${yearInfo}` : ''} ${text}${location ? ` 이 사건은 ${location}에서 일어났습니다.` : ''}`
    );
  }
  
  // 패턴 2: 인물/사건 중심
  if (mainEntity) {
    factPatterns.push(
      `${year}년 오늘, ${mainEntity}${isBirth ? '이 태어났습니다' : '과 관련된 중요한 역사적 사건이 발생했습니다'}. ${text}${location ? ` 이 사건은 ${location}에서 일어났으며` : ''} 역사에 큰 영향을 미쳤습니다.`
    );
  }
  
  // 패턴 3: 동작 중심
  if (action) {
    factPatterns.push(
      `흥미롭게도 ${year}년 오늘${yearInfo ? `, ${yearInfo}` : ''}, ${text}${action ? ` 이는 ${action}의 중요한 사례입니다.` : ''}${location ? ` 이 사건은 ${location}에서 일어났습니다.` : ''}`
    );
  }
  
  // 패턴 4: 장소 중심
  if (location) {
    factPatterns.push(
      `${year}년 오늘, ${location}에서 역사에 기록될 만한 중요한 사건이 있었습니다. ${text}${mainEntity ? ` 이 사건의 중심에는 ${mainEntity}이(가) 있었습니다.` : ''}`
    );
  }
  
  // 패턴 5: 일반적인 패턴
  factPatterns.push(
    `${year}년 오늘, 역사에 기록된 중요한 ${isBirth ? '인물의 탄생' : '사건'}이 있었습니다. ${text}${yearInfo ? ` 이는 ${yearInfo} 일어난 일입니다.` : ''}${location ? ` 이 사건은 ${location}에서 일어났습니다.` : ''}`
  );
  
  factPatterns.push(
    `재미있게도 ${year}년 오늘${yearInfo ? `, ${yearInfo}` : ''} ${text}${mainEntity ? ` 이 사건의 주인공은 ${mainEntity}이(가)었습니다.` : ''}${links.length > 0 ? ' 이에 대해 더 자세히 알아보시면 흥미로운 역사적 맥락을 발견하실 수 있습니다.' : ''}`
  );
  
  // 날짜 기반으로 패턴 선택
  const patternIndex = getDateBasedIndex(new Date(), factPatterns.length);
  let fact = factPatterns[patternIndex];
  
  // 추가 맥락 정보
  if (links.length > 0 && !fact.includes('자세히')) {
    const contextPhrases = [
      ' 이 사건은 오늘날까지도 역사학자들의 연구 주제가 되고 있습니다.',
      ' 이 사건에 대해 더 자세히 알아보시면 흥미로운 역사적 맥락을 발견하실 수 있습니다.',
    ];
    const contextIndex = getDateBasedIndex(new Date(), contextPhrases.length);
    fact += contextPhrases[contextIndex];
  }
  
  return fact;
}

/**
 * 오늘 날짜에 맞는 재미있는 사실 선택
 */
function selectFunFact(events?: HistoricalItem[], births?: HistoricalItem[]): { fact: string; isBirth: boolean } | null {
  const today = new Date();
  const allItems: Array<HistoricalItem & { isBirth: boolean }> = [];
  
  // Events와 Births를 합쳐서 하나의 배열로 만들기 (타입 정보 포함)
  if (events && events.length > 0) {
    allItems.push(...events.map(item => ({ ...item, isBirth: false })));
  }
  if (births && births.length > 0) {
    allItems.push(...births.map(item => ({ ...item, isBirth: true })));
  }
  
  if (allItems.length === 0) {
    return null;
  }
  
  // 날짜 기반으로 항목 선택
  const index = getDateBasedIndex(today, allItems.length);
  const selectedItem = allItems[index];
  
  if (!selectedItem || !selectedItem.text) {
    return null;
  }
  
  // 재미있는 사실 포맷팅
  const fact = formatFunFact(selectedItem, selectedItem.isBirth);
  
  return { fact, isBirth: selectedItem.isBirth };
}

export function FunFactCard({ events, births }: FunFactCardProps) {
  const funFactData = selectFunFact(events, births);
  
  if (!funFactData) {
    return null;
  }
  
  return (
    <div className="bg-amber-50 rounded-xl p-6">
      <div className="text-center">
        <div className="text-4xl mb-3">💡</div>
        <h2 className="mb-4">오늘의 재미있는 사실</h2>
        <p className="text-[20px] text-gray-800 leading-relaxed">
          {funFactData.fact}
        </p>
      </div>
    </div>
  );
}
