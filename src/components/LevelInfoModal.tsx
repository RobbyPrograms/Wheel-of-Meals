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
    earnXP: [
      'Create your first meal (+100 XP)',
      'Add ingredients to your meal (+50 XP)',
      'Create your first meal plan (+200 XP)',
    ],
  },
  {
    title: 'Apprentice Chef',
    division: 'Division 1',
    xpRequired: 100,
    icon: '🍳',
    description: "You're getting comfortable in the kitchen!",
    earnXP: [
      'Create weekly meal plans (+300 XP)',
      'Share meals with the community (+100 XP)',
      'Get likes on your shared meals (+50 XP each)',
    ],
  },
  {
    title: 'Home Cook',
    division: 'Division 1',
    xpRequired: 2000,
    icon: '🏠',
    description: 'Your meal planning skills are impressive!',
    earnXP: [
      'Create monthly meal plans (+500 XP)',
      'Get featured in community highlights (+1000 XP)',
      'Help others with meal suggestions (+200 XP)',
    ],
  },
  {
    title: 'Culinary Enthusiast',
    division: 'Division 1',
    xpRequired: 10000,
    icon: '🌟',
    description: 'A true meal planning master!',
    earnXP: [
      'Create seasonal meal collections (+1000 XP)',
      'Reach meal planning streaks (+500 XP/week)',
      'Inspire the community with your creations (+300 XP)',
    ],
  },
  {
    title: 'Master Chef',
    division: 'Division 1',
    xpRequired: 50000,
    icon: '👑',
    description: 'Elite culinary master!',
    earnXP: [
      'Create viral meal collections (+2000 XP)',
      'Maintain perfect planning streaks (+1000 XP/month)',
      'Mentor new users (+500 XP)',
    ],
  },
  {
    title: 'Gourmet Guru',
    division: 'Division 1',
    xpRequired: 200000,
    icon: '🎖️',
    description: 'Elite culinary influencer!',
    earnXP: [
      'Create viral meal collections (+2000 XP)',
      'Maintain perfect planning streaks (+1000 XP/month)',
      'Mentor new users (+500 XP)',
    ],
  },
  {
    title: 'Michelin Star',
    division: 'Division 1',
    xpRequired: 500000,
    icon: '⭐',
    description: "Elite status achieved! You're a SavoryCircle legend.",
    earnXP: [
      'Maintain perfect planning streaks (+1000 XP/month)',
      'Create viral meal collections (+2000 XP)',
      'Mentor new users (+500 XP)',
    ],
  },
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
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-2xl bg-white rounded-2xl shadow-xl">
          <div className="p-6">
            <div className="flex justify-between items-start mb-6">
              <Dialog.Title className="text-2xl font-bold text-[#0F1E0F]">
                Level Progress & Rewards
              </Dialog.Title>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Current Progress */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <h3 className="text-lg font-semibold text-[#319141] mb-2">Your Progress</h3>
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

            {/* Level Progression */}
            <h3 className="text-lg font-semibold text-[#0F1E0F] mb-4">Level Progression</h3>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {levels.map((level) => (
                <div 
                  key={level.title}
                  className={`rounded-xl border p-4 ${
                    currentXP >= level.xpRequired 
                      ? 'border-[#319141] bg-[#319141]/5' 
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      currentXP >= level.xpRequired 
                        ? 'bg-[#319141] text-white' 
                        : 'bg-gray-100 text-gray-400'
                    }`}>
                      <span>{level.icon}</span>
                    </div>
                    <div>
                      <div className="font-bold text-[#0F1E0F]">{level.title}</div>
                      <div className="text-sm text-gray-600">{level.division}</div>
                    </div>
                    <div className="ml-auto text-sm font-medium">
                      {level.xpRequired.toLocaleString()} XP
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{level.description}</p>
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-[#0F1E0F]">Ways to Earn XP:</div>
                    {level.earnXP.map((way, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="w-1 h-1 bg-[#319141] rounded-full"></div>
                        {way}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 