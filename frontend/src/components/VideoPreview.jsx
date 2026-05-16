import React, { useRef, useEffect, useState } from 'react';
import { Play, Eye, EyeOff } from 'lucide-react';

function VideoPreview({ videoUrl, seekTime, currentTime, cutRanges, onTimeUpdate, activeSubtitle }) {
  const videoRef = useRef(null);
  const [isPreviewMode, setIsPreviewMode] = useState(true);
  const [duration, setDuration] = useState(0);

  // Manual Seek triggered from App (Subtitles or Timeline)
  useEffect(() => {
    if (videoRef.current && seekTime !== null) {
      videoRef.current.currentTime = seekTime;
    }
  }, [seekTime]);

  const handleLoadedMetadata = () => {
    if (videoRef.current) setDuration(videoRef.current.duration);
  };

  // Real-time Skip Logic & Sync
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    
    const current = videoRef.current.currentTime;
    
    // Notify parent of actual current time
    if (onTimeUpdate) onTimeUpdate(current);

    // Skip logic for Preview Mode
    if (cutRanges && isPreviewMode) {
      // Find if we are currently inside any cut range
      const activeRange = cutRanges.find(([start, end]) => current >= start && current < end);
      
      if (activeRange) {
        // Jump to end of range + tiny buffer to avoid precision loops
        videoRef.current.currentTime = activeRange[1] + 0.05;
      }
    }
  };

  const handleTimelineClick = (e) => {
    if (!videoRef.current || duration === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const clickedTime = (x / rect.width) * duration;
    videoRef.current.currentTime = clickedTime;
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-black rounded-3xl overflow-hidden shadow-2xl aspect-video flex items-center justify-center relative group border-4 border-white">
        <video 
          ref={videoRef}
          src={videoUrl} 
          controls 
          controlsList="nodownload"
          onContextMenu={(e) => e.preventDefault()}
          className="w-full h-full"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
        />
        
        {/* Status Badge */}
        <div className="absolute top-6 left-6 flex items-center gap-2">
          {isPreviewMode ? (
            <span className="bg-indigo-600 text-white text-[10px] font-black px-3 py-1.5 rounded-full flex items-center gap-2 shadow-xl animate-pulse tracking-widest uppercase">
              <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" /> Preview Mode
            </span>
          ) : (
            <span className="bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-black px-3 py-1.5 rounded-full flex items-center gap-2 shadow-xl tracking-widest uppercase">
              Original Video
            </span>
          )}
        </div>

        {!videoUrl && (
          <div className="text-slate-500 flex flex-col items-center gap-2">
            <Play className="w-12 h-12 opacity-20" />
            <p>รอวิดีโอพรีวิว</p>
          </div>
        )}
      </div>

      {/* Visual Cut Timeline */}
      <div className="space-y-2">
        <div className="flex justify-between items-center px-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Timeline จำลองการตัด (แดง = ถูกตัดออก)</span>
          <span className="text-[10px] font-mono text-slate-500">{(currentTime || 0).toFixed(1)}s / {duration.toFixed(1)}s</span>
        </div>
        <div 
          className="relative h-4 bg-slate-200 rounded-full overflow-hidden cursor-pointer border border-slate-100 shadow-inner"
          onClick={handleTimelineClick}
        >
          {/* Progress Indicator - Uses currentTime from App for sync */}
          <div 
            className="absolute top-0 bottom-0 left-0 bg-indigo-500/30 border-r-2 border-indigo-600 z-10 transition-all duration-100"
            style={{ width: `${((currentTime || 0) / (duration || 1)) * 100}%` }}
          />
          
          {/* Cut Segments Overlay */}
          {cutRanges && cutRanges.map(([start, end], idx) => (
            <div 
              key={idx}
              className="absolute top-0 bottom-0 bg-red-500/60 backdrop-blur-[1px] z-20 border-x border-red-600/20"
              style={{ 
                left: `${(start / duration) * 100}%`, 
                width: `${((end - start) / duration) * 100}%` 
              }}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <div className="text-xs md:text-sm font-medium text-slate-600">
          {isPreviewMode 
            ? "กำลังจำลองวิดีโอหลังตัดช่วงเงียบออก" 
            : "กำลังแสดงวิดีโอต้นฉบับ"}
        </div>
        <button 
          onClick={() => setIsPreviewMode(!isPreviewMode)}
          className={`flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-bold text-xs md:text-sm transition-all
            ${isPreviewMode 
              ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md' 
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
        >
          {isPreviewMode ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          {isPreviewMode ? "ดูแบบปกติ" : "เปิดโหมดจำลองหลังตัด"}
        </button>
      </div>
    </div>
  );
}

export default VideoPreview;
