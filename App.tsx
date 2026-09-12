import React, { useState } from 'react';
import JSZip from 'jszip';
import { UnlockStatus, ProcessedFile } from './types';

const DocUnlockIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
    <path d="M10 13v-1a2 2 0 1 1 4 0v1" />
    <rect x="8" y="13" width="8" height="6" rx="1" />
  </svg>
);

const App: React.FC = () => {
  const [status, setStatus] = useState<UnlockStatus>('idle');
  const [file, setFile] = useState<ProcessedFile | null>(null);
  const [unlockedBlob, setUnlockedBlob] = useState<Blob | null>(null);
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.endsWith('.docx')) {
      processFile(droppedFile);
    } else {
      setErrorMessage('Please upload a valid .docx file.');
      setStatus('error');
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const processFile = async (rawFile: File) => {
    setFile({
      name: rawFile.name,
      size: (rawFile.size / 1024).toFixed(1) + ' KB',
      type: 'Word Document'
    });
    setStatus('processing');
    setErrorMessage('');

    try {
      setStep('Reading document...');
      setProgress(20);

      const zip = new JSZip();
      const loadedZip = await zip.loadAsync(rawFile);

      setStep('Analyzing security...');
      setProgress(50);

      const settingsPath = 'word/settings.xml';
      const settingsFile = loadedZip.file(settingsPath);

      if (settingsFile) {
        setStep('Unlocking...');
        const settingsXml = await settingsFile.async('string');
        const updatedXml = settingsXml.replace(/<w:documentProtection[^>]*\/>/g, '');
        loadedZip.file(settingsPath, updatedXml);
      }

      setProgress(80);
      setStep('Finalizing...');

      const content = await loadedZip.generateAsync({ type: 'blob' });
      setUnlockedBlob(content);

      setProgress(100);
      setStep('Complete');
      setTimeout(() => setStatus('success'), 400);

    } catch (err) {
      console.error(err);
      setErrorMessage('Failed to process document. File might be fully encrypted.');
      setStatus('error');
    }
  };

  const downloadFile = () => {
    if (!unlockedBlob || !file) return;
    const url = URL.createObjectURL(unlockedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `unlocked_${file.name}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    setStatus('idle');
    setFile(null);
    setUnlockedBlob(null);
    setProgress(0);
    setStep('');
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-start py-10 px-4 bg-white text-black overflow-y-auto">
      <div className="w-full max-w-lg relative z-10 flex flex-col flex-1">
        <div className="text-center mb-10 shrink-0">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-black/5 border border-black/10 rounded-2xl mb-4 shadow-sm">
             <DocUnlockIcon className="w-7 h-7 text-black" />
          </div>
          <h1 className="text-3xl font-bold text-black tracking-tight mb-4 lowercase">docunlock</h1>
          <div className="max-w-md mx-auto space-y-2">
            <p className="text-black font-medium text-base leading-snug">
              Did a counterparty send you a Word document that has Track Changes locked and password protected?
            </p>
            <p className="text-black font-bold text-lg leading-snug">
              Let's unlock the document!
            </p>
          </div>
        </div>

        <div className="bg-white border border-black/10 rounded-3xl p-6 md:p-8 shadow-xl flex flex-col min-h-[360px]">
          {status === 'idle' && (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              className="flex-1 flex flex-col"
            >
              <input
                type="file"
                id="fileInput"
                className="hidden"
                accept=".docx"
                onChange={handleFileInput}
              />
              <label
                htmlFor="fileInput"
                className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-black/10 hover:border-black/30 rounded-2xl p-8 cursor-pointer transition-all bg-black/[0.01] hover:bg-black/[0.03] group text-center"
              >
                <div className="w-16 h-16 bg-black/5 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <DocUnlockIcon className="w-8 h-8 text-black" />
                </div>
                <h3 className="text-black font-bold mb-1 uppercase tracking-wider text-xs">Upload Document</h3>
                <p className="text-black/60 text-sm font-medium">drag and drop your .docx file</p>
              </label>
            </div>
          )}

          {status === 'processing' && (
            <div className="py-12 h-full flex flex-col justify-center text-center">
              <div className="flex items-center justify-between mb-4">
                <div className="text-left">
                  <div className="text-black text-sm font-bold truncate max-w-[180px]">{file?.name}</div>
                  <div className="text-black text-[10px] font-black uppercase tracking-[0.15em]">{step}</div>
                </div>
                <div className="text-black text-sm font-black">{progress}%</div>
              </div>
              <div className="h-2 w-full bg-black/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-black transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center py-4 flex flex-col flex-1">
              <div className="flex-1 flex flex-col justify-center items-center">
                <div className="w-20 h-20 bg-black/5 rounded-full flex items-center justify-center mb-6 border border-black/10">
                  <DocUnlockIcon className="w-10 h-10 text-black" />
                </div>
                <h2 className="text-2xl font-bold text-black mb-2">Unlocked</h2>
                <p className="text-black/60 text-sm mb-8 font-medium">
                  Restrictions removed. You can now redline freely.
                </p>
                <div className="w-full bg-black/[0.02] border border-black/5 rounded-xl p-4 flex items-center space-x-4 text-left">
                  <i className="fas fa-file-word text-black/40 text-2xl shrink-0"></i>
                  <div className="flex-1 min-w-0">
                    <div className="text-black text-sm font-bold truncate">{file?.name}</div>
                    <div className="text-black text-[10px] uppercase font-black">Ready for redlines</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-8">
                <button onClick={reset} className="bg-black/5 hover:bg-black/10 text-black font-bold py-3 rounded-xl border border-black/10 transition-all uppercase text-[10px] tracking-widest cursor-pointer">
                  New File
                </button>
                <button onClick={downloadFile} className="bg-black hover:bg-black/90 text-white font-bold py-3 rounded-xl shadow-md transition-all flex items-center justify-center uppercase text-[10px] tracking-widest cursor-pointer">
                  <i className="fas fa-download mr-2 text-white"></i> <span className="text-white">Download</span>
                </button>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center py-10 flex flex-col flex-1 justify-center">
              <div className="w-16 h-16 bg-black/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-black/10">
                <i className="fas fa-triangle-exclamation text-black text-2xl"></i>
              </div>
              <h2 className="text-xl font-bold text-black mb-2">Error</h2>
              <p className="text-black/60 text-sm mb-8 px-6 font-medium">{errorMessage}</p>
              <button onClick={reset} className="bg-black text-white font-bold py-3 px-8 rounded-xl mx-auto transition-all uppercase text-[10px] tracking-widest cursor-pointer">
                <span className="text-white">Try Again</span>
              </button>
            </div>
          )}
        </div>

        <div className="mt-8 flex justify-center space-x-8 text-[9px] text-black font-black tracking-[0.2em] uppercase opacity-40">
           <div className="flex items-center"><i className="fas fa-shield-halved mr-2"></i> Browser-Only</div>
           <div className="flex items-center"><i className="fas fa-bolt mr-2"></i> Instant</div>
        </div>
      </div>
    </div>
  );
};

export default App;
