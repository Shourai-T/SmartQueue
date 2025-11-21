import { User, UserCog, Monitor, Shield } from "lucide-react";

interface HomePageProps {
  onNavigate: (
    view: "customer" | "staff" | "display" | "staff-login" | "admin-login"
  ) => void;
}

export default function HomePage({ onNavigate }: HomePageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white flex items-center justify-center p-6">
      <div className="max-w-5xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
            SMARTQUEUE
          </h1>
          <p className="text-xl text-gray-300">Hệ thống xếp hàng thông minh</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <button
            onClick={() => onNavigate("customer")}
            className="bg-gray-800 hover:bg-gray-700 rounded-2xl p-8 border-2 border-emerald-500 hover:border-emerald-400 transition-all duration-300 transform hover:scale-105 shadow-xl group"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="bg-gradient-to-br from-emerald-600 to-teal-600 p-6 rounded-full group-hover:scale-110 transition-transform">
                <User className="w-12 h-12" />
              </div>
              <h2 className="text-2xl font-bold">Khách hàng</h2>
              <p className="text-gray-400 text-sm">
                Lấy số thứ tự và xem hàng chờ
              </p>
            </div>
          </button>

          <button
            onClick={() => onNavigate("staff-login")}
            className="bg-gray-800 hover:bg-gray-700 rounded-2xl p-8 border-2 border-blue-500 hover:border-blue-400 transition-all duration-300 transform hover:scale-105 shadow-xl group"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="bg-gradient-to-br from-blue-600 to-cyan-600 p-6 rounded-full group-hover:scale-110 transition-transform">
                <UserCog className="w-12 h-12" />
              </div>
              <h2 className="text-2xl font-bold">Nhân viên</h2>
              <p className="text-gray-400 text-sm">Gọi khách hàng kế tiếp</p>
            </div>
          </button>

          <button
            onClick={() => onNavigate("admin-login")}
            className="bg-gray-800 hover:bg-gray-700 rounded-2xl p-8 border-2 border-purple-500 hover:border-purple-400 transition-all duration-300 transform hover:scale-105 shadow-xl group"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="bg-gradient-to-br from-purple-600 to-pink-600 p-6 rounded-full group-hover:scale-110 transition-transform">
                <Shield className="w-12 h-12" />
              </div>
              <h2 className="text-2xl font-bold">Quản lý</h2>
              <p className="text-gray-400 text-sm">
                Quản lý tài khoản nhân viên
              </p>
            </div>
          </button>

          <button
            onClick={() => onNavigate("display")}
            className="bg-gray-800 hover:bg-gray-700 rounded-2xl p-8 border-2 border-orange-500 hover:border-orange-400 transition-all duration-300 transform hover:scale-105 shadow-xl group"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="bg-gradient-to-br from-orange-600 to-red-600 p-6 rounded-full group-hover:scale-110 transition-transform">
                <Monitor className="w-12 h-12" />
              </div>
              <h2 className="text-2xl font-bold">Màn hình</h2>
              <p className="text-gray-400 text-sm">Hiển thị công cộng</p>
            </div>
          </button>
        </div>

        <div className="mt-12 text-center text-gray-400 text-sm">
          <p>Chọn chế độ để bắt đầu</p>
        </div>
      </div>
    </div>
  );
}
