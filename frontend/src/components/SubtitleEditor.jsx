import React, { useState, useEffect, useRef } from 'react';
import { Type } from 'lucide-react';

function SubtitleEditor({ initialSegments, onUpdate, onSeek, activeTime }) {
  const [segments, setSegments] = useState(initialSegments);
  const scrollRef = useRef(null);
  const activeItemRef = useRef(null);

  const handleTextChange = (idx, newText) => {
    const updated = [...segments];
    updated[idx].text = newText;
    setSegments(updated);
    if (onUpdate) onUpdate(updated);
  };

  // Auto-scroll logic when active segment changes
  useEffect(() => {
    if (activeItemRef.current) {
      activeItemRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [activeTime]);

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden flex flex-col h-full max-h-[600px]">
      <div className="bg-slate-50 p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-100 p-2 rounded-lg">
            <Type className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm md:text-base">แก้ไขซับไตเติล (Smart Captions)</h3>
            <p className="text-[10px] text-slate-500">สร้างจาก AI ทั้งหมด {segments.length} ประโยค</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4 overflow-y-auto bg-white flex-1" ref={scrollRef}>
        {segments.map((seg, idx) => {
          const isActive = activeTime >= seg.start && activeTime <= seg.end;
          
          return (
            <div 
              key={idx} 
              ref={isActive ? activeItemRef : null}
              className={`group flex flex-col gap-2 p-3 rounded-xl border transition-all cursor-pointer
                ${isActive 
                  ? 'border-indigo-500 bg-indigo-50/50 shadow-md scale-[1.02] ring-2 ring-indigo-500/20' 
                  : 'border-slate-100 bg-slate-50 hover:border-indigo-300 hover:bg-white'}`}
              onClick={() => onSeek(seg.start)}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md
                    ${isActive ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-500'}`}>
                    {seg.start.toFixed(2)}s
                  </span>
                  {isActive && (
                    <span className="flex h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse"></span>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  {isActive ? 'กำลังเล่น...' : 'คลิกเพื่อกระโดดไปช่วงนี้'}
                </span>
              </div>
              <textarea
                className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm font-medium text-slate-700 leading-relaxed resize-none"
                rows={2}
                value={seg.text}
                onChange={(e) => handleTextChange(idx, e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default SubtitleEditor;
