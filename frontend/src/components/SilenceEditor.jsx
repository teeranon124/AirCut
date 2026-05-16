import React, { useState, useEffect } from 'react';
import { VolumeX, CheckSquare, Square, Trash2, Scissors } from 'lucide-react';

function SilenceEditor({ silence, cutIndices, onToggleCut, onSeek }) {
  const savedMs = cutIndices.reduce((idx, i) => {
    const range = silence[i];
    return range ? idx + (range[1] - range[0]) : idx;
  }, 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
      <div className="p-5 border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-slate-50 rounded-full flex items-center justify-center">
            <VolumeX className="w-4 h-4 text-slate-400" />
          </div>
          <span className="font-bold text-sm tracking-tight">ตรวจพบความเงียบ ({silence.length})</span>
        </div>
        <div className="text-right">
          <span className="block text-xs font-black text-slate-900">-{ (savedMs/1000).toFixed(1) }s</span>
          <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest">SAVED</span>
        </div>
      </div>

      <div className="max-h-[400px] overflow-y-auto divide-y divide-slate-50">
        {silence.map((range, idx) => {
          const isCutting = cutIndices.includes(idx);
          return (
            <div 
              key={idx}
              className={`flex items-center justify-between p-4 transition-all cursor-pointer group
                ${isCutting ? 'bg-red-50/30' : 'hover:bg-slate-50'}`}
              onClick={() => onSeek(range[0]/1000)}
            >
              <div className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors
                  ${isCutting ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-400'}`}>
                  {isCutting ? <Trash2 className="w-3.5 h-3.5" /> : <Scissors className="w-3.5 h-3.5" />}
                </div>
                <span className={`text-xs font-bold tabular-nums ${isCutting ? 'text-red-700' : 'text-slate-600'}`}>
                  { (range[0]/1000).toFixed(1) }s - { (range[1]/1000).toFixed(1) }s
                </span>
              </div>
              <button onClick={(e) => onToggleCut(e, idx)} className="p-2 outline-none">
                {isCutting ? <CheckSquare className="w-5 h-5 text-red-500" /> : <Square className="w-5 h-5 text-slate-200 group-hover:text-slate-300" />}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default SilenceEditor;
