import React, { useEffect, useRef, useState } from 'react';

export const IncomingCallDialog = ({ caller, onAccept, onReject, durationSec = 60 }) => {
  const [remaining, setRemaining] = useState(durationSec);
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          if (onReject) onReject();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [onReject]);

  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-md z-50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-gradient-to-b from-zinc-900 to-black text-white ring-1 ring-white/10 shadow-2xl overflow-hidden">
        <div className="p-5 flex items-center gap-3 border-b border-white/10">
          {caller?.avatar && (
            <img src={caller.avatar} alt="avatar" className="h-10 w-10 rounded-full object-cover" />
          )}
          <div className="flex-1">
            <div className="text-base font-semibold">Incoming call</div>
            <div className="text-sm text-white/70">{caller?.fullName || caller?.username}</div>
          </div>
          <div className="px-2 py-1 rounded-full bg-white/10 text-xs font-mono">{mm}:{ss}</div>
        </div>

        <div className="p-6 text-center">
          <div className="mx-auto mb-6 h-20 w-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
            <div className="h-12 w-12 rounded-full bg-emerald-400/20 border border-emerald-400/40 animate-ping" />
          </div>
          <div className="text-sm text-white/80 mb-6">Allow video and audio to connect.</div>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={onReject}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 transition-colors text-white shadow"
            >
              Reject
            </button>
            <button
              onClick={onAccept}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 transition-colors text-white shadow"
            >
              Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 