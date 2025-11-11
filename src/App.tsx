import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import HomePage from './pages/HomePage';
import CustomerView from './pages/CustomerView';
import StaffView from './pages/StaffView';
import PublicDisplay from './pages/PublicDisplay';

type View = 'home' | 'customer' | 'staff' | 'display';

function App() {
  const [currentView, setCurrentView] = useState<View>('home');

  const handleNavigate = (view: View) => {
    setCurrentView(view);
  };

  const handleBack = () => {
    setCurrentView('home');
  };

  return (
    <div className="relative">
      {currentView !== 'home' && currentView !== 'display' && (
        <button
          onClick={handleBack}
          className="fixed top-6 left-6 z-50 bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-full border border-gray-600 shadow-lg transition-all duration-200 hover:scale-110"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
      )}

      {currentView === 'home' && <HomePage onNavigate={handleNavigate} />}
      {currentView === 'customer' && <CustomerView />}
      {currentView === 'staff' && <StaffView />}
      {currentView === 'display' && <PublicDisplay />}
    </div>
  );
}

export default App;
