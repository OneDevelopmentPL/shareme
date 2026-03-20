import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';
import { MoreVertical, Share2, Users, Copy, Check, RotateCcw, Link as LinkIcon, Code, QrCode, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeCanvas } from 'qrcode.react';

// Syntax Highlighting
import EditorSource from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/themes/prism.css';

const Editor = typeof EditorSource === 'function' ? EditorSource : EditorSource.default;

const generateId = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// --- Sub-components ---

const ShareModal = ({ sharedId, onClose }) => {
  const url = `${window.location.origin}/${sharedId}`;
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="modal-content" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontSize: '1.2rem' }}>Share Code</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20}/></button>
        </div>
        
        <div className="qr-container">
          <QRCodeCanvas value={url} size={180} />
        </div>

        <div className="link-box">{url}</div>

        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 16 }}>
          Notatka zostanie automatycznie usunięta po 14 dniach.
        </p>

        <button className="btn-primary" onClick={copy}>
          {copied ? <><Check size={18} /> Copied!</> : <><Copy size={18} /> Copy Link</>}
        </button>
      </motion.div>
    </motion.div>
  );
};

// --- Main App ---

function App() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [multiplayer, setMultiplayer] = useState(false);
  const [copying, setCopying] = useState(false);
  const [language, setLanguage] = useState('text'); // 'text' or 'cpp'
  const [sharedId, setSharedId] = useState(window.location.pathname.slice(1));
  
  const channelRef = useRef(null);
  const isTypingRef = useRef(false);

  useEffect(() => {
    if (sharedId && sharedId.length === 5) {
      fetchAndSubscribe(sharedId);
    } else {
      setLoading(false);
      setSharedId(null);
    }

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [sharedId]);

  const fetchAndSubscribe = async (id) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('snippets').select('content').eq('id', id).single();
      if (data) setText(data.content);

      const channel = supabase.channel(`snippet-${id}`)
        .on('broadcast', { event: 'text-update' }, ({ payload }) => {
          if (!isTypingRef.current) setText(payload.text);
        })
        .subscribe();
      
      channelRef.current = channel;
      setMultiplayer(true);
      // If we are opening a link, default to C++ if it looks like code? 
      // User said "default normal text", so we keep 'text'.
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTextChange = (newText) => {
    setText(newText);
    isTypingRef.current = true;

    if (sharedId && channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'text-update',
        payload: { text: newText },
      });
      debouncedUpdateDb(sharedId, newText);
    }

    setTimeout(() => { isTypingRef.current = false; }, 500);
  };

  const updateTimerRef = useRef(null);
  const debouncedUpdateDb = (id, content) => {
    if (updateTimerRef.current) clearTimeout(updateTimerRef.current);
    updateTimerRef.current = setTimeout(async () => {
      await supabase.from('snippets').upsert({ id, content });
    }, 1000);
  };

  const handleStartMultiplayer = async () => {
    const id = generateId();
    try {
      await supabase.from('snippets').insert([{ id, content: text }]);
      window.history.pushState({}, '', `/${id}`);
      setSharedId(id);
      setShowMenu(false);
    } catch (err) {
      console.error(err);
    }
  };

  const reset = () => { window.location.href = '/'; };

  const handleCopyLink = () => {
    if (!sharedId) {
      // Create a static share if not already multiplayer
      handleStartMultiplayer().then(() => setShowShare(true));
    } else {
      setShowShare(true);
      setShowMenu(false);
    }
  };

  return (
    <div className="app-container">
      {loading && <div className="loading-overlay"><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><RotateCcw /></motion.div></div>}
      
      <header className="header">
        <div className="logo" onClick={reset}>
          SHAREME {multiplayer && <span className="multiplayer-badge">LIVE</span>}
        </div>
        <div style={{ position: 'relative' }}>
          <button className="menu-trigger" onClick={() => setShowMenu(!showMenu)}>
            <MoreVertical size={20} />
          </button>
          
          <AnimatePresence>
            {showMenu && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="dropdown-menu">
                <div className="menu-label">Settings</div>
                {!sharedId && (
                  <button className="menu-item" onClick={handleStartMultiplayer}>
                    <Users size={16} /> Start Multiplayer
                  </button>
                )}
                <button className="menu-item" onClick={handleCopyLink}>
                  <QrCode size={16} /> Share & QR Code
                </button>
                
                <div className="menu-label">Language</div>
                <button className="menu-item" onClick={() => { setLanguage('text'); setShowMenu(false); }}>
                  {language === 'text' && <Check size={14} />} Plain Text
                </button>
                <button className="menu-item" onClick={() => { setLanguage('cpp'); setShowMenu(false); }}>
                  {language === 'cpp' && <Check size={14} />} C++ (.ino)
                </button>

                <div className="menu-label">System</div>
                <button className="menu-item" onClick={reset}>
                  <RotateCcw size={16} /> New File
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      <main className="editor-main">
        <Editor
          value={text}
          onValueChange={handleTextChange}
          highlight={code => {
            if (language === 'cpp' && Prism.languages.cpp) {
              return Prism.highlight(code, Prism.languages.cpp, 'cpp');
            }
            return code;
          }}
          padding={40}
          className="editor-wrapper"
          style={{
            fontFamily: language === 'cpp' ? '"Fira Code", monospace' : 'inherit',
            fontSize: '1rem',
            minHeight: '100%',
          }}
        />
      </main>

      <AnimatePresence>
        {showShare && <ShareModal sharedId={sharedId} onClose={() => setShowShare(false)} />}
      </AnimatePresence>

      <div className="status-bar">
        {language === 'cpp' ? <Code size={14} style={{ marginRight: 4 }} /> : <LinkIcon size={14} style={{ marginRight: 4 }} />}
        {language === 'cpp' ? 'C++ (.ino)' : 'Plain Text'} | {text.length} chars
      </div>
    </div>
  );
}

export default App;
