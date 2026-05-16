import React, { useState, useEffect } from 'react';
import axios from 'axios';
import UploadZone from './components/UploadZone';
import SilenceEditor from './components/SilenceEditor';
// import SubtitleEditor from './components/SubtitleEditor';
import ExportButton from './components/ExportButton';
import VideoPreview from './components/VideoPreview';
import { Loader2, XCircle } from 'lucide-react';

const API_BASE = 'https://aircut.onrender.com';

function App() {
  const [jobId, setJobId] = useState(null);
  const [status, setStatus] = useState('idle');
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [seekTime, setSeekTime] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [cutIndices, setCutIndices] = useState([]);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    let interval;
    if (status === 'processing' && jobId) {
      interval = setInterval(async () => {
        try {
          const res = await axios.get(`${API_BASE}/status/${jobId}`);
          if (res.data.progress_percent !== undefined) setProgress(res.data.progress_percent);
          if (res.data.progress_status) setStatusText(res.data.progress_status);
          if (res.data.status === 'completed') {
            setData(res.data);
            setStatus('completed');
            setCutIndices(res.data.silence.map((_, i) => i));
            clearInterval(interval);
          } else if (res.data.status === 'failed') {
            setError(res.data.error);
            setStatus('failed');
            clearInterval(interval);
          }
        } catch (err) { console.error(err); }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [status, jobId]);

  const handleUploadSuccess = (id) => {
    setJobId(id);
    setStatus('processing');
    setProgress(0);
    setCurrentTime(0);
    setSeekTime(null);
  };

  const handleSeek = (time) => {
    setSeekTime(time);
    setCurrentTime(time);
  };

  const handleToggleCut = (e, idx) => {
    e.stopPropagation();
    setCutIndices(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]);
  };

  const calculatedKeepRanges = React.useMemo(() => {
    if (!data) return [];
    const totalDuration = 3600; 
    const padding = 0.2;
    let keeps = [];
    let lastEnd = 0;
    const sortedSilence = [...data.silence].sort((a, b) => a[0] - b[0]);
    sortedSilence.forEach((range, idx) => {
      if (cutIndices.includes(idx)) {
        const startSec = range[0] / 1000;
        const endSec = range[1] / 1000;
        const keepEnd = Math.min(totalDuration, startSec + padding);
        if (keepEnd > lastEnd) keeps.push([lastEnd, keepEnd]);
        lastEnd = Math.max(0, endSec - padding);
      }
    });
    if (lastEnd < totalDuration) keeps.push([lastEnd, totalDuration]);
    return cutIndices.length === 0 ? [[0, totalDuration]] : keeps;
  }, [data, cutIndices]);

  const cutRanges = data ? cutIndices.map(i => [data.silence[i][0]/1000, data.silence[i][1]/1000]) : [];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      <header className="h-16 border-b bg-white flex items-center px-6 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-indigo-600 tracking-tight italic">AUTOCUT</h1>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isPro ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'}`}>
              {isPro ? 'PRO MEMBER' : 'FREE VERSION'}
            </span>
          </div>
          {!isPro && status === 'completed' && (
            <button 
              onClick={() => setIsPro(true)}
              className="bg-amber-400 hover:bg-amber-500 text-amber-950 text-xs font-black px-4 py-2 rounded-full shadow-lg transition-all flex items-center gap-2 scale-100 hover:scale-105"
            >
              👑 อัปเกรดเป็น PRO (เพื่อโหลดไฟล์)
            </button>
          )}
          {status === 'processing' && (
            <div className="flex items-center gap-2 text-slate-500 text-sm bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
              <Loader2 className="animate-spin w-4 h-4 text-indigo-500" />
              <span className="font-bold text-xs">กำลังประมวลผล...</span>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-8">
        {status === 'idle' && (
          <UploadZone onUploadSuccess={handleUploadSuccess} apiBase={API_BASE} setStatus={setStatus} />
        )}

        {(status === 'processing' || status === 'uploading') && (
          <div className="max-w-2xl mx-auto py-20 text-center space-y-8 bg-white p-10 rounded-3xl shadow-2xl border border-slate-100">
            <div className="relative w-24 h-24 mx-auto">
              <div className="absolute inset-0 rounded-full border-8 border-indigo-50"></div>
              <div className="absolute inset-0 rounded-full border-8 border-indigo-600 border-t-transparent animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center font-black text-indigo-600">{status === 'uploading' ? '...' : `${progress}%`}</div>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-800">
                {status === 'uploading' ? 'กำลังอัปโหลดวิดีโอ...' : statusText}
              </h2>
              <p className="text-slate-400 text-sm italic">กรุณาอย่าปิดหน้าต่างนี้ ระบบกำลังทำงานให้คุณ</p>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border">
              <div 
                className="h-full bg-indigo-600 transition-all duration-500 shadow-lg" 
                style={{ width: status === 'uploading' ? '10%' : `${progress}%` }}
              ></div>
            </div>
          </div>
        )}

        {status === 'failed' && (
          <div className="max-w-md mx-auto bg-white border border-red-100 p-8 rounded-2xl shadow-xl text-center">
            <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold">เกิดข้อผิดพลาด</h2>
            <p className="text-slate-500 mt-2 text-sm">{error}</p>
            <button onClick={() => setStatus('idle')} className="mt-6 w-full py-3 bg-slate-800 text-white rounded-xl font-bold">ลองใหม่อีกครั้ง</button>
          </div>
        )}

        {status === 'completed' && data && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Video Preview */}
            <div className="lg:col-span-7 lg:sticky lg:top-24">
              <VideoPreview 
                videoUrl={`${API_BASE}/previews/${data.video_filename}`} 
                seekTime={seekTime}
                currentTime={currentTime}
                cutRanges={cutRanges}
                onTimeUpdate={(t) => setCurrentTime(t)}
              />
            </div>
            
            {/* Right Column: Editor & Export */}
            <div className="lg:col-span-5 space-y-8 pb-20">
              <SilenceEditor 
                silence={data.silence} 
                cutIndices={cutIndices} 
                onToggleCut={handleToggleCut} 
                onSeek={handleSeek} 
              />
              
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="font-black text-slate-800 mb-2 uppercase tracking-widest text-[10px]">สรุปผลการตัดต่อ</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  ระบบตรวจพบช่วงเงียบ <strong>{data.silence.length}</strong> จุด 
                  วิดีโอจะถูกตัดต่ออย่างรวดเร็วด้วยเทคนิค Stream Copy
                </p>
              </div>

              <ExportButton 
                jobId={jobId} 
                keepRanges={calculatedKeepRanges} 
                subtitles={data.segments} 
                apiBase={API_BASE} 
                isPro={isPro} 
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
