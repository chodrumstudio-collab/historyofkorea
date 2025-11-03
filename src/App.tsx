import { useEffect } from 'react';
import { Header } from './components/Header';
import { EventsSection } from './components/EventsSection';
import { BirthsSection } from './components/BirthsSection';
import { FunFactCard } from './components/FunFactCard';
import { TriviaCard } from './components/TriviaCard';
import { Footer } from './components/Footer';
import { useHistoryData } from './hooks/useHistoryData';

function App() {
  const { data, loading, error } = useHistoryData();

  // 디버깅: 데이터 상태 로그
  useEffect(() => {
    console.log('📊 App 상태:', { 
      loading, 
      hasError: !!error, 
      hasData: !!data,
      eventsCount: data?.data?.Events?.length || 0,
      birthsCount: data?.data?.Births?.length || 0,
      data: data
    });
  }, [data, loading, error]);

  // Loading 상태 처리
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
        <div className="max-w-[375px] mx-auto bg-white shadow-xl min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-4">📚</div>
            <p className="text-gray-600">로딩 중...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error 상태 처리
  if (error) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
        <div className="max-w-[375px] mx-auto bg-white shadow-xl min-h-screen flex items-center justify-center">
          <div className="text-center px-5">
            <div className="text-4xl mb-4">⚠️</div>
            <p className="text-gray-800 mb-2 font-medium">데이터를 불러오는데 실패했습니다.</p>
            <p className="text-sm text-gray-600 mb-4">{error.message}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-[#1E40AF] text-white rounded-lg hover:bg-[#1E3A8A] transition-colors"
            >
              다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 데이터가 없는 경우 처리
  if (!data || !data.data) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
        <div className="max-w-[375px] mx-auto bg-white shadow-xl min-h-screen flex items-center justify-center">
          <div className="text-center px-5">
            <div className="text-4xl mb-4">📭</div>
            <p className="text-gray-800 mb-2">데이터를 불러올 수 없습니다.</p>
            <p className="text-sm text-gray-600 mb-4">페이지를 새로고침하거나 잠시 후 다시 시도해주세요.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-[#1E40AF] text-white rounded-lg hover:bg-[#1E3A8A] transition-colors"
            >
              새로고침
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 데이터 렌더링
  console.log('🎨 렌더링 시작:', {
    eventsLength: data.data.Events?.length,
    birthsLength: data.data.Births?.length,
    events: data.data.Events?.slice(0, 2),
    births: data.data.Births?.slice(0, 2)
  });

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className="max-w-[375px] mx-auto bg-white shadow-xl min-h-screen">
        <Header />
        
        <main className="px-5 py-10 space-y-10">
          {data.data.Events && data.data.Events.length > 0 ? (
            <EventsSection events={data.data.Events} />
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>역사적 사건 데이터가 없습니다.</p>
              <p className="text-xs mt-2">콘솔을 확인하세요.</p>
            </div>
          )}
          
          {data.data.Births && data.data.Births.length > 0 ? (
            <BirthsSection births={data.data.Births} />
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>출생 인물 데이터가 없습니다.</p>
              <p className="text-xs mt-2">콘솔을 확인하세요.</p>
            </div>
          )}
          
          <FunFactCard />
          <TriviaCard />
        </main>

        <Footer />
      </div>
    </div>
  );
}

export default App;
