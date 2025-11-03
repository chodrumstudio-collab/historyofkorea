import { HistoricalItem } from '../types';
import { EventCard } from './EventCard';

interface EventsSectionProps {
  events: HistoricalItem[];
}

export function EventsSection({ events }: EventsSectionProps) {
  // 디버깅: events 상태 확인
  if (!events || !Array.isArray(events)) {
    console.warn('EventsSection: events가 배열이 아닙니다.', events);
    return (
      <section>
        <h2 className="flex items-center gap-2 mb-4">
          <span className="text-2xl">📜</span>
          <span>역사적 사건</span>
        </h2>
        <div className="text-center py-8 text-gray-500">
          <p>데이터를 불러오는 중...</p>
        </div>
      </section>
    );
  }

  const topEvents = events.slice(0, 5);

  if (topEvents.length === 0) {
    return (
      <section>
        <h2 className="flex items-center gap-2 mb-4">
          <span className="text-2xl">📜</span>
          <span>역사적 사건</span>
        </h2>
        <div className="text-center py-8 text-gray-500">
          <p>오늘의 역사적 사건이 없습니다.</p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <h2 className="flex items-center gap-2 mb-4">
        <span className="text-2xl">📜</span>
        <span>역사적 사건</span>
      </h2>
      <div className="space-y-4">
        {topEvents.map((event, index) => {
          // Extract link from event.links array (first link if available)
          const link = event.links && event.links.length > 0 
            ? event.links[0].link 
            : `https://wikipedia.org/wiki/${encodeURIComponent(event.text.substring(0, 50))}`;
          
          return (
            <EventCard
              key={`${event.year}-${index}`}
              year={event.year}
              text={event.text}
              link={link}
            />
          );
        })}
      </div>
    </section>
  );
}
