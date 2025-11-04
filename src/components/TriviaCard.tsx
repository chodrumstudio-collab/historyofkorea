import { useState } from 'react';
import { Button } from './ui/button';
import { HistoricalItem } from '../types';

interface TriviaCardProps {
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
 * 오늘 날짜에 맞는 퀴즈 생성
 */
function generateTrivia(events?: HistoricalItem[], births?: HistoricalItem[]): { question: string; answer: string } | null {
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
  
  // 날짜 기반으로 항목 선택 (FunFact와 다른 인덱스를 사용하기 위해 오프셋 추가)
  const baseIndex = getDateBasedIndex(today, allItems.length);
  const triviaIndex = (baseIndex + 1) % allItems.length; // FunFact와 다른 항목 선택
  const selectedItem = allItems[triviaIndex];
  
  if (!selectedItem || !selectedItem.text) {
    return null;
  }
  
  const year = selectedItem.year || '';
  const text = selectedItem.text;
  
  // 퀴즈 질문 생성: 연도를 숨기고 질문으로 만들기
  let question = text;
  let answer = year ? `${year}년` : '';
  
  // 연도가 포함된 텍스트인 경우, 연도를 제거하고 질문으로 만들기
  if (year && text.includes(year)) {
    question = text.replace(new RegExp(`${year}년?`, 'g'), '____').trim();
    question = question.replace(/^[,\s\-]+|[,\s\-]+$/g, '').trim(); // 앞뒤 쉼표/하이픈 제거
    if (!question.endsWith('?')) {
      question += '?';
    }
    answer = `${year}년, ${text}`;
  } else {
    // 연도가 없는 경우, 질문을 다르게 생성
    question = `${text}가 일어난(인물인) 연도는?`;
    answer = year ? `${year}년` : '알 수 없음';
  }
  
  return { question, answer };
}

export function TriviaCard({ events, births }: TriviaCardProps) {
  const [showAnswer, setShowAnswer] = useState(false);
  const trivia = generateTrivia(events, births);
  
  if (!trivia) {
    return null;
  }
  
  return (
    <div className="bg-blue-50 rounded-xl p-6">
      <div className="text-center">
        <div className="text-4xl mb-3">🎯</div>
        <h2 className="mb-4">오늘의 퀴즈</h2>
        <p className="text-[18px] text-gray-800 mb-4">
          {trivia.question}
        </p>
        <Button 
          onClick={() => setShowAnswer(!showAnswer)}
          className="bg-[#1E40AF] hover:bg-[#1E3A8A] rounded-full min-h-[44px] px-6"
        >
          {showAnswer ? '답 숨기기' : '정답 보기'}
        </Button>
        {showAnswer && (
          <p className="text-[16px] text-gray-600 mt-4">
            {trivia.answer}
          </p>
        )}
      </div>
    </div>
  );
}
