import { HistoricalItem } from '../types';
import { PersonCard } from './PersonCard';

interface BirthsSectionProps {
  births: HistoricalItem[];
}

export function BirthsSection({ births }: BirthsSectionProps) {
  // 디버깅: births 상태 확인
  if (!births || !Array.isArray(births)) {
    console.warn('BirthsSection: births가 배열이 아닙니다.', births);
    return (
      <section>
        <h2 className="flex items-center gap-2 mb-4">
          <span className="text-2xl">🎂</span>
          <span>오늘 태어난 인물</span>
        </h2>
        <div className="text-center py-8 text-gray-500">
          <p>데이터를 불러오는 중...</p>
        </div>
      </section>
    );
  }

  const topBirths = births.slice(0, 4);

  if (topBirths.length === 0) {
    return (
      <section>
        <h2 className="flex items-center gap-2 mb-4">
          <span className="text-2xl">🎂</span>
          <span>오늘 태어난 인물</span>
        </h2>
        <div className="text-center py-8 text-gray-500">
          <p>오늘 태어난 인물이 없습니다.</p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <h2 className="flex items-center gap-2 mb-4">
        <span className="text-2xl">🎂</span>
        <span>오늘 태어난 인물</span>
      </h2>
      <div className="grid grid-cols-2 gap-4">
        {topBirths.map((birth, index) => {
          // Extract name from text (usually first part before comma or special chars)
          const nameMatch = birth.text.match(/^([^,，,。]+)/);
          const name = nameMatch ? nameMatch[1].trim() : birth.text.substring(0, 20);
          const description = birth.text.length > name.length 
            ? birth.text.substring(name.length).replace(/^[,，。\s]+/, '').substring(0, 50)
            : '';
          
          return (
            <PersonCard
              key={`${birth.year}-${index}`}
              year={birth.year}
              name={name}
              description={description || '역사적 인물'}
            />
          );
        })}
      </div>
    </section>
  );
}
