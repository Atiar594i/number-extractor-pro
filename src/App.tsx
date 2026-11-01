import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { ExtractorView } from './components/ExtractorView';
import { NumberTableView } from './components/NumberTableView';
import { CountryView } from './components/CountryView';
import { DuplicateView } from './components/DuplicateView';
import { CopiedMemoryView } from './components/CopiedMemoryView';
import { ReviewView } from './components/ReviewView';
import { HistoryView } from './components/HistoryView';
import { SettingsView } from './components/SettingsView';
import { Toast } from './components/Toast';

const MainContent: React.FC = () => {
  const { activeTab } = useApp();

  return (
    <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'extractor' && <ExtractorView />}
        {activeTab === 'numbers' && <NumberTableView />}
        {activeTab === 'countries' && <CountryView />}
        {activeTab === 'duplicates' && <DuplicateView />}
        {activeTab === 'copied' && <CopiedMemoryView />}
        {activeTab === 'review' && <ReviewView />}
        {activeTab === 'history' && <HistoryView />}
        {activeTab === 'settings' && <SettingsView />}
      </div>
    </main>
  );
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans transition-colors duration-200">
        <Navbar />
        <div className="flex-1 flex flex-col lg:flex-row min-h-[calc(100vh-4rem)]">
          <Sidebar />
          <MainContent />
        </div>
        <Toast />
      </div>
    </AppProvider>
  );
};

export default App;
