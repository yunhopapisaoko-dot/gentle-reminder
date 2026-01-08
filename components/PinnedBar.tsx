
import React from 'react';
import { PINNED_EVENTS } from '../constants';

export const PinnedBar: React.FC = () => {
  return (
    <div className="bg-surface-purple border-y border-white/5 text-white/80 text-xs py-1">
      <div className="flex items-center space-x-4 px-6 overflow-x-auto scrollbar-hide whitespace-nowrap">
        {PINNED_EVENTS.map((event, idx) => (
          <div key={idx} className="flex items-center space-x-2 py-2">
            <div className="w-1.5 h-1.5 bg-secondary rounded-full animate-pulse shadow-[0_0_8px_#D946EF]"></div>
            <p className="font-bold tracking-tight text-[10px] uppercase opacity-70">{event}</p>
            {idx < PINNED_EVENTS.length - 1 && <span className="text-white/10 ml-2">|</span>}
          </div>
        ))}
      </div>
    </div>
  );
};
