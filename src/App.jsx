import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  deleteDoc 
} from 'firebase/firestore';
import { 
  Upload, 
  Code2, 
  ShieldCheck, 
  Clock, 
  Copy, 
  EyeOff, 
  Download, 
  FileText, 
  Lock, 
  Search, 
  RefreshCw, 
  AlertCircle, 
  Trash2,
  Share2,
  Smartphone,
  CheckCircle2,
  X,
  Zap,
  HardDrive,
  FileArchive,
  Layers,
  ArrowDownToLine,
  Check
} from 'lucide-react';

const firebaseConfig = typeof __firebase_config !== 'undefined' 
  ? JSON.parse(__firebase_config) 
  : {
      apiKey: "AIzaSyCampusDropPublicCloud2026SyncKey",
      authDomain: "campusdrop-sync.firebaseapp.com",
      projectId: "campusdrop-sync",
      storageBucket: "campusdrop-sync.appspot.com",
      messagingSenderId: "987654321012",
      appId: "1:987654321012:web:campusdrop2026"
    };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'campus-drop-v1';

// Max chunk size in characters for Base64 strings (~450KB per chunk to stay safely below Firestore 1MB limit)
const CHUNK_SIZE = 450 * 1024;
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB Limit

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const generate6DigitCode = () => {
  const num = Math.floor(100000 + Math.random() * 900000);
  return num.toString();
};

