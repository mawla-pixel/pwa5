/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { FestivalProvider, useFestival } from './context/FestivalContext';
import { VotingBundlesView } from './components/VotingBundlesView';
import { HomeView } from './components/HomeView';
import { BrowseFilmsView } from './components/BrowseFilmsView';
import { LiveResultsView } from './components/LiveResultsView';
import { UserProfileView } from './components/UserProfileView';
import { AdminDashboard } from './components/AdminDashboard';
import { BottomNavBar } from './components/BottomNavBar';
import { TopNavBar } from './components/TopNavBar';
import { ZiinaCheckoutModal } from './components/ZiinaCheckoutModal';
import { CastVoteModal } from './components/CastVoteModal';
import { OfflineIndicator } from './components/OfflineIndicator';

const MainAppContent: React.FC = () => {
  const { activeTab } = useFestival();

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#111111] flex flex-col font-sans selection:bg-[#A3792C]/20">
      {/* Desktop Top Navigation (hidden on mobile) */}
      <TopNavBar />

      {/* Active Tab Screen */}
      <div className="flex-1">
        {activeTab === 'home' && <HomeView />}
        {activeTab === 'browse' && <BrowseFilmsView />}
        {activeTab === 'vote' && <VotingBundlesView />}
        {activeTab === 'results' && <LiveResultsView />}
        {activeTab === 'profile' && <UserProfileView />}
        {activeTab === 'admin' && <AdminDashboard />}
      </div>

      {/* Global Modals & Sheets */}
      <ZiinaCheckoutModal />
      <CastVoteModal />

      {/* Offline Status indicator for PWA */}
      <OfflineIndicator />

      {/* Fixed Bottom Navigation (matching Screen 7) */}
      <BottomNavBar />
    </div>
  );
};

export default function App() {
  return (
    <FestivalProvider>
      <MainAppContent />
    </FestivalProvider>
  );
}
