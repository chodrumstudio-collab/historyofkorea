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
function extractKeyEntities(text: string): string[] {
  // 한국어 패턴: "○○의", "○○이/가", "○○에서", "○○를/을" 등에서 키워드 추출
  const patterns = [
    /([가-힣]+)의/g,
    /([가-힣]+)이|가/g,
    /([가-힣]+)에서/g,
    /([가-힣]+)를|을/g,
    /([가-힣]+)은|는/g,
  ];
  
  const entities: string[] = [];
  patterns.forEach(pattern => {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      if (match[1] && match[1].length >= 2 && match[1].length <= 10) {
        entities.push(match[1]);
      }
    }
  });
  
  // 중복 제거 및 길이 필터링
  return [...new Set(entities)].filter(e => e.length >= 2);
}

/**
 * 재미있는 사실을 더 풍부하게 포맷팅
 */
function formatFunFact(item: HistoricalItem, isBirth: boolean): string {
  const year = item.year || '';
  const text = item.text;
  const links = item.links || [];
  
  // 연도 계산 (현재 연도와의 차이)
  let yearInfo = '';
  if (year && !isNaN(Number(year))) {
    const currentYear = new Date().getFullYear();
    const yearDiff = currentYear - Number(year);
    if (yearDiff > 0) {
      if (yearDiff < 100) {
        yearInfo = `정확히 ${yearDiff}년 전인`;
      } else if (yearDiff < 500) {
        yearInfo = `${yearDiff}년 전인`;
      } else {
        yearInfo = `${yearDiff}년 전인`;
      }
    }
  }
  
  // 주요 키워드 추출
  const keyEntities = extractKeyEntities(text);
  const mainEntity = keyEntities.length > 0 ? keyEntities[0] : null;
  
  // 재미있는 사실 패턴 생성
  const factPatterns = [
    `알고 계셨나요? ${year}년 오늘${yearInfo ? `, ${yearInfo}` : ''} ${text}`,
    `흥미롭게도 ${year}년 오늘, ${text}`,
    `${year}년 오늘, 역사에 기록된 중요한 사건이 있었습니다. ${text}`,
    `재미있게도 ${year}년 오늘, ${text}`,
  ];
  
  // 날짜 기반으로 패턴 선택
  const patternIndex = getDateBasedIndex(new Date(), factPatterns.length);
  let fact = factPatterns[patternIndex];
  
  // 추가 정보가 있으면 맥락 추가
  if (mainEntity && links.length > 0) {
    const contextPhrases = [
      `이 ${isBirth ? '인물' : '사건'}은 역사에 큰 영향을 미쳤습니다.`,
      `이 ${isBirth ? '인물' : '사건'}에 대해 더 자세히 알아보세요.`,
    ];
    const contextIndex = getDateBasedIndex(new Date(), contextPhrases.length);
    fact += ` ${contextPhrases[contextIndex]}`;
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
