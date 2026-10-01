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
  onSnapshot, 
  deleteDoc 
} from 'firebase/firestore';
import { 
  Upload, 
  Download, 
  Copy, 
  Check, 
  Lock, 
  Shield, 
  EyeOff, 
  QrCode, 
  FileText, 
  Code, 
  Clock, 
  Trash2, 
  RefreshCw, 
  Share2, 
  Terminal, 
  File, 
  Zap, 
  CheckCircle2, 
  FileCode, 
  FileArchive, 
  Image as ImageIcon,
  ChevronRight,
  X,
  BookOpen,
  AlertCircle,
  Smartphone,
  Info
} from 'lucide-react';

let app, auth, db, appId;
try {
  const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : null;
  if (firebaseConfig) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  }
  appId = typeof __app_id !== 'undefined' ? __app_id : 'campusdrop-app';
} catch (err) {
  console.warn("Firebase safe mode active:", err);
}

// Generate 6-digit room code with standard hyphen format (e.g. 482-910)
const generate6DigitCode = () => {
  const num = Math.floor(100000 + Math.random() * 900000).toString();
  return `${num.slice(0, 3)}-${num.slice(3, 6)}`;
};

// Human readable file size formatter
const formatBytes = (bytes, decimals = 1) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const getLanguageExtension = (lang) => {
  const map = {
    python: 'py',
    cpp: 'cpp',
    javascript: 'js',
    java: 'java',
    html: 'html',
    sql: 'sql',
    text: 'txt'
  };
  return map[lang.toLowerCase()] || 'txt';
};

