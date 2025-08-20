import React, { useEffect, useRef, useState } from 'react';

export const OutgoingCallDialog = ({ callee, onCancelCall, durationSec = 60 }) => {
  const [remaining, setRemaining] = useState(durationSec);
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          if (onCancelCall) onCancelCall();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [onCancelCall]);

  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-md z-50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-gradient-to-b from-zinc-900 to-black text-white ring-1 ring-white/10 shadow-2xl overflow-hidden">
        <div className="p-5 flex items-center gap-3 border-b border-white/10">
          {callee?.avatar && (
            <img src={callee.avatar} alt="avatar" className="h-10 w-10 rounded-full object-cover" />
          )}
          <div className="flex-1">
            <div className="text-base font-semibold">Calling...</div>
            <div className="text-sm text-white/70">{callee?.fullName || callee?.username}</div>
          </div>
          <div className="px-2 py-1 rounded-full bg-white/10 text-xs font-mono">{mm}:{ss}</div>
        </div>

        <div className="p-6 text-center">
          <div className="mx-auto mb-6 h-20 w-20 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
            <div className="h-12 w-12 rounded-full bg-blue-400/20 border border-blue-400/40 animate-pulse" />
          </div>
          <div className="text-sm text-white/80 mb-6">Waiting for them to answer...</div>
          <div className="flex items-center justify-center">
            <button
              onClick={onCancelCall}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 transition-colors text-white shadow"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
