import React, { useState } from 'react';
import axios from 'axios';
import { Download, Rocket, Lock } from 'lucide-react';

function ExportButton({ jobId, keepRanges, subtitles, apiBase, isPro }) {
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);

  const handleExport = async () => {
    if (!isPro) return;
    if (!keepRanges || keepRanges.length === 0) return;

    setLoading(true);
    try {
      const res = await axios.post(`${apiBase}/export`, {
        job_id: jobId,
        keep_ranges: keepRanges,
        subtitles: subtitles
      });
      setDownloadUrl(res.data.download_url);
    } catch (err) {
      alert('เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  return (
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
            <span className="flex items-center gap-2 italic text-sm">Processing Video...</span>
          ) : (
            <>
              {isPro ? <Rocket className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              <span>{isPro ? 'ยืนยันและดาวน์โหลด .mp4' : 'อัปเกรดเพื่อ Export'}</span>
            </>
          )}
        </button>
      ) : (
        <a
          href={`${apiBase}${downloadUrl}`}
          className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all"
        >
          <Download className="w-4 h-4" />
          ดาวน์โหลดวิดีโอ (.mp4)
        </a>
      )}
      <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest">Fast Stream Copy Enabled</p>
    </div>
  );
}

export default ExportButton;
