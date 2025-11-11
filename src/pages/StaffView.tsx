import { useState } from 'react';
import { UserCog, Bell, Users } from 'lucide-react';
import { useQueue } from '../hooks/useQueue';
import { callNext } from '../services/queueService';

export default function StaffView() {
  const { status, loading } = useQueue();
  const [calling, setCalling] = useState(false);

  const handleCallNext = async () => {
    if (status.waiting.length === 0) return;

    setCalling(true);
    try {
      await callNext();
    } catch (error) {
      console.error('Error calling next:', error);
    } finally {
      setCalling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <div className="text-blue-400 text-xl">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-8 py-6">
            <div className="flex items-center justify-center gap-3">
              <UserCog className="w-8 h-8" />
              <h1 className="text-3xl font-bold">STAFF DASHBOARD</h1>
            </div>
          </div>

          <div className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-blue-900/50 to-cyan-900/50 rounded-xl p-6 border-2 border-blue-500">
                <p className="text-blue-300 text-sm mb-2 flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  Đang phục vụ
                </p>
                <div className="text-6xl font-bold text-blue-400">
                  #{status.currentNumber || '-'}
                </div>
              </div>

              <div className="bg-gray-900 rounded-xl p-6 border border-gray-700">
                <p className="text-gray-400 text-sm mb-2">Tiếp theo</p>
                <div className="text-6xl font-bold text-cyan-400">
                  #{status.waiting[0] || '-'}
                </div>
              </div>
            </div>

            <div className="bg-gray-900 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-gray-400" />
                <h2 className="text-xl font-semibold">Hàng chờ ({status.totalQueue})</h2>
              </div>

              {status.waiting.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {status.waiting.map((num, idx) => (
                    <div
                      key={num}
                      className={`px-5 py-3 rounded-lg font-semibold text-lg ${
                        idx === 0
                          ? 'bg-cyan-600 text-white ring-2 ring-cyan-400'
                          : 'bg-gray-800 text-gray-300 border border-gray-700'
                      }`}
                    >
                      #{num}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  Không có khách hàng đang chờ
                </div>
              )}
            </div>

            <button
              onClick={handleCallNext}
              disabled={calling || status.waiting.length === 0}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:from-gray-600 disabled:to-gray-600 text-white font-bold py-6 px-8 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed shadow-lg text-xl flex items-center justify-center gap-3"
            >
              <Bell className="w-6 h-6" />
              {calling ? 'Đang gọi...' : status.waiting.length === 0 ? 'Không có khách hàng' : 'GỌI TIẾP THEO'}
            </button>

            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-700">
              <div className="text-center">
                <div className="text-gray-400 text-sm mb-1">Đang phục vụ</div>
                <div className="text-2xl font-bold text-blue-400">{status.currentNumber}</div>
              </div>
              <div className="text-center">
                <div className="text-gray-400 text-sm mb-1">Số tiếp theo</div>
                <div className="text-2xl font-bold text-cyan-400">{status.nextNumber}</div>
              </div>
              <div className="text-center">
                <div className="text-gray-400 text-sm mb-1">Đang chờ</div>
                <div className="text-2xl font-bold text-white">{status.totalQueue}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
