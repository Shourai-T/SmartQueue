import { useState, useEffect } from 'react';
import { UserCog, Bell, Users } from 'lucide-react';
import axios from 'axios';
import { io, Socket } from "socket.io-client";
export default function StaffView() {
  const [calling, setCalling] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [data, setData] = useState({
     currentNumber: 0,
    nextNumbers: [] as number[],
    waitingCount: 0,
    waiting: [] as number[]
  });

  const handleCallNext = async () => {
    if (data.waiting.length === 0) return;

    setCalling(true); 
    try {
      const res =  await axios.post("http://localhost:8000/queue/next");
      setData(
        {
          currentNumber: res.data.currentNumber,
          nextNumbers: res.data.nextNumbers,
          waitingCount: res.data.waitingCount,
          waiting: res.data.waiting

        }
      )
    } catch (error) {
      console.error('Error calling next:', error);
    } finally {
      setCalling(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Bạn có chắc muốn reset toàn bộ hàng đợi?')) return;

    setResetting(true);
    try {
       await axios.delete("http://localhost:8000/queue/clear");
      setData({
          currentNumber: 0,
    nextNumbers: [] as number[],
    waitingCount: 0,
    waiting: [] as number[]
      });
      console.log('✅ Đã reset hàng đợi');

      setTimeout(async () => {
        console.log('🔄 Force refreshing after reset...');
        // await refresh();
      }, 500);
    } catch (error) {
      console.error('❌ Lỗi reset:', error);
    } finally {
      setResetting(false);
    }
  };
   useEffect(() => {
    const fetchCurrent = async () => {
      try {
        const res = await axios.get("http://localhost:8000/queue/current");
        setData({
          currentNumber: res.data.currentNumber,
          nextNumbers: res.data.nextNumbers,
          waitingCount: res.data.waitingCount,
          waiting: res.data.waiting
        });
      } catch (error) {
        console.error("Error fetching current queue:", error);
      }
    };
    fetchCurrent();
  }, []);

  useEffect(() => {
  const socket: Socket = io("http://localhost:8000");
  socket.on("queue_update", (update) => {
    setData({
      currentNumber: update.currentNumber,
      nextNumbers: Array.isArray(update.nextNumbers) ? update.nextNumbers : [],
      waiting: Array.isArray(update.waiting) ? update.waiting : [],
      waitingCount: update.waitingCount ?? 0
    });
  });
  return () => {
    socket.disconnect();
  };
}, []);
console.log( "and data:", data);

  if (data === null) {
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
                  #{data.currentNumber || '-'}
                </div>
              </div>

              <div className="bg-gray-900 rounded-xl p-6 border border-gray-700">
                <p className="text-gray-400 text-sm mb-2">Tiếp theo</p>
                <div className="text-6xl font-bold text-cyan-400">
                  #{data.nextNumbers?.[0] ?? '-'}
                </div>
              </div>
            </div>

            <div className="bg-gray-900 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-gray-400" />
                <h2 className="text-xl font-semibold">Hàng chờ ({data.waitingCount})</h2>
              </div>

              {data.waiting.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {data.waiting.map((num, idx) => (
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
              disabled={calling || data.waiting.length === 0}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:from-gray-600 disabled:to-gray-600 text-white font-bold py-6 px-8 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed shadow-lg text-xl flex items-center justify-center gap-3"
            >
              <Bell className="w-6 h-6" />
              {calling ? 'Đang gọi...' : data.waiting.length === 0 ? 'Không có khách hàng' : 'GỌI TIẾP THEO'}
            </button>
            <button
                onClick={handleReset}
                disabled={resetting}
                className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-4 px-6 rounded-xl transition-all disabled:cursor-not-allowed"
              >
                {resetting ? 'Đang reset...' : 'RESET'}
              </button>

            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-700">
              <div className="text-center">
                <div className="text-gray-400 text-sm mb-1">Đang phục vụ</div>
                <div className="text-2xl font-bold text-blue-400">{data.currentNumber}</div>
              </div>
              <div className="text-center">
                <div className="text-gray-400 text-sm mb-1">Số tiếp theo</div>
                <div className="text-2xl font-bold text-cyan-400">{data.nextNumbers[0]}</div>
              </div>
              <div className="text-center">
                <div className="text-gray-400 text-sm mb-1">Đang chờ</div>
                  <div className="flex justify-center gap-4 flex-wrap">
                  {data.nextNumbers.slice(0, 5).map((num, idx) => (
                    <div
                      key={idx}
                      className="text-4xl font-bold text-teal-400 px-4 py-2 bg-gray-800 rounded-xl border border-gray-700"
                    >
                      {num}
                    </div>
                  ))}
                  {data.nextNumbers.length === 0 && <div className="text-4xl text-teal-400">-</div>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}