import { useState, FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, Mail, Lock, User, Sparkles, AlertCircle } from "lucide-react";
import { supabase } from "../lib/supabase";

interface AuthPageProps {
  onLogin: (email: string) => void;
}

export default function AuthPage({ onLogin }: AuthPageProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    if (!supabase) {
      // Simulate auth fallback
      console.log("Simulating auth as Supabase is not configured...");
      setTimeout(() => {
        onLogin(email || "user@example.com");
        setIsLoading(false);
      }, 1500);
      return;
    }

    try {
      if (isLogin) {
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (authError) throw authError;
        if (data.user?.email) onLogin(data.user.email);
      } else {
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
            }
          }
        });
        
        if (authError) throw authError;
        
        // If email confirmation is enabled, we might need to tell the user
        if (data.session) {
          if (data.user?.email) onLogin(data.user.email);
        } else {
          setError("Sign up successful! Please check your email for confirmation.");
        }
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      setError(err.message || "An error occurred during authentication.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-beige/30 flex items-center justify-center p-6 selection:bg-burgundy/20">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl border border-burgundy/5 overflow-hidden"
      >
        <div className="p-10">
          <div className="flex flex-col items-center mb-10">
            <motion.div 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="w-16 h-16 bg-burgundy rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-burgundy/20"
            >
              <span className="font-serif text-3xl text-beige">M</span>
            </motion.div>
            <h2 className="font-serif text-3xl text-burgundy text-center">
              {isLogin ? "Welcome Back" : "Begin Your Archive"}
            </h2>
            <p className="text-burgundy/60 text-sm mt-2 font-medium uppercase tracking-[0.15em]">
              {isLogin ? "Return to the archive" : "Join Museo Intelligence"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-red-50 border border-red-100 rounded-2xl p-4 flex gap-3 items-start shadow-sm"
                >
                  <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700 font-medium leading-relaxed">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <label className="text-[10px] font-bold uppercase tracking-widest text-burgundy/40 px-2">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-burgundy/30" size={18} />
                    <input 
                      type="text" 
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Annabel Ijeoma"
                      className="w-full bg-beige/10 border border-burgundy/5 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-burgundy/20 transition-all font-medium"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-burgundy/40 px-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-burgundy/30" size={18} />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@archived.com"
                  className="w-full bg-beige/10 border border-burgundy/5 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-burgundy/20 transition-all font-medium"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-burgundy/40 px-2">Access Key</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-burgundy/30" size={18} />
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-beige/10 border border-burgundy/5 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-burgundy/20 transition-all font-medium"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-burgundy text-beige rounded-2xl py-4 font-bold uppercase tracking-widest text-xs hover:bg-burgundy-dark transition-all flex items-center justify-center gap-3 shadow-xl shadow-burgundy/20 group disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-beige/30 border-t-beige rounded-full animate-spin" />
              ) : (
                <>
                  {isLogin ? "Enter Vault" : "Create Profile"}
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 pt-10 border-t border-burgundy/5 text-center">
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-xs font-bold uppercase tracking-widest text-burgundy/40 hover:text-burgundy transition-colors"
            >
              {isLogin ? "Don't have access? Request Membership" : "Already a member? Sign In"}
            </button>
          </div>
        </div>

        <div className="bg-beige/10 p-6 flex items-center justify-center gap-3">
          <Sparkles size={14} className="text-burgundy/20" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-burgundy/30">Secure Entry Point</span>
          <Sparkles size={14} className="text-burgundy/20" />
        </div>
      </motion.div>
    </div>
  );
}
