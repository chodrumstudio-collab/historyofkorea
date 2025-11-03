import { useState } from 'react';
import { Languages, Loader2 } from 'lucide-react';
import { isKoreanRelated } from '../utils/api';
import { translateToKorean } from '../utils/translate';

interface PersonCardProps {
  year: string;
  name: string;
  description: string;
}

export function PersonCard({ year, name, description }: PersonCardProps) {
  const [translatedDescription, setTranslatedDescription] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);

  const fullText = `${name} ${description}`;
  const isKorean = isKoreanRelated(fullText);
  const needsTranslation = !isKorean && /[a-zA-Z]/.test(description);
  const displayDescription = translatedDescription || description;
  
  // 연도가 없거나 빈 문자열인 경우 처리
  const displayYear = year && year.trim() !== '' ? year : '?';

  const handleTranslate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // 이미 번역되어 있으면 다시 원본으로
    if (translatedDescription) {
      setTranslatedDescription(null);
      return;
    }

    setIsTranslating(true);
    try {
      const translated = await translateToKorean(description);
      setTranslatedDescription(translated);
    } catch (error) {
      console.error('번역 실패:', error);
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div className={`rounded-lg p-4 ${
      isKorean 
        ? 'bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200' 
        : 'bg-gray-50'
    }`}>
      <div className="flex items-center justify-between mb-1">
        <p className="text-[14px] font-semibold text-black">
          {displayYear}
        </p>
        <div className="flex items-center gap-2">
          {needsTranslation && (
            <button
              onClick={handleTranslate}
              disabled={isTranslating}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                translatedDescription
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              } ${isTranslating ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={translatedDescription ? '원본 보기' : '한글로 번역'}
            >
              {isTranslating ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <>
                  <Languages className="w-3 h-3" />
                  {translatedDescription ? '원본' : '번역'}
                </>
              )}
            </button>
          )}
        </div>
      </div>
      <h3 className={`mb-1 ${isKorean ? 'text-gray-900 font-semibold' : ''}`}>
        {name}
      </h3>
      <p className={`text-[14px] leading-snug ${
        isKorean ? 'text-gray-700' : 'text-gray-600'
      }`}>
        {displayDescription}
      </p>
    </div>
  );
}
