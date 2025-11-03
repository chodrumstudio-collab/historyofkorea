import { useState } from 'react';
import { Button } from './ui/button';

export function TriviaCard() {
  const [showAnswer, setShowAnswer] = useState(false);

  return (
    <div className="bg-blue-50 rounded-xl p-6">
      <div className="text-center">
        <div className="text-4xl mb-3">🎯</div>
        <h2 className="mb-4">오늘의 퀴즈</h2>
        <p className="text-[18px] text-gray-800 mb-4">
          1620년 11월 3일, 메이플라워호가 도착한 곳은?
        </p>
        <Button 
          onClick={() => setShowAnswer(!showAnswer)}
          className="bg-[#1E40AF] hover:bg-[#1E3A8A] rounded-full min-h-[44px] px-6"
        >
          {showAnswer ? '답 숨기기' : '정답 보기'}
        </Button>
        {showAnswer && (
          <p className="text-[16px] text-gray-600 mt-4">
            매사추세츠 해안 (플리머스)
          </p>
        )}
      </div>
    </div>
  );
}
