'use client';

import { useState } from 'react';
import { FaStar } from 'react-icons/fa';
import LevelInfoModal from './LevelInfoModal';

interface LevelCardProps {
  currentXP: number;
  division: string;
  xpToNextLevel: number;
  icon: string;
}

export default function LevelCard({ currentXP, division, xpToNextLevel, icon }: LevelCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Calculate progress percentage
  const progressPercentage = Math.min(100, Math.max(0, (currentXP / (currentXP + xpToNextLevel)) * 100));

  return (
    <>
      <div 
        onClick={() => setIsModalOpen(true)}
        className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm p-4 border border-[#319141]/20 cursor-pointer hover:shadow-md transition-all duration-300"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-[#319141]/10 rounded-full flex items-center justify-center">
            <span className="text-xl">{icon}</span>
          </div>
          <div>
            <div className="font-bold text-[#0F1E0F]">Level Progress</div>
            <div className="text-sm text-[#319141]">{division}</div>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#319141]">Current XP</span>
            <span className="font-medium text-[#0F1E0F]">{currentXP.toLocaleString()}</span>
          </div>
          <div className="relative w-full h-2 bg-[#319141]/10 rounded-full overflow-hidden">
            <div 
              className="absolute top-0 left-0 h-full bg-[#319141] rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#319141]">{Math.round(progressPercentage)}% Complete</span>
            <div className="flex items-center gap-1 text-[#319141] bg-[#319141]/10 px-2 py-1 rounded-full">
              <FaStar className="text-yellow-400 text-xs" />
              <span>+{xpToNextLevel.toLocaleString()} XP needed</span>
            </div>
          </div>
        </div>
      </div>

      <LevelInfoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentXP={currentXP}
        nextLevelXP={currentXP + xpToNextLevel}
      />
    </>
  );
} 