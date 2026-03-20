import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Share2, Copy, Check, Loader2, ArrowLeft, Terminal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const generateId = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

function App() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sharedId, setSharedId] = useState(null);
  const [viewContent, setViewContent] = useState(null);
  const [copying, setCopying] = useState(false);
  const [error, setError] = useState(null);

  const pathId = window.location.pathname.slice(1);

  useEffect(() => {
    if (pathId && pathId.length === 5) {
      fetchSnippet(pathId);
    }
  }, [pathId]);

  const fetchSnippet = async (id) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('snippets')
        .select('content')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      setViewContent(data.content);
    } catch (err) {
      console.error(err);
      setError("Snippet not found or database error.");
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    const id = generateId();
    
    try {
      const { error } = await supabase
        .from('snippets')
        .insert([{ id, content: text }]);
      
      if (error) throw error;
      setSharedId(id);
    } catch (err) {
      console.error(err);
      setError("Failed to share text. Check your Supabase setup.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    const url = `${window.location.origin}/${sharedId}`;
    navigator.clipboard.writeText(url);
    setCopying(true);
    setTimeout(() => setCopying(false), 2000);
  };

  if (viewContent !== null) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card"
      >
        <div className="title">Shared Snippet</div>
        <div className="subtitle">Retrieve text via code: <strong>{pathId}</strong></div>
        <div className="read-only-content">{viewContent}</div>
        <button className="button" onClick={() => window.location.href = '/'}>
          <ArrowLeft size={20} /> Create New
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card"
    >
      <div className="title">ShareMe</div>
      <div className="subtitle">Paste text, get a 5-char code. Simple.</div>

      {error && (
        <div style={{ color: '#ef4444', marginBottom: '16px', textAlign: 'center' }}>
          {error}
        </div>
      )}

      {!sharedId ? (
        <>
          <textarea
            placeholder="Paste your text here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={loading}
          />
          <button 
            className="button" 
            onClick={handleShare}
            disabled={loading || !text.trim()}
          >
            {loading ? <div className="loading-spinner" /> : <><Share2 size={20} /> Share Now</>}
          </button>
        </>
      ) : (
        <AnimatePresence>
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="result-area"
          >
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Your shareable link:</div>
            <div className="code-display">{window.location.origin}/{sharedId}</div>
            <button className="button" onClick={copyToClipboard}>
              {copying ? <><Check size={20} /> Copied!</> : <><Copy size={20} /> Copy Link</>}
            </button>
            <button 
              className="button" 
              style={{ background: 'transparent', border: '1px solid var(--glass-border)', marginTop: '10px' }}
              onClick={() => { setSharedId(null); setText(''); }}
            >
              Share Something Else
            </button>
          </motion.div>
        </AnimatePresence>
      )}
    </motion.div>
  );
}

export default App;
