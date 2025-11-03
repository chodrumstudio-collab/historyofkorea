import { useState, useEffect, useRef } from 'react';
import { HistoryData } from '../types';
import { fetchHistoryData } from '../utils/api';

/**
 * 오늘 날짜를 YYYY-MM-DD 형식으로 반환
 */
function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const useHistoryData = () => {
  const [data, setData] = useState<HistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const lastDateRef = useRef<string>(getTodayDateString());
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 데이터 로딩 시작...');
      
      // 한국어 위키피디아에서 직접 데이터 로드 (한글 원본)
      const historyData = await fetchHistoryData();
      
      console.log('✅ 데이터 로드 성공:', {
        hasData: !!historyData,
        eventsCount: historyData?.data?.Events?.length || 0,
        birthsCount: historyData?.data?.Births?.length || 0,
      });
      
      setData(historyData);
      lastDateRef.current = getTodayDateString();
    } catch (err) {
      console.error('❌ 데이터 로드 실패:', err);
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
      console.error('에러 상세:', {
        message: errorMessage,
        error: err,
        stack: err instanceof Error ? err.stack : undefined
      });
      setError(err instanceof Error ? err : new Error(errorMessage));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 초기 데이터 로드
    loadData();

    // 매일 자동으로 데이터 업데이트 확인
    // 1분마다 날짜가 변경되었는지 확인
    refreshIntervalRef.current = setInterval(() => {
      const currentDate = getTodayDateString();
      
      // 날짜가 변경되었으면 새 데이터 로드
      if (currentDate !== lastDateRef.current) {
        console.log('📅 날짜가 변경되었습니다. 새 데이터를 로드합니다...');
        loadData();
      }
    }, 60 * 1000); // 1분마다 체크

    // 컴포넌트 언마운트 시 인터벌 정리
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  // 페이지가 포커스를 받을 때도 날짜 확인
  useEffect(() => {
    const handleFocus = () => {
      const currentDate = getTodayDateString();
      if (currentDate !== lastDateRef.current && !loading) {
        console.log('🔄 페이지 포커스: 날짜 확인 후 새 데이터 로드');
        loadData();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [loading]);

  return { data, loading, error };
};
