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
 * 텍스트에서 주요 키워드 추출 (더 구체적으로)
 */
function extractKeyWords(text: string): { entity: string | null; location: string | null; action: string | null; details: string[] } {
  // 인물명, 사건명 추출
  const entityPatterns = [
    /([가-힣]{2,10})이|가/g,
    /([가-힣]{2,10})의/g,
    /([가-힣]{2,10})은|는/g,
  ];
  
  let entity: string | null = null;
  for (const pattern of entityPatterns) {
    const match = text.match(pattern);
    if (match && match[1] && match[1].length >= 2 && match[1].length <= 10) {
      entity = match[1];
      break;
    }
  }
  
  // 장소 추출
  const locationPatterns = [
    /([가-힣]{2,10})에서/g,
    /([가-힣]{2,10})에/g,
    /([가-힣]{2,10})로|으로/g,
  ];
  
  let location: string | null = null;
  for (const pattern of locationPatterns) {
    const match = text.match(pattern);
    if (match && match[1] && match[1].length >= 2 && match[1].length <= 10) {
      location = match[1];
      break;
    }
  }
  
  // 동작 추출
  const actionPatterns = [
    /([가-힣]{2,8})(했다|하였다|되었다|되었다)/g,
    /([가-힣]{2,8})(했다|하였다|되었다|되었다)/g,
  ];
  
  let action: string | null = null;
  for (const pattern of actionPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      action = match[1];
      break;
    }
  }
  
  // 세부 정보 추출 (중요한 명사들)
  const details: string[] = [];
  const detailPatterns = [
    /([가-힣]{2,8})을|를/g,
    /([가-힣]{2,8})과|와/g,
  ];
  
  for (const pattern of detailPatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      if (match[1] && match[1].length >= 2 && match[1].length <= 8) {
        details.push(match[1]);
      }
    }
  }
  
  return { entity, location, action, details: [...new Set(details)].slice(0, 3) };
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
  const { entity, location, action, details } = extractKeyWords(text);
  
  // 질문 패턴들
  const questionPatterns: Array<{ question: string; answer: string }> = [];
  
  // 패턴 1: 연도 추측 (더 구체적으로)
  if (year && !isNaN(Number(year))) {
    const currentYear = new Date().getFullYear();
    const yearDiff = currentYear - Number(year);
    const century = Math.floor((Number(year) - 1) / 100) + 1;
    
    if (yearDiff > 0 && yearDiff < 2000) {
      questionPatterns.push({
        question: `${text}는 몇 년 전에 일어난 일일까요? (정확한 연도도 맞춰보세요!)`,
        answer: `${yearDiff}년 전인 ${year}년(${century}세기)에 일어났습니다. ${text}${location ? ` 이 사건은 ${location}에서 일어났습니다.` : ''}`
      });
      
      questionPatterns.push({
        question: `${entity || '이 사건'}${location ? `이 ${location}에서` : ''} 일어난 연도는?`,
        answer: `${year}년입니다. ${text}${details.length > 0 ? ` 이 사건과 관련된 주요 요소는 ${details.join(', ')} 등이 있습니다.` : ''}`
      });
    }
  }
  
  // 패턴 2: 연도 숨기기 (더 구체적으로)
  if (year && text.includes(year)) {
    const questionText = text.replace(new RegExp(`${year}년?`, 'g'), '____년').trim();
    questionPatterns.push({
      question: `다음 문장의 빈칸에 들어갈 연도는? "${questionText}"`,
      answer: `정답은 ${year}년입니다. ${text}${location ? ` 이 사건은 ${location}에서 일어났으며` : ''}${entity ? ` ${entity}이(가) 관련되어 있습니다.` : ''}`
    });
  }
  
  // 패턴 3: 인물/사건 기반 질문 (더 구체적으로)
  if (entity) {
    questionPatterns.push({
      question: `${entity}${isBirth ? '이 태어난' : '과 관련된 사건이 일어난'} 연도는? ${location ? `(힌트: ${location}에서 일어났습니다)` : ''}`,
      answer: `${year}년입니다. ${text}${location ? ` 이 사건은 ${location}에서 일어났습니다.` : ''}${action ? ` 주요 행동은 ${action}이었습니다.` : ''}`
    });
    
    questionPatterns.push({
      question: `${year}년 오늘, ${entity}${isBirth ? '이 태어났습니다' : '과 관련된 중요한 사건이 있었습니다'}. 이 사건의 구체적인 내용은 무엇일까요?`,
      answer: `${text}${location ? ` 이 사건은 ${location}에서 일어났습니다.` : ''}${details.length > 0 ? ` 관련된 주요 요소는 ${details.join(', ')} 등이 있습니다.` : ''}`
    });
    
    if (location) {
      questionPatterns.push({
        question: `${entity}${isBirth ? '이 태어난' : '과 관련된 사건이 일어난'} 장소는 어디일까요? (연도도 맞춰보세요!)`,
        answer: `${location}에서 일어났습니다. ${year}년 오늘, ${text}${action ? ` 이 사건의 핵심은 ${action}이었습니다.` : ''}`
      });
    }
  }
  
  // 패턴 4: 장소 기반 질문
  if (location) {
    questionPatterns.push({
      question: `${year}년 오늘, ${location}에서 어떤 중요한 사건이 일어났을까요?`,
      answer: `${text}${entity ? ` 이 사건의 중심에는 ${entity}이(가) 있었습니다.` : ''}${action ? ` 주요 행동은 ${action}이었습니다.` : ''}`
    });
  }
  
  // 패턴 5: 동작 기반 질문
  if (action) {
    questionPatterns.push({
      question: `${year}년 오늘, 누가(또는 무엇이) ${action}했을까요?`,
      answer: `${entity || '이 사건'}이 ${action}했습니다. ${text}${location ? ` 이는 ${location}에서 일어났습니다.` : ''}`
    });
  }
  
  // 패턴 6: 세부 정보 기반 질문
  if (details.length > 0) {
    questionPatterns.push({
      question: `${year}년 오늘 일어난 사건과 관련된 주요 요소는? (${details.slice(0, 2).join(', ')} 등)`,
      answer: `맞습니다! ${details.join(', ')} 등이 관련되어 있습니다. ${text}${entity ? ` 이 사건의 중심에는 ${entity}이(가) 있었습니다.` : ''}`
    });
  }
  
  // 패턴 7: 사건 설명 기반 질문 (더 구체적으로)
  if (text.length > 20) {
    const words = text.split(/\s+/);
    if (words.length > 4) {
      const hiddenPart = words.slice(0, Math.min(4, words.length - 2)).join(' ');
      const visiblePart = words.slice(Math.min(4, words.length - 2)).join(' ');
      
      questionPatterns.push({
        question: `${year}년 오늘, 다음 문장의 빈칸을 채우세요: "____ ${visiblePart}"`,
        answer: `정답은 "${hiddenPart}"입니다. ${text}${location ? ` 이 사건은 ${location}에서 일어났습니다.` : ''}`
      });
    }
  }
  
  // 기본 패턴 (더 구체적으로)
  if (questionPatterns.length === 0) {
    questionPatterns.push({
      question: `${text}가 일어난 연도는? ${location ? `(힌트: ${location}에서 일어났습니다)` : ''}`,
      answer: `${year}년입니다. ${text}${location ? ` 이 사건은 ${location}에서 일어났습니다.` : ''}${entity ? ` ${entity}이(가) 관련되어 있습니다.` : ''}`
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
