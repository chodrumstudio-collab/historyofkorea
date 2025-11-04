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
 * 텍스트에서 주요 키워드 추출
 */
function extractKeyWords(text: string): { entity: string | null; action: string | null } {
  // 인물명, 사건명 추출
  const entityPatterns = [
    /([가-힣]+)이|가/g,
    /([가-힣]+)의/g,
    /([가-힣]+)에서/g,
  ];
  
  let entity: string | null = null;
  for (const pattern of entityPatterns) {
    const match = text.match(pattern);
    if (match && match[1] && match[1].length >= 2 && match[1].length <= 10) {
      entity = match[1];
      break;
    }
  }
  
  // 동사 추출
  const actionPatterns = [
    /([가-힣]+)했다|했다/g,
    /([가-힣]+)했다|했다/g,
    /([가-힣]+)했다|했다/g,
  ];
  
  let action: string | null = null;
  for (const pattern of actionPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      action = match[1];
      break;
    }
  }
  
  return { entity, action };
}

/**
 * 더 구체적이고 재미있는 퀴즈 질문 생성
 */
function generateTriviaQuestion(item: HistoricalItem, isBirth: boolean): { question: string; answer: string } | null {
  const year = item.year || '';
  const text = item.text;
  
  if (!text || text.length < 5) {
    return null;
  }
  
  // 키워드 추출
  const { entity } = extractKeyWords(text);
  
  // 질문 패턴들
  const questionPatterns: Array<{ question: string; answer: string }> = [];
  
  // 패턴 1: 연도 추측
  if (year && !isNaN(Number(year))) {
    const currentYear = new Date().getFullYear();
    const yearDiff = currentYear - Number(year);
    
    if (yearDiff > 0 && yearDiff < 2000) {
      questionPatterns.push({
        question: `${text}는 몇 년 전에 일어난 일일까요?`,
        answer: `${yearDiff}년 전인 ${year}년에 일어났습니다. ${text}`
      });
      
      questionPatterns.push({
        question: `${entity || '이 사건'}이 일어난 연도는?`,
        answer: `${year}년입니다. ${text}`
      });
    }
  }
  
  // 패턴 2: 연도 숨기기
  if (year && text.includes(year)) {
    const questionText = text.replace(new RegExp(`${year}년?`, 'g'), '____년').trim();
    questionPatterns.push({
      question: `____에 채워넣을 연도는? "${questionText}"`,
      answer: `${year}년입니다. ${text}`
    });
  }
  
  // 패턴 3: 인물/사건 기반 질문
  if (entity) {
    questionPatterns.push({
      question: `${entity}${isBirth ? '이 태어난' : '과 관련된 사건이 일어난'} 연도는?`,
      answer: `${year}년입니다. ${text}`
    });
    
    questionPatterns.push({
      question: `${year}년 오늘, ${entity}${isBirth ? '이 태어났습니다' : '과 관련된 중요한 사건이 있었습니다'}. 이 사건의 상세 내용은?`,
      answer: text
    });
  }
  
  // 패턴 4: 사건 설명 기반 질문
  if (text.length > 20) {
    // 텍스트의 앞부분을 숨기고 질문 만들기
    const words = text.split(/\s+/);
    if (words.length > 3) {
      const hiddenPart = words.slice(0, Math.min(3, words.length - 2)).join(' ');
      const visiblePart = words.slice(Math.min(3, words.length - 2)).join(' ');
      
      questionPatterns.push({
        question: `${year}년 오늘, ____ ${visiblePart}?`,
        answer: `${hiddenPart} ${visiblePart}. ${text}`
      });
    }
  }
  
  // 기본 패턴
  if (questionPatterns.length === 0) {
    questionPatterns.push({
      question: `${text}가 일어난 연도는?`,
      answer: `${year}년입니다. ${text}`
    });
  }
  
  // 날짜 기반으로 질문 선택
  const today = new Date();
  const selectedIndex = getDateBasedIndex(today, questionPatterns.length);
  return questionPatterns[selectedIndex];
}

/**
 * 오늘 날짜에 맞는 퀴즈 생성
 */
function generateTrivia(events?: HistoricalItem[], births?: HistoricalItem[]): { question: string; answer: string } | null {
  const today = new Date();
  const allItems: Array<HistoricalItem & { isBirth: boolean }> = [];
  
  // Events와 Births를 합쳐서 하나의 배열로 만들기
  if (events && events.length > 0) {
    allItems.push(...events.map(item => ({ ...item, isBirth: false })));
  }
  if (births && births.length > 0) {
    allItems.push(...births.map(item => ({ ...item, isBirth: true })));
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
  
  // 구체적인 퀴즈 질문 생성
  return generateTriviaQuestion(selectedItem, selectedItem.isBirth);
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
