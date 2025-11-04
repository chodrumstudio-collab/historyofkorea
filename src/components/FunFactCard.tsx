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
 * 오늘 날짜에 맞는 재미있는 사실 선택
 */
function selectFunFact(events?: HistoricalItem[], births?: HistoricalItem[]): string | null {
  const today = new Date();
  const allItems: HistoricalItem[] = [];
  
  // Events와 Births를 합쳐서 하나의 배열로 만들기
  if (events && events.length > 0) {
    allItems.push(...events);
  }
  if (births && births.length > 0) {
    allItems.push(...births);
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
  
  // 연도와 함께 포맷팅
  const year = selectedItem.year || '';
  const text = selectedItem.text;
  
  return `${year}${year ? '년, ' : ''}${text}`;
}

export function FunFactCard({ events, births }: FunFactCardProps) {
  const funFact = selectFunFact(events, births);
  
  if (!funFact) {
    return null;
  }
  
  return (
    <div className="bg-amber-50 rounded-xl p-6">
      <div className="text-center">
        <div className="text-4xl mb-3">💡</div>
        <h2 className="mb-4">오늘의 재미있는 사실</h2>
        <p className="text-[20px] text-gray-800 leading-relaxed">
          {funFact}
        </p>
      </div>
    </div>
  );
}
