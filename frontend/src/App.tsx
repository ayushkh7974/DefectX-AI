import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { InspectionPage } from './pages/InspectionPage';
import { Visualization3DPage } from './pages/Visualization3DPage';
import { DefectAnalysisPage } from './pages/DefectAnalysisPage';
import { DecisionCenterPage } from './pages/DecisionCenterPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { RootCausePage } from './pages/RootCausePage';
import { TraceabilityPage } from './pages/TraceabilityPage';
import { ReportsPage } from './pages/ReportsPage';
import { ModelPerformancePage } from './pages/ModelPerformancePage';
import { SettingsPage } from './pages/SettingsPage';

export const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-y-auto">
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/inspection" element={<InspectionPage />} />
              <Route path="/3d-prototype" element={<Visualization3DPage />} />
              <Route path="/defect-analysis" element={<DefectAnalysisPage />} />
              <Route path="/decision-center" element={<DecisionCenterPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/root-cause" element={<RootCausePage />} />
              <Route path="/traceability" element={<TraceabilityPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/model-performance" element={<ModelPerformancePage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
};

export default App;