const SyntaxHighlightLight = ({ code, language }) => {
  if (!code) return null;
  const lines = code.split('\n');

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto p-4 font-mono text-slate-100 text-xs sm:text-sm leading-relaxed shadow-inner">
      <div className="table w-full border-collapse">
        {lines.map((line, idx) => (
          <div key={idx} className="table-row hover:bg-slate-800/60 transition-colors">
            <span className="table-cell text-right pr-4 select-none text-slate-500 border-r border-slate-800 w-10 text-xs">
              {idx + 1}
            </span>
            <span className="table-cell pl-4 whitespace-pre wrap-break-word text-slate-200">
              {line || ' '}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const DynamicQRCode = ({ value }) => {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(value)}&color=0f172a&bgcolor=ffffff&margin=1`;
  
  return (
    <div className="flex flex-col items-center justify-center p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs">
      <div className="bg-white p-2 rounded-xl border border-slate-200">
        <img 
          src={qrUrl} 
          alt="QR Code CampusDrop" 
          className="w-32 h-32 sm:w-36 sm:h-36 rounded object-contain"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "https://via.placeholder.com/160?text=Scan+QR";
          }}
        />
      </div>
      <p className="mt-2 text-xs font-medium text-slate-600 flex items-center gap-1">
        <Smartphone className="w-3.5 h-3.5 text-indigo-600" /> Scan via Kamera HP
      </p>
    </div>
  );
};

const AcademicStealthOverlay = ({ active, onDismiss }) => {
  if (!active) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-white text-slate-800 font-sans overflow-y-auto p-6 sm:p-12 select-none"
      onClick={onDismiss}
    >
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex justify-between items-center border-b border-slate-200 pb-4 text-xs text-slate-500 font-mono">
          <span>Jurnal Riset Teknologi Informasi & Algoritma • Vol. 14 No. 2</span>
          <button 
            onClick={onDismiss}
            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-sans text-xs transition border border-slate-300"
          >
            Tekan [ESC] atau Klik untuk Kembali
          </button>
        </div>

        <div className="space-y-3">
          <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-semibold uppercase tracking-wider">
            Makalah Penelitian Praktikum
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-snug">
            Analisis Kompleksitas Waktu dan Efisiensi Memori pada Struktur Data Binary Search Tree (BST)
          </h1>
          <p className="text-xs text-slate-500 italic">
            Departemen Ilmu Komputer & Teknik Informatika — Laboratorium Komputasi Lanjut
          </p>
        </div>

        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs text-slate-600 leading-relaxed">
          <h2 className="font-bold text-slate-900 uppercase tracking-wide">Abstrak</h2>
          <p>
            Penelitian ini membahas perbandingan performa pencarian data antara algoritma Linear Search, Binary Search, dan Struktur Data Tree terdistribusi pada memori utama (RAM). Pengujian dilakukan pada dataset berukuran N = 10^6 elemen terurut.
          </p>
        </div>

        <div className="space-y-4 text-sm text-slate-700 leading-relaxed">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-200 pb-1">1. Pendahuluan & Metodologi</h2>
          <p>
            Dalam pengembangan perangkat lunak modern, efisiensi akses memori menjadi faktor krusial saat menangani eksekusi kode terdistribusi. Pemilihan struktur data yang tepat secara langsung mempengaruhi alokasi ruang stack dan heap pada kompilator.
          </p>

          <div className="bg-slate-900 text-slate-200 p-4 rounded-xl font-mono text-xs space-y-1">
            <p className="text-slate-400">// Implementasi C++ Rekursif BST Search</p>
            <p><span className="text-indigo-400">Node</span>* <span className="text-emerald-400">search</span>(Node* root, <span className="text-amber-300">int</span> key) &#123;</p>
            <p className="pl-4"><span className="text-indigo-400">if</span> (root == <span className="text-rose-400">NULL</span> || root-&gt;key == key) <span className="text-indigo-400">return</span> root;</p>
            <p className="pl-4"><span className="text-indigo-400">if</span> (root-&gt;key &lt; key) <span className="text-indigo-400">return</span> search(root-&gt;right, key);</p>
            <p className="pl-4"><span className="text-indigo-400">return</span> search(root-&gt;left, key);</p>
            <p>&#125;</p>
          </div>

          <p className="text-xs text-slate-500 italic border-l-2 border-slate-300 pl-3">
            Catatan Dosen Pengampu: Selalu pastikan memori yang dialokasikan dengan kata kunci `new` didealokasikan kembali menggunakan `delete` untuk mencegah memory leak.
          </p>
        </div>

        <div className="pt-6 border-t border-slate-200 text-center text-xs text-slate-400 font-mono">
          [Mode Penyamaran Aktif] Klik di mana saja untuk melanjutkan sesi kerja kamu.
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('send'); // 'send', 'receive', 'history'
  const [stealthMode, setStealthMode] = useState(false);
  const [toast, setToast] = useState(null);

  // Form Send State
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [codeText, setCodeText] = useState('');
  const [codeTitle, setCodeTitle] = useState('');
  const [codeLanguage, setCodeLanguage] = useState('python');
  const [expireHours, setExpireHours] = useState('1'); // '0.25', '1', '24', 'self'
  const [pinProtection, setPinProtection] = useState(false);
  const [pinCode, setPinCode] = useState('');
  const [isCreatingDrop, setIsCreatingDrop] = useState(false);

  // Active Drop Room State
  const [currentRoom, setCurrentRoom] = useState(null);
  const [pinModalRequired, setPinModalRequired] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState('');

  // Receive Tab Input
  const [inputRoomCode, setInputRoomCode] = useState('');
  const [isSearchingRoom, setIsSearchingRoom] = useState(false);

  // Recent History Local Storage
  const [recentHistory, setRecentHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('campusdrop_history_v2');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3200);
  };

  // Stealth Hotkey (Escape)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setStealthMode((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const addRoomToHistory = (roomData) => {
    setRecentHistory((prev) => {
      const filtered = prev.filter((r) => r.code !== roomData.code);
      const updated = [
        {
          code: roomData.code,
          createdAt: Date.now(),
          filesCount: roomData.files ? roomData.files.length : 0,
          hasCode: !!roomData.codeSnippet,
          expiresAt: roomData.expiresAt
        },
        ...filtered
      ].slice(0, 8);
      
      try {
        localStorage.setItem('campusdrop_history_v2', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  // Auth Initialization
  useEffect(() => {
    if (!auth) return;
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (e) {
        try { await signInAnonymously(auth); } catch(err){}
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  // Room Listener
  useEffect(() => {
    if (!currentRoom || !currentRoom.code || !db || !user) return;

    const rawCode = currentRoom.code.replace('-', '');
    const roomDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'campusdrop_rooms', rawCode);

    const unsubscribe = onSnapshot(
      roomDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.expiresAt && Date.now() > data.expiresAt) {
            setCurrentRoom(null);
            showToast('Sesi transfer telah kadaluarsa dan dihapus.', 'warning');
            return;
          }
          setCurrentRoom(data);
        } else if (currentRoom.isFromFirestore) {
          setCurrentRoom(null);
          showToast('Sesi transfer telah dihapus/self-destruct.', 'warning');
        }
      },
      (error) => {
        console.warn("Firestore snapshot info:", error);
      }
    );

    return () => unsubscribe();
  }, [currentRoom?.code, user]);

  const processSelectedFiles = (fileList) => {
    const newFiles = Array.from(fileList);
    
    newFiles.forEach((file) => {
      if (file.size > 50 * 1024 * 1024) {
        showToast(`Ukuran file "${file.name}" melebihi batas 50MB.`, 'error');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const fileObj = {
          id: Math.random().toString(36).substring(2, 9),
          name: file.name,
          size: file.size,
          type: file.type || 'application/octet-stream',
          dataUrl: event.target.result,
          uploadedAt: Date.now()
        };

        setUploadedFiles((prev) => [...prev, fileObj]);
        showToast(`Berhasil menambahkan "${file.name}"`, 'success');
      };
      reader.readAsDataURL(file);
    });
  };

  const removeUploadedFile = (fileId) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const handleCreateDrop = async () => {
    if (uploadedFiles.length === 0 && !codeText.trim()) {
      showToast('Pilih minimal satu file atau tempelkan skrip kode.', 'error');
      return;
    }

    if (pinProtection && pinCode.length !== 4) {
      showToast('PIN keamanan harus terdiri dari 4 digit angka.', 'error');
      return;
    }

    setIsCreatingDrop(true);
    const roomCode = generate6DigitCode();
    const formattedCode = roomCode.replace('-', '');
    
    const isSelfDestruct = expireHours === 'self';
    const expireHoursNum = isSelfDestruct ? 1 : parseFloat(expireHours);
    const expiresAt = Date.now() + expireHoursNum * 60 * 60 * 1000;

    const newRoomData = {
      code: roomCode,
      createdAt: Date.now(),
      expiresAt: expiresAt,
      pinProtected: pinProtection,
      pin: pinProtection ? pinCode : null,
      selfDestruct: isSelfDestruct,
      files: uploadedFiles,
      codeSnippet: codeText.trim() ? {
        title: codeTitle.trim() || `Skrip_${getLanguageExtension(codeLanguage)}.${getLanguageExtension(codeLanguage)}`,
        language: codeLanguage,
        code: codeText,
        createdAt: Date.now()
      } : null,
      isFromFirestore: false
    };

    if (db && user) {
      try {
        const roomDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'campusdrop_rooms', formattedCode);
        await setDoc(roomDocRef, { ...newRoomData, isFromFirestore: true });
        newRoomData.isFromFirestore = true;
      } catch (err) {
        console.warn("Lokal fallback tanpa cloud firestore:", err);
      }
    }

    setCurrentRoom(newRoomData);
    addRoomToHistory(newRoomData);
    setIsCreatingDrop(false);

    // Reset Form
    setUploadedFiles([]);
    setCodeText('');
    setCodeTitle('');
    setPinProtection(false);
    setPinCode('');

    showToast(`Ruang Transfer ${roomCode} siap digunakan!`, 'success');
  };

  const handleJoinRoom = async (codeToSearch = inputRoomCode) => {
    const rawCode = codeToSearch.trim().replace(/[^0-9]/g, '');
    if (rawCode.length !== 6) {
      showToast('Masukkan 6 digit kode transfer yang valid.', 'error');
      return;
    }

    const formattedSearchCode = `${rawCode.slice(0, 3)}-${rawCode.slice(3, 6)}`;
    setIsSearchingRoom(true);

    if (db && user) {
      try {
        const roomDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'campusdrop_rooms', rawCode);
        const docSnap = await getDoc(roomDocRef);

        if (docSnap.exists()) {
          const roomData = docSnap.data();

          if (roomData.expiresAt && Date.now() > roomData.expiresAt) {
            showToast('Kode transfer ini sudah kadaluarsa.', 'error');
            setIsSearchingRoom(false);
            return;
          }

          if (roomData.pinProtected) {
            setCurrentRoom(roomData);
            setPinModalRequired(true);
            setIsSearchingRoom(false);
            return;
          }

          setCurrentRoom(roomData);
          addRoomToHistory(roomData);
          showToast(`Terhubung ke ruang ${roomData.code}`, 'success');
          setIsSearchingRoom(false);
          return;
        }
      } catch (e) {
        console.warn("Firestore lookup fallback:", e);
      }
    }

    // Local fallback search
    const foundInHistory = recentHistory.find(r => r.code.replace('-', '') === rawCode);
    if (foundInHistory && currentRoom && currentRoom.code.replace('-', '') === rawCode) {
      setIsSearchingRoom(false);
      showToast(`Membuka ruang ${formattedSearchCode}`, 'success');
      return;
    }

    setIsSearchingRoom(false);
    showToast(`Kode "${formattedSearchCode}" tidak ditemukan atau kadaluarsa.`, 'error');
  };

  const handleVerifyPin = () => {
    if (!currentRoom) return;
    if (enteredPin === currentRoom.pin) {
      setPinModalRequired(false);
      setPinError('');
      setEnteredPin('');
      addRoomToHistory(currentRoom);
      showToast('PIN berhasil diverifikasi!', 'success');
    } else {
      setPinError('PIN 4 digit salah.');
    }
  };

  const handleDownloadFile = (file) => {
    const link = document.createElement('a');
    link.href = file.dataUrl;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`Mengunduh ${file.name}`, 'success');

    if (currentRoom && currentRoom.selfDestruct) {
      handleSelfDestructRoom();
    }
  };

  const handleSelfDestructRoom = async () => {
    if (!currentRoom) return;
    const rawCode = currentRoom.code.replace('-', '');

    if (db && user && currentRoom.isFromFirestore) {
      try {
        const roomDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'campusdrop_rooms', rawCode);
        await deleteDoc(roomDocRef);
      } catch (err) {}
    }

    setCurrentRoom(null);
    showToast('Sesi transfer telah dihapus secara permanen.', 'warning');
  };

  const handleCopyText = (text, label = 'Teks') => {
    navigator.clipboard.writeText(text);
    showToast(`${label} berhasil disalin!`, 'success');
  };

  const getRemainingTime = (expiresAt) => {
    if (!expiresAt) return 'Aktif';
    const diff = expiresAt - Date.now();
    if (diff <= 0) return 'Kadaluarsa';
    const mins = Math.floor(diff / (1000 * 60));
    if (mins > 60) {
      const hrs = Math.floor(mins / 60);
      return `Tersisa ${hrs} jam ${mins % 60}m`;
    }
    return `Tersisa ${mins} menit`;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Modus Nyamar Overlay */}
      <AcademicStealthOverlay active={stealthMode} onDismiss={() => setStealthMode(false)} />

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-[9990] animate-in fade-in slide-in-from-top-2 duration-200">
          <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-md border text-xs font-semibold backdrop-blur-md ${
            toast.type === 'success' 
              ? 'bg-slate-900 text-white border-slate-800' 
              : toast.type === 'error'
              ? 'bg-rose-900 text-white border-rose-800'
              : toast.type === 'warning'
              ? 'bg-amber-900 text-white border-amber-800'
              : 'bg-indigo-900 text-white border-indigo-800'
          }`}>
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400" />}
            {toast.type === 'warning' && <Clock className="w-4 h-4 text-amber-400" />}
            {toast.type === 'info' && <Info className="w-4 h-4 text-cyan-400" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 px-4 sm:px-8 py-3.5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => { setCurrentRoom(null); setActiveTab('send'); }}
          >
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-base shadow-2xs group-hover:bg-indigo-600 transition-colors">
              <Zap className="w-4 h-4 fill-current text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-slate-900 tracking-tight">
                  Campus<span className="text-indigo-600">Drop</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium border border-slate-200">
                  Tanpa Login
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">Transfer Berkas & Kode Cepat di Kampus</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setStealthMode(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium border border-slate-200 transition cursor-pointer"
              title="Sembunyikan tampilan web jika ada orang di belakang (Tekan ESC)"
            >
              <EyeOff className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Nyamar</span>
              <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-white text-slate-500 rounded border border-slate-200 shadow-2xs">ESC</kbd>
            </button>

            {currentRoom && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-mono font-semibold">
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
                <span>{currentRoom.code}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main SaaS Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        
        {/* Navigation Pills */}
        {!currentRoom && (
          <div className="flex justify-center">
            <div className="bg-slate-200/60 p-1 rounded-xl flex gap-1 text-xs font-semibold text-slate-600">
              <button
                onClick={() => setActiveTab('send')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'send'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'hover:text-slate-900 hover:bg-slate-200/40'
                }`}
              >
                <Upload className="w-3.5 h-3.5 text-indigo-600" />
                <span>Kirim Berkas & Kode</span>
              </button>

              <button
                onClick={() => setActiveTab('receive')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'receive'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'hover:text-slate-900 hover:bg-slate-200/40'
                }`}
              >
                <Download className="w-3.5 h-3.5 text-indigo-600" />
                <span>Terima Drop</span>
              </button>

              <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'history'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'hover:text-slate-900 hover:bg-slate-200/40'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                <span>Riwayat ({recentHistory.length})</span>
              </button>
            </div>
          </div>
        )}

        {currentRoom && !pinModalRequired && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-2xs space-y-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-3 text-center md:text-left w-full md:w-auto">
                  <div className="flex items-center justify-center md:justify-start gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> Transfer Aktif
                    </span>
                    {currentRoom.selfDestruct && (
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200">
                        1x Download & Hapus
                      </span>
                    )}
                  </div>

                  <h2 className="text-xs uppercase font-mono font-medium text-slate-500 tracking-wider">
                    Kode Transfer 6-Digit
                  </h2>

                  <div className="flex items-center justify-center md:justify-start gap-3">
                    <span className="text-3xl sm:text-4xl font-mono font-bold tracking-widest text-slate-900 bg-slate-100 px-5 py-2 rounded-xl border border-slate-200">
                      {currentRoom.code}
                    </span>
                    <button
                      onClick={() => handleCopyText(currentRoom.code, 'Kode Ruang')}
                      className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 transition cursor-pointer"
                      title="Salin Kode"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-500 font-mono flex items-center justify-center md:justify-start gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-600" /> {getRemainingTime(currentRoom.expiresAt)}
                  </p>
                </div>

                <DynamicQRCode value={`${window.location.origin}/#code=${currentRoom.code}`} />
              </div>

              <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                <button
                  onClick={() => setCurrentRoom(null)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition flex items-center gap-1.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" /> Tutup Ruang
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyText(`${window.location.origin}/#code=${currentRoom.code}`, 'Tautan Akses')}
                    className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" /> Salin Tautan
                  </button>

                  <button
                    onClick={handleSelfDestructRoom}
                    className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-medium transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Hapus Sekarang
                  </button>
                </div>
              </div>
            </div>

            {/* List Berkas */}
            {currentRoom.files && currentRoom.files.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <File className="w-4 h-4 text-indigo-600" />
                    Berkas Terunggah ({currentRoom.files.length})
                  </h3>
                  <span className="text-xs text-slate-500 font-mono">
                    Total: {formatBytes(currentRoom.files.reduce((acc, f) => acc + (f.size || 0), 0))}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {currentRoom.files.map((file) => (
                    <div
                      key={file.id || file.name}
                      className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 hover:border-slate-300 transition"
                    >
                      <div className="flex items-center gap-3 overflow-hidden pr-2">
                        <div className="p-2 rounded-lg bg-white border border-slate-200 text-slate-700 flex-shrink-0">
                          {file.name.endsWith('.pdf') ? <FileText className="w-4 h-4 text-rose-600" /> :
                           file.name.endsWith('.zip') ? <FileArchive className="w-4 h-4 text-amber-600" /> :
                           file.type.startsWith('image/') ? <ImageIcon className="w-4 h-4 text-emerald-600" /> :
                           <FileCode className="w-4 h-4 text-indigo-600" />}
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-xs font-semibold text-slate-800 truncate">{file.name}</p>
                          <p className="text-[11px] text-slate-500 font-mono">{formatBytes(file.size)}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDownloadFile(file)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition shadow-2xs flex-shrink-0 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" /> Unduh
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Code Snippet Display */}
            {currentRoom.codeSnippet && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Code className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-sm font-bold text-slate-900">
                      {currentRoom.codeSnippet.title || 'Skrip Kode'}
                    </h3>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200">
                      {currentRoom.codeSnippet.language}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopyText(currentRoom.codeSnippet.code, 'Skrip Kode')}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-medium transition flex items-center gap-1.5 border border-slate-200 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" /> Salin Kode
                    </button>
                    <button
                      onClick={() => {
                        const blob = new Blob([currentRoom.codeSnippet.code], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = currentRoom.codeSnippet.title || `skrip.${getLanguageExtension(currentRoom.codeSnippet.language)}`;
                        a.click();
                        showToast('Berhasil mengunduh berkas skrip', 'success');
                      }}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" /> Simpan File
                    </button>
                  </div>
                </div>

                <SyntaxHighlightLight 
                  code={currentRoom.codeSnippet.code} 
                  language={currentRoom.codeSnippet.language} 
                />
              </div>
            )}
          </div>
        )}

        {/* PIN Verification Modal */}
        {currentRoom && pinModalRequired && (
          <div className="max-w-sm mx-auto bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-lg my-8">
            <div className="text-center space-y-1.5">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center mx-auto">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Ruang Ini Dilindungi PIN</h3>
              <p className="text-xs text-slate-500">
                Masukkan 4 digit PIN yang diset oleh pengirim untuk mengakses berkas.
              </p>
            </div>

            <div className="space-y-3">
              <input
                type="password"
                maxLength={4}
                placeholder="••••"
                value={enteredPin}
                onChange={(e) => { setEnteredPin(e.target.value.replace(/[^0-9]/g, '')); setPinError(''); }}
                className="w-full text-center text-2xl font-mono tracking-widest px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:border-indigo-600 focus:outline-none text-slate-900"
                autoFocus
              />

              {pinError && (
                <p className="text-xs text-rose-600 text-center font-medium">{pinError}</p>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => { setCurrentRoom(null); setPinModalRequired(false); }}
                  className="w-1/2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={handleVerifyPin}
                  className="w-1/2 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition shadow-2xs cursor-pointer"
                >
                  Buka Akses
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'send' && !currentRoom && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="text-center space-y-1 max-w-lg mx-auto">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Kirim Berkas & Skrip Kodingan
              </h2>
              <p className="text-xs text-slate-500">
                Solusi praktis tanpa login WhatsApp Web atau membawa flashdisk di komputer lab.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* File Dropzone Card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <File className="w-4 h-4 text-indigo-600" />
                    1. Unggah File (PDF, ZIP, Docs)
                  </label>
                  <span className="text-[11px] text-slate-400 font-mono">Maks. 8MB</span>
                </div>

                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files) processSelectedFiles(e.dataTransfer.files);
                  }}
                  className="border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50/50 hover:bg-slate-50 rounded-xl p-6 text-center transition flex flex-col items-center justify-center min-h-[160px] relative cursor-pointer group"
                >
                  <input
                    type="file"
                    multiple
                    onChange={(e) => { if (e.target.files) processSelectedFiles(e.target.files); }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center mb-2 text-indigo-600 shadow-2xs group-hover:scale-105 transition-transform">
                    <Upload className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-slate-700">
                    Tarik file ke sini, atau <span className="text-indigo-600 underline">pilih file</span>
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    PDF, Word, ZIP, Gambar, atau Skrip Kodingan
                  </p>
                </div>

                {uploadedFiles.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <span className="text-xs font-mono text-slate-500">Terpilih ({uploadedFiles.length}):</span>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {uploadedFiles.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-200 text-xs"
                        >
                          <div className="flex items-center gap-2 overflow-hidden pr-2">
                            <File className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                            <span className="truncate font-medium text-slate-800">{file.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">({formatBytes(file.size)})</span>
                          </div>
                          <button
                            onClick={() => removeUploadedFile(file.id)}
                            className="p-1 hover:bg-slate-200 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Code Paste Card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Code className="w-4 h-4 text-indigo-600" />
                    2. Tempel Kode / Catatan
                  </label>
                  
                  <select
                    value={codeLanguage}
                    onChange={(e) => setCodeLanguage(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-indigo-600 font-mono"
                  >
                    <option value="python">Python (.py)</option>
                    <option value="cpp">C++ (.cpp)</option>
                    <option value="javascript">JavaScript (.js)</option>
                    <option value="java">Java (.java)</option>
                    <option value="html">HTML/CSS</option>
                    <option value="sql">SQL</option>
                    <option value="text">Teks Biasa</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Judul / Nama File (Opsional)"
                    value={codeTitle}
                    onChange={(e) => setCodeTitle(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-600 font-mono"
                  />

                  <textarea
                    rows={6}
                    placeholder="Tempelkan kode program, sintaks C++, atau catatan ringkas di sini..."
                    value={codeText}
                    onChange={(e) => setCodeText(e.target.value)}
                    className="w-full text-xs p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500 font-mono resize-none leading-relaxed"
                  />
                </div>
              </div>
            </div>

            {/* Transfer Security & Expiration Settings Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-2xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-indigo-600" /> Pengaturan Keamanan & Kadaluarsa
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <label className="text-slate-600 font-medium">Batas Waktu Hapus Otomatis</label>
                  <select
                    value={expireHours}
                    onChange={(e) => setExpireHours(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-2.5 focus:outline-none focus:border-indigo-600"
                  >
                    <option value="0.25">15 Menit</option>
                    <option value="1">1 Jam (Rekomendasi Kampus)</option>
                    <option value="24">24 Jam</option>
                    <option value="self">1x Download (Langsung Hapus)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-600 font-medium">PIN Keamanan 4-Digit</label>
                    <button
                      type="button"
                      onClick={() => setPinProtection(!pinProtection)}
                      className={`text-[10px] font-mono px-2 py-0.5 rounded transition cursor-pointer ${
                        pinProtection ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {pinProtection ? 'Aktif' : 'Non-aktif'}
                    </button>
                  </div>
                  {pinProtection ? (
                    <input
                      type="password"
                      maxLength={4}
                      placeholder="Contoh: 1234"
                      value={pinCode}
                      onChange={(e) => setPinCode(e.target.value.replace(/[^0-9]/g, ''))}
                      className="w-full bg-slate-50 border border-indigo-300 text-slate-900 rounded-xl p-2 font-mono text-center tracking-widest focus:outline-none"
                    />
                  ) : (
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-400 italic">
                      Tanpa PIN tambahan
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Create Drop Action Button */}
            <button
              onClick={handleCreateDrop}
              disabled={isCreatingDrop}
              className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl shadow-2xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isCreatingDrop ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Membuat Ruang Transfer...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-current text-indigo-400" />
                  <span>Buat Ruang CampusDrop (Dapatkan Kode & QR)</span>
                </>
              )}
            </button>
          </div>
        )}

        {activeTab === 'receive' && !currentRoom && (
          <div className="max-w-md mx-auto space-y-6 animate-in fade-in duration-200 py-4">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center mx-auto mb-2 shadow-2xs">
                <Download className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Terima Berkas / Kode</h2>
              <p className="text-xs text-slate-500">
                Masukkan 6 digit kode unik yang tertera di HP atau laptop pengirim.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-2xs">
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase tracking-wider text-slate-500 block text-center">
                  Kode Ruang Transfer
                </label>

                <input
                  type="text"
                  maxLength={7}
                  placeholder="482-910"
                  value={inputRoomCode}
                  onChange={(e) => {
                    let val = e.target.value.replace(/[^0-9]/g, '');
                    if (val.length > 3) {
                      val = `${val.slice(0, 3)}-${val.slice(3, 6)}`;
                    }
                    setInputRoomCode(val);

                    if (val.replace('-', '').length === 6) {
                      handleJoinRoom(val);
                    }
                  }}
                  className="w-full text-center text-3xl font-mono tracking-widest px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:border-indigo-600 focus:outline-none text-slate-900 shadow-inner"
                  autoFocus
                />
              </div>

              <button
                onClick={() => handleJoinRoom(inputRoomCode)}
                disabled={isSearchingRoom}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isSearchingRoom ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Buka Berkas</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Tab History */}
        {activeTab === 'history' && !currentRoom && (
          <div className="max-w-xl mx-auto space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Riwayat Transfer Lokal</h2>
                <p className="text-xs text-slate-500">Tersimpan sementara di peramban ini</p>
              </div>

              {recentHistory.length > 0 && (
                <button
                  onClick={() => {
                    setRecentHistory([]);
                    localStorage.removeItem('campusdrop_history_v2');
                    showToast('Riwayat berhasil dibersihkan', 'info');
                  }}
                  className="text-xs text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Bersihkan
                </button>
              )}
            </div>

            {recentHistory.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-2xl border border-slate-200 space-y-2">
                <Clock className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs text-slate-500">Belum ada riwayat transfer terbaru.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentHistory.map((item) => (
                  <div
                    key={item.code}
                    className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-slate-200/80 hover:border-slate-300 transition shadow-2xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-slate-900">{item.code}</span>
                        {item.hasCode && (
                          <span className="text-[10px] font-mono px-2 py-0.2 bg-slate-100 text-slate-600 rounded">Kode</span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 font-mono">
                        {item.filesCount} file • {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    <button
                      onClick={() => handleJoinRoom(item.code)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition flex items-center gap-1 cursor-pointer"
                    >
                      Buka <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-5 px-4 text-center text-xs text-slate-500 space-y-1 mt-auto">
        <p>CampusDrop — Solusi privasi berbagi berkas dan skrip kodingan laboratorium kampus.</p>
        <p className="text-[11px] text-slate-400">Peringatan: Tekan <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-600 font-mono">ESC</kbd> kapan saja untuk menyembunyikan layar.</p>
      </footer>
    </div>
  );
}