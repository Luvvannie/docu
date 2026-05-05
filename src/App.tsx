/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from "motion/react";
import { 
  Upload, 
  MessageSquare, 
  FileText, 
  Video, 
  Image as ImageIcon, 
  Music, 
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Zap,
  Github
} from "lucide-react";
import { useState, useRef, useEffect, ChangeEvent } from "react";
import AuthPage from "./components/AuthPage";

const SUPPORTED_FORMATS = [
  { icon: FileText, label: "PDF Documents", color: "text-blue-600" },
  { icon: Video, label: "Video Files", color: "text-purple-600" },
  { icon: ImageIcon, label: "Images", color: "text-orange-600" },
  { icon: Music, label: "Audio/Sound", color: "text-emerald-600" },
];

export default function App() {
  const [user, setUser] = useState<string | null>(() => localStorage.getItem("museo_user"));
  const [isUploading, setIsUploading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [files, setFiles] = useState<{ name: string; type: string; size: string }[]>([]);
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([
    { role: "assistant", content: "Welcome. I have indexed the archive. What knowledge shall we extract today?" }
  ]);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      localStorage.setItem("museo_user", user);
    } else {
      localStorage.removeItem("museo_user");
    }
  }, [user]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    setIsUploading(true);

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      
      // Get file type category
      let type = "File";
      if (file.type.includes('pdf')) type = "PDF";
      else if (file.type.includes('video')) type = "Video";
      else if (file.type.includes('image')) type = "Image";
      else if (file.type.includes('audio')) type = "Audio";

      const fileInfo = {
        name: file.name,
        type: type,
        size: (file.size / 1024 / 1024).toFixed(2) + " MB"
      };

      // Send as binary via FormData
      const formData = new FormData();
      formData.append('user_id', user || '');
      formData.append('file_name', file.name);
      formData.append('file_type', file.type);
      formData.append('data', file); // Field name is "data"

      try {
        await fetch('/api/webhook/upload', {
          method: 'POST',
          body: formData
        });
      } catch (err) {
        console.error("Upload proxy call failed for " + file.name, err);
      }

      setFiles(prev => [...prev, fileInfo]);
    }

    // Small delay to simulate processing
    setTimeout(() => {
      setIsUploading(false);
    }, 1000);
  };

  const triggerFileInput = () => {
    document.getElementById('file-upload-input')?.click();
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage = inputText;
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setInputText("");
    setIsTyping(true);

    // Webhook implementation for chat via server-side proxy
    try {
      const response = await fetch('/api/webhook/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          data: {
            user_id: user,
            message: userMessage, 
            files_count: files.length 
          }
        })
      });

      const responseData = await response.text();
      let displayMessage = responseData;
      
      try {
        // If it looks like JSON, parse it and try to extract a logical message
        if (responseData.trim().startsWith('{') || responseData.trim().startsWith('[')) {
          const json = JSON.parse(responseData);
          displayMessage = json.message || json.reply || json.output || json.response || JSON.stringify(json, null, 2);
        }
      } catch (e) {
        // Not JSON or failed to parse, use raw text
      }

      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: displayMessage
      }]);
    } catch (err) {
      console.error("Chat proxy call failed", err);
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "Error: I encountered a connection issue. Please try again later." 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!user) {
    return <AuthPage onLogin={(email) => setUser(email)} />;
  }

  return (
    <div className="min-h-screen flex flex-col selection:bg-burgundy/20">
      {/* Navigation */}
      <nav className="flex justify-between items-center px-6 md:px-12 py-8">
        <div className="flex items-center gap-2 text-burgundy">
          <div className="w-10 h-10 bg-burgundy rounded-lg flex items-center justify-center">
            <span className="font-serif text-2xl text-beige">M</span>
          </div>
          <span className="font-serif text-2xl tracking-tight">Museo</span>
        </div>
        <div className="hidden md:flex gap-8 text-sm font-medium uppercase tracking-widest text-burgundy/60">
            <a href="#" className="hover:text-burgundy transition-colors">Philosophy</a>
            <a href="#" className="hover:text-burgundy transition-colors">Archive</a>
            <a href="#" className="hover:text-burgundy transition-colors">Intelligence</a>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setUser(null)}
            className="text-xs font-bold uppercase tracking-widest text-burgundy/40 hover:text-burgundy transition-colors"
          >
            Logout
          </button>
          <button id="get-started-nav" className="px-5 py-2.5 bg-burgundy text-beige rounded-full text-sm font-medium hover:bg-burgundy-dark transition-colors flex items-center gap-2">
            Contact <ArrowRight size={14} />
          </button>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12 md:py-16 flex flex-col gap-20">
        
        {/* Hero Section */}
        <div className="max-w-3xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="font-serif text-6xl md:text-8xl mb-8 leading-[0.9] tracking-tighter text-burgundy">
              Listen to your <span className="italic text-burgundy-light">documents.</span>
            </h1>
            <p className="text-xl md:text-2xl text-burgundy/80 font-light leading-relaxed mb-10">
              A refined workspace designed to analyze, synthesize, and converse with your multi-media archives. Upload videos, images, audio, or PDFs and unlock the knowledge within.
            </p>
          </motion.div>
        </div>

        {/* Unified Interface Section */}
        <section id="interface" className="w-full">
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-[3rem] shadow-2xl border border-burgundy/5 overflow-hidden flex flex-col md:flex-row min-h-[700px]"
          >
            {/* Sidebar (Upload Panel) */}
            <div className="w-full md:w-[350px] bg-beige/30 p-8 border-r border-burgundy/5 flex flex-col">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-burgundy rounded-lg text-beige">
                  <Upload size={18} />
                </div>
                <h3 className="font-serif text-xl text-burgundy uppercase tracking-wider">The Vault</h3>
              </div>

              <div 
                className="group cursor-pointer border-2 border-dashed border-burgundy/10 rounded-3xl p-6 text-center hover:border-burgundy/30 transition-all bg-white/50 mb-8"
                onClick={triggerFileInput}
              >
                <input 
                  type="file" 
                  id="file-upload-input" 
                  className="hidden" 
                  multiple 
                  onChange={handleFileChange}
                  accept=".pdf,video/*,image/*,audio/*"
                />
                <AnimatePresence mode="wait">
                  {isUploading ? (
                    <motion.div key="up" className="flex flex-col items-center gap-3 py-4">
                      <div className="w-24 h-1 bg-burgundy/10 rounded-full overflow-hidden">
                        <motion.div 
                          animate={{ x: ["-100%", "100%"] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                          className="w-full h-full bg-burgundy"
                        />
                      </div>
                      <span className="text-xs font-medium italic opacity-60">Reading...</span>
                    </motion.div>
                  ) : (
                    <motion.div key="id" className="py-2">
                       <Upload size={24} className="mx-auto mb-3 text-burgundy/30 group-hover:scale-110 transition-transform" />
                       <p className="text-sm font-medium">Add Materials</p>
                       <p className="text-[10px] opacity-40 uppercase tracking-widest mt-1">Video, PDF, Image, Sound</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-burgundy/40 mb-4 px-2">Cataloged Items</h4>
                {files.map((f, i) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={i} 
                    className="p-4 bg-white rounded-2xl border border-burgundy/5 flex flex-col gap-1"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText size={16} className="text-burgundy/60" />
                        <span className="text-xs font-medium truncate max-w-[120px]">{f.name}</span>
                      </div>
                      <span className="text-[9px] font-bold bg-burgundy/5 text-burgundy/60 px-2 py-0.5 rounded uppercase">{f.type}</span>
                    </div>
                    <div className="text-[9px] text-burgundy/30 ml-7 tracking-wider">{f.size}</div>
                  </motion.div>
                ))}
                {files.length === 0 && (
                  <div className="h-32 flex flex-col items-center justify-center text-burgundy/20 italic text-sm">
                    Empty Archive
                  </div>
                )}
              </div>

              <div className="mt-8 p-5 bg-burgundy rounded-2xl text-beige flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShieldCheck size={18} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Encrypted</span>
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
            </div>

            {/* Main (Chat Interface) */}
            <div className="flex-1 flex flex-col bg-white">
               <div className="px-8 py-6 border-b border-burgundy/5 flex justify-between items-center bg-white">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-burgundy animate-pulse" />
                    <h3 className="font-serif text-xl text-burgundy">The Oracle</h3>
                  </div>
                  <div className="flex gap-2">
                    {SUPPORTED_FORMATS.map((f, i) => (
                      <f.icon key={i} size={14} className="text-burgundy/20" />
                    ))}
                  </div>
               </div>

               <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-8 space-y-8 scroll-smooth">
                  {messages.map((m, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[80%] rounded-3xl p-6 ${
                        m.role === 'user' 
                          ? 'bg-burgundy text-beige rounded-tr-none' 
                          : 'bg-beige/20 text-burgundy border border-burgundy/5 rounded-tl-none'
                      }`}>
                        <div className="flex items-center gap-2 mb-2 opacity-50">
                          <span className="text-[9px] font-bold uppercase tracking-widest">
                            {m.role === 'user' ? 'You' : 'The Oracle'}
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</p>
                      </div>
                    </motion.div>
                  ))}

                  {isTyping && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-start"
                    >
                      <div className="bg-beige/20 text-burgundy border border-burgundy/5 rounded-3xl rounded-tl-none p-6">
                        <div className="flex gap-1">
                          <motion.div 
                            animate={{ opacity: [0.4, 1, 0.4] }} 
                            transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
                            className="w-1.5 h-1.5 rounded-full bg-burgundy" 
                          />
                          <motion.div 
                            animate={{ opacity: [0.4, 1, 0.4] }} 
                            transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut", delay: 0.2 }}
                            className="w-1.5 h-1.5 rounded-full bg-burgundy" 
                          />
                          <motion.div 
                            animate={{ opacity: [0.4, 1, 0.4] }} 
                            transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut", delay: 0.4 }}
                            className="w-1.5 h-1.5 rounded-full bg-burgundy" 
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
               </div>

               <div className="p-8 bg-beige/10 border-t border-burgundy/5">
                  <div className="relative max-w-3xl mx-auto">
                    <input 
                      type="text" 
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Ask the intelligence about your archive..." 
                      className="w-full bg-white border border-burgundy/10 rounded-2xl px-6 py-5 text-sm focus:outline-none focus:ring-2 focus:ring-burgundy/20 pr-14 shadow-sm"
                    />
                    <button 
                      onClick={handleSendMessage}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-burgundy text-beige rounded-xl hover:bg-burgundy-dark transition-all disabled:opacity-50"
                      disabled={!inputText.trim()}
                    >
                      <ArrowRight size={20} />
                    </button>
                  </div>
                  <div className="mt-4 flex items-center justify-center gap-4 text-[9px] font-bold uppercase tracking-[0.2em] text-burgundy/30">
                    <Sparkles size={12} />
                    <span>Neural Engine Active • Semantic Webhooks Configured</span>
                    <Sparkles size={12} />
                  </div>
               </div>
            </div>
          </motion.div>
        </section>

        {/* Features Section */}
        <section className="grid md:grid-cols-3 gap-16 border-t border-burgundy/10 pt-20">
          <div>
            <h4 className="font-serif text-3xl mb-4 italic text-burgundy">Visionary Recognition</h4>
            <p className="text-burgundy/70 leading-relaxed">Our models don't just "see" images; they interpret context, artistic intent, and technical data within any visual document.</p>
          </div>
          <div>
            <h4 className="font-serif text-3xl mb-4 italic text-burgundy">Temporal Analysis</h4>
            <p className="text-burgundy/70 leading-relaxed">Transcribe and query long-form video and audio archives. Instantly jump to the timestamp where a specific topic is discussed.</p>
          </div>
          <div>
            <h4 className="font-serif text-3xl mb-4 italic text-burgundy">Multi-Lingual Synthesis</h4>
            <p className="text-burgundy/70 leading-relaxed">Translate complex documents across 100+ languages while maintaining the nuance of the original scholarly source.</p>
          </div>
        </section>
      </main>

      <footer className="px-6 md:px-12 py-12 bg-burgundy text-beige/60 text-xs flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex flex-col gap-2 italic font-serif text-lg text-beige">
          Museo Intelligence
        </div>
        <div className="flex gap-12">
          <a href="#" className="hover:text-beige transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-beige transition-colors">Terms of Vault</a>
          <a href="#" className="hover:text-beige transition-colors">System Status</a>
        </div>
        <div className="flex gap-4">
          <div className="w-8 h-8 rounded-full border border-beige/20 flex items-center justify-center hover:bg-beige/10 cursor-pointer transition-colors">
            <Github size={14} />
          </div>
        </div>
      </footer>
    </div>
  );
}
