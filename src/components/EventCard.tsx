import { useState } from 'react';
import { ArrowRight, Languages, Loader2 } from 'lucide-react';
import { isKoreanRelated } from '../utils/api';
import { translateToKorean } from '../utils/translate';

interface EventCardProps {
  year: string;
  text: string;
  link: string;
}

export function EventCard({ year, text, link }: EventCardProps) {
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);

  const handleClick = () => {
    if (link) {
      window.open(link, '_blank', 'noopener,noreferrer');
    }
  };

  const handleTranslate = async (e: React.MouseEvent) => {
    e.stopPropagation(); // 카드 클릭 이벤트 방지
    
    // 이미 번역되어 있으면 다시 원본으로
    if (translatedText) {
      setTranslatedText(null);
      return;
    }

    setIsTranslating(true);
    try {
      const translated = await translateToKorean(text);
      setTranslatedText(translated);
    } catch (error) {
      console.error('번역 실패:', error);
    } finally {
      setIsTranslating(false);
    }
  };

  const isKorean = isKoreanRelated(text);
  const needsTranslation = !isKorean && /[a-zA-Z]/.test(text);
  const displayText = translatedText || text;
  
  // 연도가 없거나 빈 문자열인 경우 처리
  const displayYear = year && year.trim() !== '' ? year : '?';

  return (
    <div 
      className={`rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow ${
        isKorean 
          ? 'bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200' 
          : 'bg-white'
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-sm border-2 ${
            isKorean 
              ? 'bg-gradient-to-br from-red-100 to-orange-100 border-red-300' 
              : 'bg-gray-100 border-gray-300'
          }`}>
            <span className="text-black text-sm font-bold">{displayYear}</span>
          </div>
        </div>
        <div className="flex-1 pt-1">
          <div className="flex items-start justify-between gap-2 mb-2">
            {needsTranslation && (
              <button
                onClick={handleTranslate}
                disabled={isTranslating}
                className={`ml-auto flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  translatedText
                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                } ${isTranslating ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={translatedText ? '원본 보기' : '한글로 번역'}
              >
                {isTranslating ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    번역 중...
                  </>
                ) : (
                  <>
                    <Languages className="w-3 h-3" />
                    {translatedText ? '원본' : '번역'}
                  </>
                )}
              </button>
            )}
          </div>
          <p 
            className={`text-[16px] leading-relaxed ${
              isKorean ? 'text-gray-800 font-medium' : 'text-gray-700'
            } ${link ? 'cursor-pointer' : ''}`}
            onClick={handleClick}
          >
            {displayText}
          </p>
        </div>
        {link && (
          <ArrowRight className={`flex-shrink-0 w-5 h-5 mt-2 cursor-pointer ${
            isKorean ? 'text-red-400' : 'text-gray-400'
          }`} 
          onClick={handleClick}
          />
        )}
      </div>
    </div>
  );
}
