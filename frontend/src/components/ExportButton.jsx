import React, { useState } from 'react';
import { Download, Rocket, Lock, Settings } from 'lucide-react';

function ExportButton({ ffmpeg, videoFile, keepRanges, isPro, onProgress, onStatus, setStatus }) {
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [quality, setQuality] = useState(26); // Default to Standard (26)

  const handleExport = async () => {
    if (!isPro) return;
    if (!keepRanges || keepRanges.length === 0) return;

    setLoading(true);
    setStatus('processing');
    onStatus('กำลังเตรียมข้อมูลสำหรับตัดต่อ...');

    try {
      // 1. Build Filter Graph
      // [0:v]trim=start=S1:end=E1,setpts=PTS-STARTPTS[v1];
      // [0:a]atrim=start=S1:end=E1,asetpts=PTS-STARTPTS[a1];
      // ...
      // [v1][a1][v2][a2]concat=n=N:v=1:a=1[v][a]
      
      let filterVideo = '';
      let filterAudio = '';
      let concatParts = '';
      
      keepRanges.forEach((range, i) => {
        filterVideo += `[0:v]trim=start=${range[0]}:end=${range[1]},setpts=PTS-STARTPTS[v${i}];`;
        filterAudio += `[0:a]atrim=start=${range[0]}:end=${range[1]},asetpts=PTS-STARTPTS[a${i}];`;
        concatParts += `[v${i}][a${i}]`;
      });
      
      const filterComplex = `${filterVideo}${filterAudio}${concatParts}concat=n=${keepRanges.length}:v=1:a=1[outv][outa]`;

      onStatus('กำลังเรนเดอร์วิดีโอ (ทำงานบนเครื่องคุณ)...');
      
      const outputName = 'output.mp4';
      
      await ffmpeg.exec([
        '-i', 'input.mp4',
        '-filter_complex', filterComplex,
        '-map', '[outv]',
        '-map', '[outa]',
        '-c:v', 'libx264',
        '-crf', String(quality),
        '-preset', 'ultrafast', // Max speed for browser
        '-c:a', 'aac',
        outputName
      ]);

      const data = await ffmpeg.readFile(outputName);
      const url = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));
      setDownloadUrl(url);

      // AUTOMATIC DOWNLOAD
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'autocut_pro.mp4');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setStatus('completed');
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการประมวลผลบนเบราว์เซอร์');
      setStatus('completed'); // Revert to editor
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Quality Selector */}
      {!downloadUrl && isPro && (
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center gap-2 font-bold text-[10px] uppercase tracking-widest text-slate-400">
            <Settings className="w-3.5 h-3.5" />
            <span>คุณภาพวิดีโอส่งออก</span>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {[
              { label: 'เน้นเร็ว (ไฟล์เล็กที่สุด)', desc: 'ชัดพอประมาณ ประหยัดพื้นที่ โหลดไวมาก', crf: 32 },
              { label: 'มาตรฐาน (แนะนำ)', desc: 'ชัดกำลังดี สมดุลระหว่างขนาดไฟล์และความเร็ว', crf: 26 },
              { label: 'คุณภาพสูง (ชัดเท่าต้นฉบับ)', desc: 'ชัดที่สุดเท่าที่ทำได้ แต่ใช้เวลาประมวลผลนานและไฟล์ใหญ่', crf: 21 },
            ].map((q) => (
              <button
                key={q.crf}
                onClick={() => setQuality(q.crf)}
                className={`flex flex-col p-4 rounded-2xl border-2 text-left transition-all
                  ${quality === q.crf 
                    ? 'border-indigo-600 bg-indigo-50 shadow-sm' 
                    : 'border-slate-50 hover:border-slate-200 bg-slate-50/50'}`}
              >
                <span className={`text-xs font-black ${quality === q.crf ? 'text-indigo-600' : 'text-slate-600'}`}>
                  {q.label}
                </span>
                <span className="text-[10px] text-slate-400 font-medium mt-0.5">
                  {q.desc}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        {!downloadUrl ? (
          <button
            onClick={handleExport}
            disabled={loading}
            className={`w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2
              ${isPro 
                ? 'bg-slate-900 text-white hover:bg-slate-800' 
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
          >
            {loading ? (
              <span className="flex items-center gap-2 italic text-sm text-indigo-400 font-black">กำลังตัดต่อวิดีโอ...</span>
            ) : (
              <>
                {isPro ? <Rocket className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                <span>{isPro ? 'เริ่มตัดต่อและดาวน์โหลด' : 'อัปเกรดเพื่อ Export'}</span>
              </>
            )}
          </button>
        ) : (
          <div className="space-y-3 animate-in fade-in zoom-in-95 duration-500">
            <a
              href={downloadUrl}
              download="autocut_pro.mp4"
              className="w-full bg-green-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-700 transition-all shadow-lg"
            >
              <Download className="w-4 h-4" />
              ดาวน์โหลดอีกครั้ง (.mp4)
            </a>
            <p className="text-[10px] text-center text-green-600 font-bold uppercase tracking-widest">
              ประมวลผลเสร็จสิ้นในเบราว์เซอร์แล้ว
            </p>
          </div>
        )}
        <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest">Client-Side WASM Rendering</p>
      </div>
    </div>
  );
}

export default ExportButton;
