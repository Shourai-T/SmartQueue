import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { io, Socket } from "socket.io-client";
import axios from 'axios';


export default function PublicDisplay() {
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [status, setStatus] = useState({
    currentNumber: 0,
    nextNumbers: [],
    waitingCount: 0
  });

  
  // Fetch dữ liệu hiện tại khi load trang
  useEffect(() => {
    const fetchCurrent = async () => {
      try {
        const res = await axios.get("http://localhost:8000/queue/current");
        setStatus({
          currentNumber: res.data.currentNumber,
          nextNumbers: res.data.nextNumbers,
          waitingCount: res.data.waitingCount
        });
      } catch (error) {
        console.error("Error fetching current queue:", error);
      }
    };
    fetchCurrent();
  }, []);

  // Lắng nghe WebSocket
  useEffect(() => {
    const socket: Socket = io("http://localhost:8000");
    socket.on("queue_update", (data) => {

      setStatus(prev => ({
        ...prev,
        currentNumber: data.currentNumber ?? prev.currentNumber,
        nextNumbers: data.nextNumbers || prev.nextNumbers,
        waitingCount: data.waitingCount ?? prev.waitingCount
      }));
      // Hiệu ứng khi số thay đổi
      setShouldAnimate(true);
      setTimeout(() => setShouldAnimate(false), 1000);
    });

     return () => {
      socket.off("queue_update"); // hủy listener
      socket.disconnect(); // ngắt kết nối
    };
  }, []);
  console.log("Rendering PublicDisplay with status:", status);

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
                  #{status.currentNumber}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="bg-gray-900/80 rounded-2xl p-8 border border-gray-700 text-center">
                <div className="text-gray-400 text-2xl mb-4">Số tiếp theo</div>
                <div className="flex justify-center gap-4 flex-wrap">
                  {status.nextNumbers.slice(0, 5).map((num, idx) => (
                    <div
                      key={idx}
                      className="text-4xl font-bold text-teal-400 px-4 py-2 bg-gray-800 rounded-xl border border-gray-700"
                    >
                      #{num}
                    </div>
                  ))}
                  {status.nextNumbers.length === 0 && <div className="text-4xl text-teal-400">-</div>}
                </div>
              </div>

              <div className="bg-gray-900/80 rounded-2xl p-8 border border-gray-700 text-center">
                <div className="text-gray-400 text-2xl mb-4">Đang chờ</div>
                <div className="text-6xl font-bold text-white">
                  {status.waitingCount} <span className="text-2xl ml-3 text-gray-400">người</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}