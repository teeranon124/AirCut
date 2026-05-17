import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import UploadZone from './components/UploadZone';
import SilenceEditor from './components/SilenceEditor';
// import SubtitleEditor from './components/SubtitleEditor';
import ExportButton from './components/ExportButton';
import VideoPreview from './components/VideoPreview';
import { Loader2, XCircle } from 'lucide-react';

const API_BASE = 'https://aircut.onrender.com';

function App() {
  const [status, setStatus] = useState('idle');
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [seekTime, setSeekTime] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [cutIndices, setCutIndices] = useState([]);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [isPro, setIsPro] = useState(false);
  
  const [videoFile, setVideoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [videoDuration, setVideoDuration] = useState(0);
  
  // FFmpeg State
  const ffmpegRef = useRef(new FFmpeg());
  const [isFFmpegLoaded, setIsFFmpegLoaded] = useState(false);

  // Initialize FFmpeg
  useEffect(() => {
    loadFFmpeg();
  }, []);

  const loadFFmpeg = async () => {
    // Check if security headers (COOP/COEP) are working
    if (!window.crossOriginIsolated) {
      console.warn('Cross-Origin Isolation is not enabled. WASM might fail.');
    }

    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
    const ffmpeg = ffmpegRef.current;
    
    ffmpeg.on('log', ({ message }) => {
      console.log(message);
    });

    ffmpeg.on('progress', ({ progress }) => {
      setProgress(Math.round(progress * 100));
    });

    try {
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
      setIsFFmpegLoaded(true);
    } catch (err) {
      console.error('FFmpeg Load Error:', err);
      throw new Error('ไม่สามารถโหลดตัวประมวลผลวิดีโอได้ กรุณารีเฟรชหน้าเว็บ');
    }
  };

  const handleFileSelect = async (file, minSilenceLen, silenceThresh) => {
    setVideoFile(file);
    const localUrl = URL.createObjectURL(file);
    setVideoUrl(localUrl);
    
    setStatus('processing');
    setStatusText('กำลังเตรียมระบบ...');
    setProgress(5);

    try {
      const ffmpeg = ffmpegRef.current;
      if (!isFFmpegLoaded) {
        setStatusText('กำลังโหลดตัวประมวลผล (ครั้งแรก)...');
        await loadFFmpeg();
      }

      // 1. Write file to WASM FS
      setStatusText('กำลังดึงข้อมูลเสียง (ทำงานบนเครื่องคุณ)...');
      await ffmpeg.writeFile('input.mp4', await fetchFile(file));

      // 2. Extract Audio
      await ffmpeg.exec(['-i', 'input.mp4', '-vn', '-acodec', 'pcm_s16le', '-ar', '44100', '-ac', '1', 'audio.wav']);
      
      const audioData = await ffmpeg.readFile('audio.wav');
      const audioBlob = new Blob([audioData.buffer], { type: 'audio/wav' });

      // 3. Send only Audio to Backend for AI Analysis
      setStatusText('กำลังวิเคราะห์ช่วงเงียบด้วย AI...');
      const formData = new FormData();
      formData.append('audio', audioBlob, 'audio.wav');
      
      const res = await axios.post(
        `${API_BASE}/analyze-silence?min_silence_len=${minSilenceLen}&silence_thresh=${silenceThresh}`, 
        formData
      );

      // 4. Setup Project State
      setData({
        silence: res.data.silence,
        video_filename: file.name,
        segments: [] 
      });
      setCutIndices(res.data.silence.map((_, i) => i));
      setStatus('completed');
      setStatusText('พร้อมตัดต่อ!');
      setProgress(100);

    } catch (err) {
      console.error(err);
      setError('เกิดข้อผิดพลาดในการประมวลผลบนเบราว์เซอร์');
      setStatus('failed');
    }
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
    const totalDuration = videoDuration || 3600; 
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
  }, [data, cutIndices, videoDuration]);

  const cutRanges = React.useMemo(() => {
    if (!calculatedKeepRanges || calculatedKeepRanges.length <= 1) return [];
    let gaps = [];
    for (let i = 0; i < calculatedKeepRanges.length - 1; i++) {
      const currentEnd = calculatedKeepRanges[i][1];
      const nextStart = calculatedKeepRanges[i+1][0];
      if (nextStart > currentEnd) {
        gaps.push([currentEnd, nextStart]);
      }
    }
    return gaps;
  }, [calculatedKeepRanges]);

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
          <UploadZone onFileSelect={handleFileSelect} />
        )}

        {(status === 'processing' || status === 'uploading') && (
          <div className="max-w-2xl mx-auto py-20 text-center space-y-8 bg-white p-10 rounded-3xl shadow-2xl border border-slate-100">
            <div className="relative w-24 h-24 mx-auto">
              <div className="absolute inset-0 rounded-full border-8 border-indigo-50"></div>
              <div className="absolute inset-0 rounded-full border-8 border-indigo-600 border-t-transparent animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center font-black text-indigo-600">{progress}%</div>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-800">{statusText}</h2>
              <p className="text-slate-400 text-sm italic">กรุณาอย่าปิดหน้าต่างนี้ ระบบกำลังทำงานในเบราว์เซอร์ของคุณ</p>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border">
              <div 
                className="h-full bg-indigo-600 transition-all duration-500 shadow-lg" 
                style={{ width: `${progress}%` }}
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
            <div className="lg:col-span-7 lg:sticky lg:top-24 space-y-6">
              <VideoPreview 
                videoUrl={videoUrl} 
                seekTime={seekTime}
                currentTime={currentTime}
                cutRanges={cutRanges}
                onTimeUpdate={(t) => setCurrentTime(t)}
                onLoadedMetadata={(d) => setVideoDuration(d)}
              />
              <ExportButton 
                ffmpeg={ffmpegRef.current}
                videoFile={videoFile}
                keepRanges={calculatedKeepRanges} 
                isPro={isPro} 
                onProgress={(p) => setProgress(p)}
                onStatus={(s) => setStatusText(s)}
                setStatus={setStatus}
              />
            </div>
            
            <div className="lg:col-span-5 space-y-8 pb-20">
              <SilenceEditor 
                silence={data.silence} 
                cutIndices={cutIndices} 
                onToggleCut={handleToggleCut} 
                onSeek={handleSeek} 
              />
              
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="font-black text-slate-800 mb-2 uppercase tracking-widest text-[10px]">สรุปผลการตัดต่อ (WASM Mode)</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  ระบบตรวจพบช่วงเงียบ <strong>{data.silence.length}</strong> จุด 
                  วิดีโอจะถูกตัดต่อโดยตรงในเบราว์เซอร์ของคุณ ไม่มีการอัปโหลดวิดีโอขึ้นเซิร์ฟเวอร์
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
