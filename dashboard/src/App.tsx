import { useState } from 'react';
import { AppShell } from './components/layout/AppShell';
import { NavTab } from './components/layout/Sidebar';
import { OverviewView } from './components/views/OverviewView';
import { AnalyzeVideoView } from './components/views/AnalyzeVideoView';
import { SessionAnalysisRecord } from './api/types';

export function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('overview');
  const [sessionRecords, setSessionRecords] = useState<SessionAnalysisRecord[]>([]);
  const [activeRecord, setActiveRecord] = useState<SessionAnalysisRecord | null>(null);

  const handleRecordCompleted = (record: SessionAnalysisRecord) => {
    setSessionRecords((prev) => {
      // If already exists by id, replace; otherwise append
      const filtered = prev.filter((r) => r.id !== record.id);
      return [...filtered, record];
    });
    setActiveRecord(record);
  };

  const handleSelectRecord = (record: SessionAnalysisRecord) => {
    setActiveRecord(record);
  };

  return (
    <AppShell currentTab={currentTab} onSelectTab={setCurrentTab}>
      {currentTab === 'overview' ? (
        <OverviewView
          onNavigateToAnalyze={() => setCurrentTab('analyze')}
          sessionRecords={sessionRecords}
          activeRecord={activeRecord}
          onSelectSessionRecord={handleSelectRecord}
        />
      ) : (
        <AnalyzeVideoView
          onNavigateToOverview={() => setCurrentTab('overview')}
          sessionRecords={sessionRecords}
          onRecordCompleted={handleRecordCompleted}
          onSelectSessionRecord={handleSelectRecord}
        />
      )}
    </AppShell>
  );
}

export default App;
