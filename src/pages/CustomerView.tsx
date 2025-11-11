import { useState } from 'react';
import { User, Ticket } from 'lucide-react';
import { useQueue } from '../hooks/useQueue';
import { takeNumber } from '../services/queueService';

export default function CustomerView() {
  const { status, loading } = useQueue();
  const [myNumber, setMyNumber] = useState<number | null>(null);
  const [taking, setTaking] = useState(false);

  const handleTakeNumber = async () => {
    setTaking(true);
    try {
      const number = await takeNumber();
      setMyNumber(number);
    } catch (error) {
      console.error('Error taking number:', error);
    } finally {
      setTaking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-emerald-400 text-xl">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-6">
            <div className="flex items-center justify-center gap-3">
              <User className="w-8 h-8" />
              <h1 className="text-3xl font-bold">SMARTQUEUE</h1>
            </div>
          </div>

          <div className="p-8 space-y-6">
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-700">
              <div className="text-center space-y-4">
                <div>
                  <p className="text-gray-400 text-sm mb-2">Số hiện tại đang phục vụ</p>
                  <div className="text-6xl font-bold text-emerald-400">
                    {status.currentNumber}
                  </div>
                </div>

                <div className="border-t border-gray-700 pt-4">
                  <p className="text-gray-400 text-sm mb-2">Số tiếp theo</p>
                  <div className="text-3xl font-semibold text-teal-400">
                    {status.waiting[0] || '-'}
                  </div>
                </div>
              </div>
            </div>

            {myNumber && (
              <div className="bg-gradient-to-br from-emerald-900/50 to-teal-900/50 rounded-xl p-6 border-2 border-emerald-500 animate-pulse-slow">
                <div className="flex items-center justify-center gap-3 mb-3">
                  <Ticket className="w-6 h-6 text-emerald-400" />
                  <p className="text-emerald-300 font-medium">Số của bạn</p>
                </div>
                <div className="text-5xl font-bold text-center text-emerald-400">
                  #{myNumber}
                </div>
                <div className="text-center mt-3 text-gray-300">
                  {myNumber === status.waiting[0] ? (
                    <span className="text-emerald-400 font-semibold">Bạn sắp được phục vụ!</span>
                  ) : (
                    <span>Còn {status.waiting.indexOf(myNumber) + 1} người trước bạn</span>
                  )}
                </div>
              </div>
            )}

            <div className="bg-gray-900 rounded-xl p-4 border border-gray-700">
              <div className="text-center text-gray-300">
                <span className="text-2xl font-bold text-white">{status.totalQueue}</span>
                <span className="text-sm ml-2">người đang chờ</span>
              </div>
            </div>

            <button
              onClick={handleTakeNumber}
              disabled={taking}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:from-gray-600 disabled:to-gray-600 text-white font-bold py-4 px-8 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed shadow-lg"
            >
              {taking ? 'Đang xử lý...' : 'LẤY SỐ THỨ TỰ'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