const formatDisplayCode = (raw) => {
  const clean = (raw || '').replace(/[^0-9]/g, '');
  if (clean.length <= 3) return clean;
  return `${clean.slice(0, 3)}-${clean.slice(3, 6)}`;
};

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('send'); // 'send' | 'receive' | 'history'
  const [isStealthMode, setIsStealthMode] = useState(false);
  
  // Send Tab States
  const [files, setFiles] = useState([]);
  const [codeSnippet, setCodeSnippet] = useState('');
  const [codeLanguage, setCodeLanguage] = useState('python');
  const [snippetTitle, setSnippetTitle] = useState('');
  const [duration, setDuration] = useState('1h'); 
  const [pinCode, setPinCode] = useState('');
  
  // Upload Progress & Instant Room Creation State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState({ stage: '', percent: 0, currentFile: '' });
  const [activeCreatedDrop, setActiveCreatedDrop] = useState(null);

  // Receive Tab States
  const [receiveCode, setReceiveCode] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState({ stage: '', percent: 0 });
  const [receivedDrop, setReceivedDrop] = useState(null);
  const [downloadedFilesMap, setDownloadedFilesMap] = useState({}); // { fileIdx: dataUrl }
  
  // PIN Modal
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pendingDropData, setPendingDropData] = useState(null);
  const [modalPinInput, setModalPinInput] = useState('');

  // Toast & History
  const [errorMessage, setErrorMessage] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [myHistory, setMyHistory] = useState([]);
  const [copiedLink, setCopiedLink] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else if (!auth.currentUser) {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.warn("Background Firebase authentication notice:", err);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('campusdrop_my_history');
      if (savedHistory) {
        setMyHistory(JSON.parse(savedHistory));
      }
    } catch (e) {
      console.error("Failed to load local history", e);
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsStealthMode((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const codeFromUrl = urlParams.get('code');

    if (codeFromUrl) {
      const cleanCode = codeFromUrl.replace(/[^0-9]/g, '');
      if (cleanCode.length === 6) {
        setActiveTab('receive');
        setReceiveCode(formatDisplayCode(cleanCode));
        fetchDropFromCloud(cleanCode);
      }
    }
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    processFiles(selectedFiles);
  };

  const handleDropFiles = (e) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files || []);
    processFiles(droppedFiles);
  };

  const processFiles = (fileList) => {
    setErrorMessage('');
    
    for (let file of fileList) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setErrorMessage(`File "${file.name}" (${formatBytes(file.size)}) melebihi batas maksimal 50MB.`);
        continue;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        setFiles((prev) => [
          ...prev,
          {
            id: Math.random().toString(36).substring(2, 9),
            name: file.name,
            size: file.size,
            type: file.type || 'application/octet-stream',
            dataUrl: event.target.result
          }
        ]);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeFile = (id) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const getExpirationMs = (durKey) => {
    switch (durKey) {
      case '15m': return 15 * 60 * 1000;
      case '1h': return 60 * 60 * 1000;
      case '6h': return 6 * 60 * 60 * 1000;
      case '24h': return 24 * 60 * 60 * 1000;
      default: return 60 * 60 * 1000;
    }
  };

  const getDurationLabel = (durKey) => {
    switch (durKey) {
      case '15m': return '15 Menit';
      case '1h': return '1 Jam';
      case '6h': return '6 Jam';
      case '24h': return '24 Jam';
      default: return '1 Jam';
    }
  };

  const handleCreateDrop = async () => {
    setErrorMessage('');

    if (!files.length && !codeSnippet.trim()) {
      setErrorMessage('Silakan unggah minimal 1 file atau tempelkan skrip kodingan!');
      return;
    }

    if (pinCode.trim() && (pinCode.trim().length !== 4 || isNaN(pinCode))) {
      setErrorMessage('PIN Keamanan harus berupa 4 digit angka!');
      return;
    }

    // 1. INSTANT ROOM & QR CODE GENERATION (Zero waiting)
    const cleanCode = generate6DigitCode();
    const formattedCode = formatDisplayCode(cleanCode);
    const createdAt = Date.now();
    const expiresAt = createdAt + getExpirationMs(duration);
    const shareUrl = `${window.location.origin}${window.location.pathname}?code=${cleanCode}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(shareUrl)}`;

    const fileMetaList = files.map((f) => {
      const rawBase64 = f.dataUrl;
      const totalFileChunks = Math.ceil(rawBase64.length / CHUNK_SIZE);
      return {
        name: f.name,
        size: f.size,
        type: f.type,
        totalChunks: totalFileChunks
      };
    });

    const dropPayload = {
      code: cleanCode,
      formattedCode,
      files: fileMetaList,
      codeSnippet: codeSnippet.trim(),
      codeLanguage,
      snippetTitle: snippetTitle.trim() || 'Skrip Kodingan CampusDrop',
      hasPin: Boolean(pinCode.trim()),
      pin: pinCode.trim(),
      createdAt,
      expiresAt,
      durationLabel: getDurationLabel(duration)
    };

    const createdObj = {
      ...dropPayload,
      shareUrl,
      qrCodeUrl,
      status: 'uploading' // 'uploading' | 'ready'
    };

    // Show room code & QR code INSTANTLY in the UI
    setActiveCreatedDrop(createdObj);

    // Update local history immediately
    const newHistoryItem = {
      code: cleanCode,
      formattedCode,
      createdAt,
      expiresAt,
      filesCount: files.length,
      hasSnippet: Boolean(codeSnippet.trim()),
      durationLabel: getDurationLabel(duration)
    };
    const updatedHistory = [newHistoryItem, ...myHistory.filter(h => h.code !== cleanCode)];
    setMyHistory(updatedHistory);
    localStorage.setItem('campusdrop_my_history', JSON.stringify(updatedHistory));

    showToast(`Ruang #${formattedCode} berhasil dibuat! Mengunggah ke Cloud...`);

    // 2. ASYNCHRONOUS CLOUD SYNC & CHUNKING IN BACKGROUND
    setIsUploading(true);
    setUploadStatus({ stage: 'Inisialisasi koneksi Cloud...', percent: 5, currentFile: '' });

    try {
      // Ensure background Auth if not already signed in
      if (!auth.currentUser) {
        await signInAnonymously(auth);
      }

      let totalChunksCount = 0;
      let processedChunksCount = 0;

      files.forEach((f) => {
        totalChunksCount += Math.ceil(f.dataUrl.length / CHUNK_SIZE);
      });

      // Upload each file in client-side chunks
      for (let fIdx = 0; fIdx < files.length; fIdx++) {
        const fileObj = files[fIdx];
        const rawBase64 = fileObj.dataUrl;
        const totalFileChunks = Math.ceil(rawBase64.length / CHUNK_SIZE);

        for (let cIdx = 0; cIdx < totalFileChunks; cIdx++) {
          const start = cIdx * CHUNK_SIZE;
          const end = Math.min(start + CHUNK_SIZE, rawBase64.length);
          const chunkStr = rawBase64.substring(start, end);

          const chunkDocId = `${cleanCode}_${fIdx}_${cIdx}`;
          const chunkDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'drop_chunks', chunkDocId);

          await setDoc(chunkDocRef, {
            roomCode: cleanCode,
            fileIndex: fIdx,
            chunkIndex: cIdx,
            data: chunkStr,
            createdAt
          });

          processedChunksCount++;
          const percent = totalChunksCount > 0 ? Math.round((processedChunksCount / totalChunksCount) * 90) : 90;
          setUploadStatus({
            stage: `Mengunggah ${fileObj.name} (${cIdx + 1}/${totalFileChunks})`,
            percent,
            currentFile: fileObj.name
          });
        }
      }

      // Upload main drop document
      setUploadStatus({ stage: 'Finalisasi ruang Cloud...', percent: 95, currentFile: '' });
      const dropDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'drops', cleanCode);
      await setDoc(dropDocRef, dropPayload);

      setActiveCreatedDrop((prev) => prev ? { ...prev, status: 'ready' } : null);
      showToast(`Ruang #${formattedCode} fully tersinkronisasi di Cloud!`);
    } catch (err) {
      console.error("Error uploading drop to Cloud:", err);
      setErrorMessage(`Proses Cloud Sync terhambat: ${err.message}. Layar tetap menampilkan kode/QR lokal.`);
    } finally {
      setIsUploading(false);
      setUploadStatus({ stage: '', percent: 0, currentFile: '' });
    }
  };

  const fetchDropFromCloud = async (rawCode, enteredPin = '') => {
    setErrorMessage('');

    const cleanCode = (rawCode || '').replace(/[^0-9]/g, '');
    if (cleanCode.length !== 6) {
      setErrorMessage('Kode transfer harus berupa 6-digit angka valid (contoh: 474-113)!');
      return;
    }

    setIsFetching(true);
    setDownloadStatus({ stage: 'Mencari ruang di Cloud...', percent: 10 });

    try {
      if (!auth.currentUser) {
        await signInAnonymously(auth);
      }

      const dropDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'drops', cleanCode);
      const dropSnap = await getDoc(dropDocRef);

      if (!dropSnap.exists()) {
        setErrorMessage('Kode ruang tidak ditemukan di Cloud. Pastikan kode benar atau ruang belum dibuat.');
        setIsFetching(false);
        return;
      }

      const dropData = dropSnap.data();
      const now = Date.now();

      if (dropData.expiresAt && now > dropData.expiresAt) {
        setErrorMessage('Kode ruang ini telah kadaluarsa.');
        try { await deleteDoc(dropDocRef); } catch (e) {}
        setIsFetching(false);
        return;
      }

      // Validate PIN
      if (dropData.hasPin && dropData.pin) {
        const pinToValidate = enteredPin || modalPinInput;

        if (!pinToValidate) {
          setPendingDropData(dropData);
          setPinModalOpen(true);
          setIsFetching(false);
          return;
        }

        if (pinToValidate.trim() !== dropData.pin.trim()) {
          setErrorMessage('PIN Keamanan salah! Silakan periksa kembali 4-digit PIN.');
          setPinModalOpen(true);
          setIsFetching(false);
          return;
        }
      }

      setReceivedDrop(dropData);
      setPinModalOpen(false);
      setPendingDropData(null);
      setModalPinInput('');

      // Auto download files chunk by chunk
      if (dropData.files && dropData.files.length > 0) {
        const reconstructedMap = {};

        for (let fIdx = 0; fIdx < dropData.files.length; fIdx++) {
          const fileMeta = dropData.files[fIdx];
          const chunksArr = [];

          for (let cIdx = 0; cIdx < fileMeta.totalChunks; cIdx++) {
            setDownloadStatus({
              stage: `Mengunduh ${fileMeta.name} (Chunk ${cIdx + 1}/${fileMeta.totalChunks})`,
              percent: Math.round(((cIdx + 1) / fileMeta.totalChunks) * 100)
            });

            const chunkDocId = `${cleanCode}_${fIdx}_${cIdx}`;
            const chunkDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'drop_chunks', chunkDocId);
            const chunkSnap = await getDoc(chunkDocRef);

            if (chunkSnap.exists()) {
              chunksArr.push(chunkSnap.data().data);
            }
          }

          reconstructedMap[fIdx] = chunksArr.join('');
        }

        setDownloadedFilesMap(reconstructedMap);
      }

      showToast('Berhasil terhubung & mengunduh berkas dari Cloud!');
    } catch (err) {
      console.error("Error fetching chunked drop:", err);
      setErrorMessage(`Gagal mengambil berkas dari Cloud: ${err.message}`);
    } finally {
      setIsFetching(false);
      setDownloadStatus({ stage: '', percent: 0 });
    }
  };

  const handleManualDelete = async (cleanCode) => {
    if (!cleanCode) return;
    try {
      if (auth.currentUser) {
        const dropDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'drops', cleanCode);
        await deleteDoc(dropDocRef);
      }
      setReceivedDrop(null);
      setActiveCreatedDrop(null);
      showToast('Ruang CampusDrop berhasil dihapus permanen.');
    } catch (e) {
      console.error("Error deleting drop:", e);
    }
  };

  const handleModalPinSubmit = (e) => {
    e.preventDefault();
    if (!pendingDropData) return;
    fetchDropFromCloud(pendingDropData.code, modalPinInput);
  };

  const handleCopyText = (text, label) => {
    navigator.clipboard.writeText(text);
    if (label === 'Link Akses Direct') {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
    showToast(`${label} berhasil disalin ke clipboard!`);
  };

  const handleDownloadFile = (fileName, dataUrl) => {
    if (!dataUrl) return;
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetSendForm = () => {
    setFiles([]);
    setCodeSnippet('');
    setSnippetTitle('');
    setPinCode('');
    setActiveCreatedDrop(null);
  };

  if (isStealthMode) {
    return (
      <div className="fixed inset-0 z-50 bg-white text-slate-900 font-serif p-6 md:p-16 overflow-y-auto select-text">
        <div className="max-w-4xl mx-auto space-y-6 text-sm md:text-base leading-relaxed">
          <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
            <div>
              <p className="text-xs font-sans tracking-widest text-slate-500 uppercase font-semibold">
                Jurnal Teknologi Informasi & Komputer • Vol. 14, No. 3
              </p>
              <h1 className="text-2xl md:text-3xl font-bold font-serif text-slate-900 mt-2">
                Analisis Performa Fragmentasi Berkas Base64 pada Arsitektur Cloud Peer-Sync Kampus
              </h1>
            </div>
            <button 
              onClick={() => setIsStealthMode(false)}
              className="font-sans text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded border border-slate-300 font-semibold transition shrink-0"
            >
              Kembali [ESC]
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <p className="font-bold text-slate-800">Laboratorium Komputasi Terdistribusi</p>
              <p className="text-slate-600">Fakultas Ilmu Komputer & Teknologi Informasi</p>
            </div>
            <div>
              <p className="font-bold text-slate-800">Ringkasan Penelitian</p>
              <p className="text-slate-600 italic">
                Studi ini mengevaluasi pengiriman payload hingga 50MB dengan chunking asynchronous tanpa hambatan blocking auth state.
              </p>
            </div>
          </div>

          <section className="space-y-3 font-serif">
            <h2 className="text-lg font-bold border-b border-slate-200 pb-1 font-sans">1. Pendahuluan</h2>
            <p className="text-justify">
              Eksperimen komputasi awan membutuhkan efisiensi transmisi tinggi tanpa mengandalkan perangkat penyimpanan eksternal fisik. Metode pembagian chunking Base64 terbukti mengurangi beban latensi hingga 40% pada jaringan LAN kampus.
            </p>
          </section>

          <section className="space-y-3 font-serif">
            <h2 className="text-lg font-bold border-b border-slate-200 pb-1 font-sans">2. Metodologi Chunking</h2>
            <p className="text-justify">
              Segmentasi berkas dilakukan secara sekuensial dengan buffer 450KB per item untuk menjaga konsistensi transaksi dokumen NoSQL.
            </p>
          </section>

          <div className="text-center pt-8 text-xs font-sans text-slate-400 border-t border-slate-200">
            Tekan <span className="font-mono bg-slate-100 border px-1.5 py-0.5 rounded text-slate-700">ESC</span> untuk mengakhiri mode akademik.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-indigo-500 selection:text-white pb-16">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 border border-slate-800 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <header className="bg-white/90 border-b border-slate-200/80 sticky top-0 z-30 shadow-sm backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold shadow-md shadow-slate-900/10">
              <Zap className="w-5 h-5 fill-current text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-slate-900">CampusDrop</span>
                <span className="bg-indigo-50 text-indigo-700 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-indigo-200/60 flex items-center space-x-1">
                  <HardDrive className="w-3 h-3 text-indigo-500" />
                  <span>Instant 50MB Sync</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">Transfer Berkas Besar & Skrip Kodingan Instan Tanpa Delay</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsStealthMode(true)}
              className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 transition"
              title="Tekan ESC untuk menyamarkan layar ke makalah akademik"
            >
              <EyeOff className="w-3.5 h-3.5 text-slate-500" />
              <span>Nyamar</span>
              <kbd className="bg-white px-1.5 py-0.5 rounded text-[10px] text-slate-500 border border-slate-200 font-mono">ESC</kbd>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 mt-8">
        
        {/* Navigation Tabs */}
        <div className="flex bg-slate-200/60 p-1 rounded-2xl max-w-md mx-auto mb-8 border border-slate-200">
          <button
            onClick={() => { setActiveTab('send'); setErrorMessage(''); }}
            className={`flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition ${
              activeTab === 'send' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Kirim Berkas</span>
          </button>

          <button
            onClick={() => { setActiveTab('receive'); setErrorMessage(''); }}
            className={`flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition ${
              activeTab === 'receive' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Terima Drop</span>
          </button>

          <button
            onClick={() => { setActiveTab('history'); setErrorMessage(''); }}
            className={`flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition ${
              activeTab === 'history' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Riwayat ({myHistory.length})</span>
          </button>
        </div>

        {/* Global Error Notice */}
        {errorMessage && (
          <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3.5 rounded-2xl flex items-start space-x-3 text-sm animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-rose-900">Pemberitahuan</p>
              <p className="text-rose-700 text-xs sm:text-sm mt-0.5 leading-relaxed">{errorMessage}</p>
            </div>
            <button onClick={() => setErrorMessage('')} className="text-rose-400 hover:text-rose-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* TAB 1: KIRIM BERKAS & KODE */}
        {activeTab === 'send' && (
          <div className="space-y-6">
            
            {!activeCreatedDrop ? (
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
                
                <div className="text-center max-w-lg mx-auto space-y-1">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Kirim Berkas (S/d 50MB) & Kode</h2>
                  <p className="text-slate-500 text-xs sm:text-sm">
                    Kode & QR Code dibuat secara <span className="font-semibold text-indigo-600">INSTAN</span> tanpa hambatan login.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  
                  {/* File Upload Area */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
                        <FileText className="w-4 h-4 text-indigo-600" />
                        <span>1. Unggah File (Maks. 50MB)</span>
                      </label>
                      <span className="text-[11px] text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded-md">ZIP, PDF, DOC, IMG</span>
                    </div>

                    <div 
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handleDropFiles}
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50/70 hover:bg-indigo-50/30 transition rounded-2xl p-6 text-center cursor-pointer flex flex-col items-center justify-center min-h-[190px] group"
                    >
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileSelect} 
                        multiple 
                        className="hidden" 
                      />
                      <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-slate-200 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition mb-3">
                        <Upload className="w-6 h-6" />
                      </div>
                      <p className="text-xs font-semibold text-slate-700">
                        Tarik file ke sini, atau <span className="text-indigo-600 underline">pilih file</span>
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">Mendukung file besar hingga 50MB</p>
                    </div>

                    {files.length > 0 && (
                      <div className="space-y-2 pt-1">
                        {files.map((f) => (
                          <div key={f.id} className="flex items-center justify-between bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs">
                            <div className="flex items-center space-x-2 truncate">
                              <FileArchive className="w-4 h-4 text-indigo-500 shrink-0" />
                              <span className="font-medium text-slate-800 truncate">{f.name}</span>
                              <span className="text-[10px] text-slate-400 font-mono">({formatBytes(f.size)})</span>
                            </div>
                            <button 
                              onClick={(e) => { e.stopPropagation(); removeFile(f.id); }}
                              className="text-slate-400 hover:text-rose-500 p-1"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Code Editor Area */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
                        <Code2 className="w-4 h-4 text-indigo-600" />
                        <span>2. Tempel Kode / Catatan</span>
                      </label>
                      <select 
                        value={codeLanguage} 
                        onChange={(e) => setCodeLanguage(e.target.value)}
                        className="text-xs bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 font-mono text-slate-700 font-semibold focus:outline-none"
                      >
                        <option value="python">Python (.py)</option>
                        <option value="javascript">JavaScript / React</option>
                        <option value="cpp">C++ / C</option>
                        <option value="java">Java</option>
                        <option value="html">HTML / CSS</option>
                        <option value="plaintext">Teks Biasa</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <input 
                        type="text" 
                        placeholder="Judul / Nama File (Opsional)" 
                        value={snippetTitle}
                        onChange={(e) => setSnippetTitle(e.target.value)}
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                      <textarea
                        rows={6}
                        placeholder="Tempelkan kode program, sintaks C++, atau catatan ringkas di sini..."
                        value={codeSnippet}
                        onChange={(e) => setCodeSnippet(e.target.value)}
                        className="w-full text-xs font-mono bg-slate-900 text-slate-100 border border-slate-800 rounded-2xl p-3.5 leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500/30 placeholder:text-slate-500"
                      />
                    </div>
                  </div>

                </div>

                {/* Expiration & PIN */}
                <div className="border-t border-slate-100 pt-6">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center space-x-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Pengaturan Keamanan & Kadaluarsa</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-slate-600 font-medium block mb-1.5">Batas Waktu Hapus Otomatis</label>
                      <select
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      >
                        <option value="15m">15 Menit (Praktikum Cepat)</option>
                        <option value="1h">1 Jam (Rekomendasi Kampus)</option>
                        <option value="6h">6 Jam (Tugas Seharian)</option>
                        <option value="24h">24 Jam (Maksimal)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-slate-600 font-medium block mb-1.5">
                        PIN Keamanan 4-Digit <span className="text-slate-400 font-normal">(Opsional)</span>
                      </label>
                      <input 
                        type="password"
                        maxLength={4}
                        placeholder="Tanpa PIN tambahan"
                        value={pinCode}
                        onChange={(e) => setPinCode(e.target.value.replace(/[^0-9]/g, ''))}
                        className="w-full text-xs font-mono tracking-widest bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleCreateDrop}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg shadow-slate-900/10 hover:shadow-slate-900/20 transition flex items-center justify-center space-x-2 text-sm"
                >
                  <Zap className="w-4 h-4 text-indigo-400 fill-current animate-pulse" />
                  <span>Buat Ruang Instan (Dapatkan Kode & QR Sekarang)</span>
                </button>

              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6 animate-in fade-in">
                
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center space-x-2">
                    <span className={`w-3 h-3 rounded-full ${isUploading ? 'bg-amber-500 animate-ping' : 'bg-emerald-500 animate-pulse'}`}></span>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      isUploading 
                        ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {isUploading ? 'Proses Sinkronisasi Cloud...' : 'Tersimpan & Siap di Cloud'}
                    </span>
                  </div>
                  <button 
                    onClick={resetSendForm}
                    className="text-xs text-slate-500 hover:text-slate-800 underline font-medium"
                  >
                    + Buat Drop Baru
                  </button>
                </div>

                {isUploading && (
                  <div className="bg-indigo-50/80 border border-indigo-200/80 p-4 rounded-2xl space-y-2 animate-in fade-in">
                    <div className="flex justify-between text-xs font-semibold text-indigo-900">
                      <span className="flex items-center space-x-2">
                        <Layers className="w-4 h-4 text-indigo-600 animate-spin" />
                        <span>{uploadStatus.stage || 'Memproses berkas...'}</span>
                      </span>
                      <span>{uploadStatus.percent}%</span>
                    </div>
                    <div className="w-full bg-indigo-200/60 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${uploadStatus.percent}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                  
                  <div className="md:col-span-7 space-y-4">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Kode Transfer 6-Digit</p>
                      <div className="mt-2 flex items-center space-x-3">
                        <div className="bg-slate-900 text-white font-mono font-extrabold text-3xl sm:text-4xl tracking-widest px-6 py-4 rounded-2xl shadow-inner">
                          {activeCreatedDrop.formattedCode}
                        </div>
                        <button
                          onClick={() => handleCopyText(activeCreatedDrop.code, 'Kode 6-digit')}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-3.5 rounded-2xl border border-slate-200 transition"
                          title="Salin Kode"
                        >
                          <Copy className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Masa Aktif:</span>
                        <span className="font-semibold text-slate-800">{activeCreatedDrop.durationLabel}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Proteksi PIN:</span>
                        <span className="font-semibold text-slate-800">{activeCreatedDrop.hasPin ? 'Aktif (4-Digit)' : 'Tanpa PIN'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Lampiran:</span>
                        <span className="font-semibold text-slate-800">
                          {activeCreatedDrop.files.length} File • {activeCreatedDrop.codeSnippet ? '1 Skrip Kode' : 'Tanpa Kode'}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 flex flex-wrap gap-2">
                      <button
                        onClick={() => handleCopyText(activeCreatedDrop.shareUrl, 'Link Akses Direct')}
                        className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center space-x-2 transition"
                      >
                        {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                        <span>{copiedLink ? 'Tersalin!' : 'Salin Link Auto-Fill'}</span>
                      </button>

                      <button
                        onClick={() => handleManualDelete(activeCreatedDrop.code)}
                        className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold px-3 py-2.5 rounded-xl text-xs flex items-center space-x-1 border border-rose-200/80 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>

                  {/* QR Code display */}
                  <div className="md:col-span-5 flex flex-col items-center justify-center bg-slate-50 p-5 rounded-3xl border border-slate-200">
                    <img 
                      src={activeCreatedDrop.qrCodeUrl} 
                      alt="QR Code" 
                      className="w-44 h-44 rounded-2xl border-4 border-white shadow-md bg-white p-2"
                    />
                    <div className="mt-3 text-center">
                      <p className="text-xs font-bold text-slate-800 flex items-center justify-center space-x-1">
                        <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Scan Kamera HP</span>
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Otomatis membuka room & mengunduh berkas!</p>
                    </div>
                  </div>

                </div>

              </div>
            )}

          </div>
        )}

        {/* TAB 2: TERIMA DROP */}
        {activeTab === 'receive' && (
          <div className="space-y-6">
            
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
              
              <div className="text-center max-w-md mx-auto space-y-1">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Terima Berkas dari Cloud</h2>
                <p className="text-slate-500 text-xs sm:text-sm">
                  Masukkan 6-digit kode room untuk mendownload file & skrip kodingan.
                </p>
              </div>

              <div className="max-w-md mx-auto space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2 text-center">
                    Kode Transfer 6-Digit
                  </label>
                  <input 
                    type="text"
                    maxLength={7}
                    placeholder="474-113"
                    value={receiveCode}
                    onChange={(e) => setReceiveCode(formatDisplayCode(e.target.value))}
                    className="w-full text-center text-3xl font-mono font-extrabold tracking-widest bg-slate-50 border border-slate-300 rounded-2xl py-4 px-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 uppercase"
                  />
                </div>

                {isFetching && downloadStatus.percent > 0 && (
                  <div className="bg-indigo-50 border border-indigo-200 p-3.5 rounded-2xl space-y-1.5 animate-in fade-in">
                    <div className="flex justify-between text-xs font-semibold text-indigo-900">
                      <span className="flex items-center space-x-1.5">
                        <ArrowDownToLine className="w-4 h-4 text-indigo-600 animate-bounce" />
                        <span>{downloadStatus.stage}</span>
                      </span>
                      <span>{downloadStatus.percent}%</span>
                    </div>
                    <div className="w-full bg-indigo-200/60 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${downloadStatus.percent}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => fetchDropFromCloud(receiveCode)}
                  disabled={isFetching || !receiveCode.trim()}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg shadow-slate-900/10 hover:shadow-slate-900/20 transition flex items-center justify-center space-x-2 text-sm disabled:opacity-50"
                >
                  {isFetching ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                      <span>Mengunduh Chunks dari Cloud...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 text-indigo-400" />
                      <span>Akses & Ambil Drop</span>
                    </>
                  )}
                </button>
              </div>

              {/* Fetched Result View */}
              {receivedDrop && (
                <div className="border-t border-slate-200/80 pt-6 mt-6 space-y-6 animate-in fade-in">
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-full">
                        Room #{receivedDrop.formattedCode}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-2">Konten Ditemukan</h3>
                    </div>
                    
                    <button
                      onClick={() => handleManualDelete(receivedDrop.code)}
                      className="text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center space-x-1 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus Sekarang</span>
                    </button>
                  </div>

                  {/* Files List */}
                  {receivedDrop.files && receivedDrop.files.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Berkas Terlampir ({receivedDrop.files.length})</p>
                      <div className="grid grid-cols-1 gap-3">
                        {receivedDrop.files.map((fileMeta, fIdx) => {
                          const fileDataUrl = downloadedFilesMap[fIdx];
                          return (
                            <div key={fIdx} className="flex items-center justify-between bg-slate-50 border border-slate-200 p-3.5 rounded-2xl">
                              <div className="flex items-center space-x-3 truncate">
                                <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-indigo-600 shrink-0 shadow-sm">
                                  <FileText className="w-5 h-5" />
                                </div>
                                <div className="truncate">
                                  <p className="text-xs font-bold text-slate-800 truncate">{fileMeta.name}</p>
                                  <p className="text-[10px] text-slate-400 font-mono">
                                    {formatBytes(fileMeta.size)} • {fileMeta.totalChunks} Chunks
                                  </p>
                                </div>
                              </div>

                              <button
                                onClick={() => handleDownloadFile(fileMeta.name, fileDataUrl)}
                                disabled={!fileDataUrl}
                                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-semibold text-xs px-3.5 py-2 rounded-xl flex items-center space-x-1.5 transition shrink-0"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>{fileDataUrl ? 'Unduh File' : 'Menyiapkan...'}</span>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Code Snippet */}
                  {receivedDrop.codeSnippet && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1">
                          <Code2 className="w-4 h-4 text-indigo-600" />
                          <span>{receivedDrop.snippetTitle || 'Skrip Kode Program'}</span>
                        </p>

                        <button
                          onClick={() => handleCopyText(receivedDrop.codeSnippet, 'Kode Program')}
                          className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center space-x-1 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200/60"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Salin Kode</span>
                        </button>
                      </div>

                      <pre className="bg-slate-900 text-slate-100 font-mono text-xs p-4 rounded-2xl overflow-x-auto max-h-80 leading-relaxed">
                        <code>{receivedDrop.codeSnippet}</code>
                      </pre>
                    </div>
                  )}

                </div>
              )}

            </div>

          </div>
        )}

        {/* TAB 3: RIWAYAT DROP */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Riwayat Room Drop Saya</h2>
                <p className="text-xs text-slate-500">Daftar kode transfer yang pernah dibuat dari browser ini.</p>
              </div>

              {myHistory.length > 0 && (
                <button
                  onClick={() => {
                    setMyHistory([]);
                    localStorage.removeItem('campusdrop_my_history');
                    showToast('Riwayat dibersihkan.');
                  }}
                  className="text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center space-x-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Riwayat</span>
                </button>
              )}
            </div>

            {myHistory.length === 0 ? (
              <div className="text-center py-12 text-slate-400 space-y-2">
                <Clock className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-xs font-semibold">Belum ada riwayat drop.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myHistory.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-slate-50 border border-slate-200 p-4 rounded-2xl">
                    <div className="flex items-center space-x-4">
                      <div className="bg-slate-900 text-white font-mono font-bold text-sm px-3 py-2 rounded-xl">
                        {item.formattedCode}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">
                          {item.filesCount} File • {item.hasSnippet ? 'Skrip Kode' : 'Tanpa Kode'}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Dibuat {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Durasi {item.durationLabel}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setActiveTab('receive');
                        setReceiveCode(item.formattedCode);
                        fetchDropFromCloud(item.code);
                      }}
                      className="bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 text-xs font-semibold px-3 py-2 rounded-xl shadow-sm transition"
                    >
                      Buka Kembali
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>

      {/* PIN Security Modal */}
      {pinModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95">
            
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mx-auto">
              <Lock className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">Diproteksi PIN Keamanan</h3>
              <p className="text-xs text-slate-500">
                Pengirim memasang PIN 4-digit untuk mengakses ruang drop ini.
              </p>
            </div>

            <form onSubmit={handleModalPinSubmit} className="space-y-4">
              <div>
                <input 
                  type="password"
                  maxLength={4}
                  autoFocus
                  placeholder="Masukkan 4-Digit PIN"
                  value={modalPinInput}
                  onChange={(e) => setModalPinInput(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full text-center text-2xl font-mono tracking-widest bg-slate-50 border border-slate-300 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>

              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => { setPinModalOpen(false); setPendingDropData(null); }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs py-3 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={modalPinInput.length !== 4}
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-3 rounded-xl transition disabled:opacity-50"
                >
                  Buka Akses
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-16 text-center text-xs text-slate-400 space-y-1">
        <p>CampusDrop — Solusi terenkripsi & privat untuk berbagi berkas laboratorium kampus.</p>
        <p className="text-[11px] text-slate-400">
          Mendukung file hingga 50MB dengan Firestore Chunking. Tekan <kbd className="bg-slate-200 text-slate-700 px-1 rounded font-mono">ESC</kbd> untuk modus penyamaran.
        </p>
      </footer>

    </div>
  );
}