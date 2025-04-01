'use client';

import { Dialog } from '@headlessui/react';

interface LevelInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentXP: number;
  nextLevelXP: number;
}

const levels = [
  {
    title: 'Kitchen Novice',
    division: 'Division 1',
    xpRequired: 0,
    icon: '👨‍🍳',
    description: 'Welcome to SavoryCircle! Start your culinary journey.',
    nextRank: 'Apprentice Chef',
    nextRankXP: 100
  },
  {
    title: 'Apprentice Chef',
    division: 'Division 1',
    xpRequired: 100,
    icon: '🍳',
    description: "You're getting comfortable in the kitchen!",
    nextRank: 'Home Cook',
    nextRankXP: 250
  },
  {
    title: 'Home Cook',
    division: 'Division 2',
    xpRequired: 250,
    icon: '🏠',
    description: 'Your meal planning skills are growing!',
    nextRank: 'Culinary Enthusiast',
    nextRankXP: 1000
  },
  {
    title: 'Culinary Enthusiast',
    division: 'Division 2',
    xpRequired: 1000,
    icon: '🌟',
    description: 'A true meal planning master!',
    nextRank: 'Master Chef',
    nextRankXP: 2500
  },
  {
    title: 'Master Chef',
    division: 'Division 3',
    xpRequired: 2500,
    icon: '👑',
    description: 'Elite culinary master!',
    nextRank: 'Gourmet Guru',
    nextRankXP: 5000
  },
  {
    title: 'Gourmet Guru',
    division: 'Division 3',
    xpRequired: 5000,
    icon: '🎖️',
    description: 'Elite culinary influencer!',
    nextRank: 'Michelin Star',
    nextRankXP: 10000
  },
  {
    title: 'Michelin Star',
    division: 'Division 4',
    xpRequired: 10000,
    icon: '⭐',
    description: "Elite status achieved! You're a SavoryCircle legend.",
    nextRank: null,
    nextRankXP: null
  }
];

const xpActions = [
  { action: 'Create a new recipe post', xp: 50 },
  { action: 'Receive likes on your recipes', xp: 10 },
  { action: 'Receive comments on your recipes', xp: 15 }
];

export default function LevelInfoModal({ isOpen, onClose, currentXP, nextLevelXP }: LevelInfoModalProps) {
  // Calculate XP needed for next level
  const xpNeeded = nextLevelXP - currentXP;
  const progressPercentage = Math.min(100, Math.max(0, (currentXP / nextLevelXP) * 100));

  // Find current level
  const currentLevel = levels.reduce((prev, curr) => {
    if (currentXP >= curr.xpRequired) {
      return curr;
    }
    return prev;
  }, levels[0]);

  // Find next level
  const nextLevel = levels.find(level => level.xpRequired > currentXP) || currentLevel;

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />

      {/* Full-screen container */}
      <div className="fixed inset-0 flex items-start justify-center sm:items-center p-0">
        <Dialog.Panel className="w-full h-full sm:h-auto sm:max-h-[90vh] sm:w-full sm:max-w-lg bg-white sm:rounded-2xl shadow-xl overflow-hidden">
          {/* Sticky Header */}
          <div className="sticky top-0 bg-white z-10 px-4 py-3 sm:p-4 border-b border-gray-100 flex justify-between items-center">
            <Dialog.Title className="text-xl sm:text-2xl font-bold text-[#0F1E0F]">
              Level Progress & Rewards
            </Dialog.Title>
            <button
              onClick={onClose}
              className="p-2 -mr-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
              aria-label="Close dialog"
            >
              ✕
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="overflow-y-auto h-[calc(100%-60px)] sm:h-auto">
            <div className="p-4 pb-20 sm:p-6 space-y-6">
              {/* Current Progress */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-base sm:text-lg font-semibold text-[#319141] mb-3">Your Progress</h3>
                <div className="flex justify-between text-sm mb-2">
                  <span>Current XP: {currentXP.toLocaleString()}</span>
                  <span>Next Level: {nextLevelXP.toLocaleString()} XP</span>
                </div>
                <div className="relative w-full h-2 bg-[#319141]/10 rounded-full overflow-hidden mb-2">
                  <div 
                    className="absolute top-0 left-0 h-full bg-[#319141] rounded-full transition-all duration-500"
                    style={{ width: `${progressPercentage}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  {xpNeeded.toLocaleString()} XP needed for {nextLevel.title}
                </div>
              </div>

              {/* Ways to Earn XP */}
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-[#0F1E0F] mb-3">Ways to Earn XP</h3>
                <div className="grid gap-2">
                  {xpActions.map((action, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                    >
                      <span className="text-gray-700">{action.action}</span>
                      <span className="font-medium text-[#319141]">+{action.xp} XP</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Level Progression */}
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-[#0F1E0F] mb-3">Level Progression</h3>
                <div className="space-y-3 overflow-y-auto">
                  {levels.map((level, index) => (
                    <div 
                      key={level.title}
                      className={`rounded-xl border p-4 ${
                        currentXP >= level.xpRequired 
                          ? 'border-[#319141] bg-[#319141]/5' 
                          : 'border-gray-200'
                      } ${index === levels.length - 1 ? 'mb-40 sm:mb-12' : ''}`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-lg sm:text-xl ${
                          currentXP >= level.xpRequired 
                            ? 'bg-[#319141] text-white' 
                            : 'bg-gray-100 text-gray-400'
                        }`}>
                          {level.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-[#0F1E0F] truncate">{level.title}</div>
                          <div className="text-sm text-gray-600">{level.division}</div>
                        </div>
                        <div className="text-sm font-medium whitespace-nowrap">
                          {level.xpRequired.toLocaleString()} XP
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{level.description}</p>
                      {level.nextRank && (
                        <div className="text-sm text-[#319141]">
                          Next Rank: {level.nextRank} ({level.nextRankXP} XP)
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 