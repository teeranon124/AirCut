import React, { useState } from 'react';
import axios from 'axios';
import { Upload, Clock, Volume2, Type, ChevronRight } from 'lucide-react';

function UploadZone({ onFileSelect }) {
  const [isDragging, setIsDragging] = useState(false);
  const [minSilenceLen, setMinSilenceLen] = useState(1000);
  const [silenceThresh, setSilenceThresh] = useState(-40);

  const handleFile = (file) => {
    if (!file || !file.type.startsWith('video/')) {
      alert('กรุณาอัปโหลดไฟล์วิดีโอ');
      return;
    }

    // Limit file size to 500MB for WASM stability
    if (file.size > 500 * 1024 * 1024) {
      alert('ไฟล์มีขนาดใหญ่เกินไป (จำกัดไม่เกิน 500MB) เพื่อความเสถียรของเบราว์เซอร์');
      return;
    }

    onFileSelect(file, minSilenceLen, silenceThresh);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 py-10">
      {/* 1. Settings Card (Now at the TOP) */}
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-12">
        {/* Silence Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-center">
          <div className="space-y-6">
            <div className="flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-widest text-indigo-600">
              <Clock className="w-4 h-4" />
              <span>ความละเอียดการตัด</span>
            </div>
            <div className="space-y-4">
              <input type="range" min="200" max="2000" step="100" value={minSilenceLen} onChange={(e) => setMinSilenceLen(e.target.value)} className="w-full h-2 bg-slate-100 rounded-full appearance-none accent-indigo-400 cursor-pointer" />
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                <span className="w-1/3 text-left text-slate-300">ตัดยิบย่อย</span>
                <span className="w-1/3 text-center text-sm text-indigo-400 font-black">{minSilenceLen}ms</span>
                <span className="w-1/3 text-right text-slate-300">ตัดเฉพาะช่วงยาว</span>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-widest text-indigo-600">
              <Volume2 className="w-4 h-4" />
              <span>ความไวต่อเสียง</span>
            </div>
            <div className="space-y-4">
              <input type="range" min="-60" max="-20" step="1" value={silenceThresh} onChange={(e) => setSilenceThresh(e.target.value)} className="w-full h-2 bg-slate-100 rounded-full appearance-none accent-indigo-400 cursor-pointer" />
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                <span className="w-1/3 text-left text-slate-300">เน้นเงียบกริบ</span>
                <span className="w-1/3 text-center text-sm text-indigo-400 font-black">{silenceThresh}dB</span>
                <span className="w-1/3 text-right text-slate-300">ตัดแม้มีเสียงรบกวน</span>
              </div>
            </div>
          </div>
        </div>

        {/* Subtitle Settings (HIDDEN FOR PRODUCTION) */}
        {/* 
        <div className="space-y-8 border-t border-slate-50 pt-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg shadow-sm transition-colors ${withSubtitles ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-50 text-slate-400'}`}>
                <Type className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-800 tracking-tight">สร้างซับไตเติลภาษาไทยอัตโนมัติ</span>
                  <span className="bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter border-none">Beta</span>
                </div>
                <div className="text-[10px] text-slate-400 font-medium text-left">ใช้ AI วิเคราะห์และแปลงเสียงเป็นข้อความ</div>
              </div>
            </div>
            <button 
              type="button"
              onClick={() => setWithSubtitles(!withSubtitles)} 
              className={`w-12 h-6 rounded-full transition-all relative ${withSubtitles ? 'bg-indigo-600' : 'bg-slate-200'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${withSubtitles ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          {withSubtitles && (
            <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300 text-left">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { id: 'base', label: 'เร็วสายฟ้า', desc: 'คุณภาพต่ำมาก ไม่แนะนำเพราะถอดเพี้ยนเยอะมาก' },
                  { id: 'medium', label: 'แม่นยำปานกลาง', desc: 'คุณภาพพอใช้ได้ แต่ยังมีถอดผิดและข้ามประโยคอยู่' },
                  { id: 'large-v3', label: 'มืออาชีพ (Large)', desc: 'ดีที่สุดและแม่นยำที่สุด แต่ใช้เวลาประมวลผลนานมาก' }
                ].map((model) => (
                  <button 
                    key={model.id} 
                    type="button"
                    onClick={() => setModelSize(model.id)} 
                    className={`flex flex-col p-4 rounded-2xl border-2 transition-all font-bold ${modelSize === model.id ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                  >
                    <div className="flex justify-between items-center w-full mb-2">
                      <span className="text-xs uppercase">{model.label}</span>
                      {modelSize === model.id && <ChevronRight className="w-3 h-3 text-indigo-600" />}
                    </div>

                    <div className={`text-[10px] leading-relaxed font-medium ${modelSize === model.id ? 'text-indigo-500' : 'text-slate-400'}`}>
                      {model.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        */}
      </div>

      {/* 2. Upload Box (Now at the BOTTOM) */}
      <div 
        className={`relative group border-4 border-dashed rounded-3xl p-24 text-center transition-all cursor-pointer
          ${isDragging ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200 bg-white hover:border-indigo-400 hover:shadow-xl'}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFile(e.dataTransfer.files[0]); }}
        onClick={() => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'video/*';
          input.onchange = (e) => handleFile(e.target.files[0]);
          input.click();
        }}
      >
        <div className="bg-indigo-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-200 group-hover:scale-110 transition-transform">
          <Upload className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-black tracking-tight text-slate-800">เลือกวิดีโอเพื่อเริ่มตัดต่อ</h2>
        <p className="text-slate-400 font-medium mt-2">ลากไฟล์ MP4 มาวาง หรือคลิกเพื่ออัปโหลด</p>
      </div>
    </div>
  );
}

export default UploadZone;
