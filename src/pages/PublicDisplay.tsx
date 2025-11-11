import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { useQueue } from '../hooks/useQueue';

export default function PublicDisplay() {
  const { status, loading } = useQueue();
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [prevNumber, setPrevNumber] = useState(0);

  useEffect(() => {
    if (status.currentNumber !== prevNumber && prevNumber !== 0) {
      setShouldAnimate(true);
      const timer = setTimeout(() => setShouldAnimate(false), 1000);
      return () => clearTimeout(timer);
    }
    setPrevNumber(status.currentNumber);
  }, [status.currentNumber, prevNumber]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-emerald-900 to-gray-900 flex items-center justify-center">
        <div className="text-emerald-400 text-3xl">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-emerald-900 to-gray-900 text-white flex items-center justify-center p-8">
      <div className="max-w-6xl w-full">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-3xl shadow-2xl border-2 border-emerald-500/30 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-12 py-8">
            <div className="flex items-center justify-center gap-4">
              <div className="text-5xl">🍀</div>
              <h1 className="text-5xl font-bold tracking-wider">SMARTQUEUE DISPLAY</h1>
              <div className="text-5xl">🍀</div>
            </div>
          </div>

          <div className="p-16 space-y-12">
            <div className="text-center">
              <div className="flex items-center justify-center gap-4 mb-6">
                <Bell className={`w-12 h-12 text-emerald-400 ${shouldAnimate ? 'animate-bounce' : ''}`} />
                <h2 className="text-4xl font-semibold text-emerald-300 uppercase tracking-wide">
                  Đang phục vụ số
                </h2>
                <Bell className={`w-12 h-12 text-emerald-400 ${shouldAnimate ? 'animate-bounce' : ''}`} />
              </div>

              <div
                className={`bg-gradient-to-br from-emerald-900 to-teal-900 rounded-3xl py-20 border-4 border-emerald-500 shadow-2xl transition-all duration-500 ${
                  shouldAnimate ? 'scale-110 ring-8 ring-emerald-400/50' : 'scale-100'
                }`}
              >
                <div className="text-9xl font-bold text-emerald-400 drop-shadow-2xl">
                  #{status.currentNumber || '0'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="bg-gray-900/80 rounded-2xl p-8 border border-gray-700">
                <div className="text-gray-400 text-2xl mb-4 text-center">Số tiếp theo</div>
                <div className="text-6xl font-bold text-center text-teal-400">
                  #{status.waiting[0] || '-'}
                </div>
              </div>

              <div className="bg-gray-900/80 rounded-2xl p-8 border border-gray-700">
                <div className="text-gray-400 text-2xl mb-4 text-center">Đang chờ</div>
                <div className="text-6xl font-bold text-center text-white">
                  {status.totalQueue}
                  <span className="text-2xl ml-3 text-gray-400">người</span>
                </div>
              </div>
            </div>

            {status.waiting.length > 1 && (
              <div className="bg-gray-900/50 rounded-2xl p-8 border border-gray-700">
                <div className="text-gray-400 text-xl mb-6 text-center">Hàng chờ</div>
                <div className="flex flex-wrap justify-center gap-4">
                  {status.waiting.slice(1, 11).map((num) => (
                    <div
                      key={num}
                      className="px-6 py-4 bg-gray-800 text-gray-300 rounded-xl font-semibold text-2xl border border-gray-600"
                    >
                      #{num}
                    </div>
                  ))}
                  {status.waiting.length > 11 && (
                    <div className="px-6 py-4 bg-gray-800 text-gray-400 rounded-xl font-semibold text-2xl border border-gray-600">
                      +{status.waiting.length - 11}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
