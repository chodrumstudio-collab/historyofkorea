export function Header() {
  const now = new Date();
  const month = now.getMonth() + 1; // getMonth() returns 0-11
  const day = now.getDate();
  
  const formattedDate = `${month}월 ${day}일`;

  return (
    <header className="bg-gradient-to-b from-white to-gray-50 px-5 py-6">
      <div className="max-w-md mx-auto">
        <h1 className="text-[32px] mb-1">{formattedDate}</h1>
        <p className="text-[18px] text-gray-600">오늘의 역사</p>
      </div>
    </header>
  );
}
