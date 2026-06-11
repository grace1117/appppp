import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, School, ShieldCheck, Star } from 'lucide-react';

interface AuthProps {
  onLoginSuccess: (name: string, studentId: string, email: string, avatarUrl: string) => void;
  onGoogleSignIn: () => void;
  isLoading?: boolean;
  socialError?: string;
}

export default function Auth({ onLoginSuccess, onGoogleSignIn, isLoading = false, socialError = '' }: AuthProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // Login form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Register form states
  const [registerEmail, setRegisterEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [registerStep, setRegisterStep] = useState<1 | 2>(1);
  const [registerCode, setRegisterCode] = useState<string[]>(['', '', '', '']);
  const codeRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  // Basic validation domain checker
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.endsWith('@mail.shu.edu.tw') && !loginEmail.toLowerCase().includes('shu')) {
      setLoginError('為了安全，建議使用校園信箱 @mail.shu.edu.tw 登入。或是輸入任意模擬帳號體驗。');
    }
    // Simulate login success on any valid input
    onLoginSuccess('李曉明', 'A1100100XX', loginEmail || 'A1100100XX@mail.shu.edu.tw', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150');
  };

  const handleRegisterSendCode = (e: React.FormEvent) => {
    e.preventDefault();
    const shuRegex = /^[a-zA-Z0-9._%+-]+@mail\.shu\.edu\.tw$/;
    
    // Validate email suffix
    if (shuRegex.test(registerEmail) || registerEmail.toLowerCase().includes('shu')) {
      setEmailError('');
      setRegisterStep(2);
    } else {
      setEmailError('請輸入正確的世新大學信箱格式 (例如: 學號@mail.shu.edu.tw)');
    }
  };

  const handleCodeChange = (index: number, val: string) => {
    if (val.length > 1) val = val.charAt(0);
    const updated = [...registerCode];
    updated[index] = val;
    setRegisterCode(updated);

    // Jump next focus
    if (val && index < 3) {
      codeRefs[index + 1].current?.focus();
    }
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !registerCode[index] && index > 0) {
      codeRefs[index - 1].current?.focus();
    }
  };

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate registration success
    const studentIdStr = registerEmail.split('@')[0].toUpperCase();
    onLoginSuccess('世新租房星人', studentIdStr || 'A1100100XX', registerEmail || 'A1100100XX@mail.shu.edu.tw', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150');
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-5xl mx-auto py-4 grid grid-cols-1 md:grid-cols-12 gap-8 items-center"
    >
      {/* Brand Header Column (Left Side on Desktop) */}
      <section className="hidden md:flex md:col-span-6 flex-col gap-5">
        <div className="relative rounded-2xl overflow-hidden aspect-[4/3] shadow-md border border-slate-200">
          <img
            src="https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=80"
            alt="世新租屋"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#585595]/80 to-transparent flex items-end p-8 text-white">
            <div className="space-y-1.5">
              <h2 className="text-2xl font-bold">尋找您的理想校外居所</h2>
              <p className="text-sm text-purple-100 font-medium">
                專為世新學子量身打造的透明租賃對比平台，安全、效率、校友愛護保障。
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-100 flex items-center gap-3">
            <School className="w-5 h-5 text-[#585595]" />
            <span className="text-xs font-bold text-slate-700">學校信箱一鍵身份認證</span>
          </div>
          <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-100 flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-[#585595]" />
            <span className="text-xs font-bold text-slate-700">真實租客學友評論分享</span>
          </div>
        </div>
      </section>

      {/* Interactable Form Column (Right Side) */}
      <section className="md:col-span-6 w-full flex justify-center">
        <div className="w-full max-w-md bg-white p-6 sm:p-8 rounded-2xl shadow-md border border-slate-200 relative overflow-hidden">
          
          {/* Header Toggle tabs */}
          <div className="flex border-b border-slate-100 mb-6">
            <button
              onClick={() => setActiveTab('login')}
              className={`flex-1 py-4 font-bold text-sm tracking-wider border-b-2 transition-all ${
                activeTab === 'login'
                  ? 'border-[#585595] text-[#585595]'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              登入帳號
            </button>
            <button
              onClick={() => {
                setActiveTab('register');
                setRegisterStep(1);
              }}
              className={`flex-1 py-4 font-bold text-sm tracking-wider border-b-2 transition-all ${
                activeTab === 'register'
                  ? 'border-[#585595] text-[#585595]'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              註冊新帳號
            </button>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'login' ? (
              /* LOGIN form standard state */
              <motion.form
                key="login-form"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={handleLoginSubmit}
                className="space-y-4"
              >
                <div className="space-y-1.5ClassName">
                  <label className="text-xs font-bold text-slate-600 block">學校或個人信箱</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="example@mail.shu.edu.tw"
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#585595]/20 focus:border-[#585595] text-xs font-semibold"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-600 block">密碼設定</label>
                    <a href="#forgot" className="text-xs text-[#585595] hover:underline font-bold">
                      忘記密碼？
                    </a>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#585595]/20 focus:border-[#585595] text-xs font-semibold"
                    />
                  </div>
                </div>

                {loginError && (
                  <p className="text-[10px] text-amber-600 font-medium leading-relaxed bg-amber-50 p-2 rounded border border-amber-100">
                    {loginError}
                  </p>
                )}

                {socialError && (
                  <p className="text-[10px] text-red-500 font-medium leading-relaxed bg-red-50 p-2 rounded border border-red-100">
                    {socialError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#585595] text-white py-3.5 rounded-lg font-bold text-xs hover:bg-[#4a4780] transition-colors shadow-sm active:scale-98 mt-4 uppercase tracking-wider disabled:opacity-50"
                >
                  {isLoading ? '驗證中...' : '立即驗證登入'}
                </button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-100" />
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase">
                    <span className="bg-white px-2 text-slate-400 font-medium font-mono">OR</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onGoogleSignIn}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2.5 border border-slate-200 hover:border-purple-300 hover:bg-purple-50/10 text-slate-700 py-3 rounded-lg text-xs font-bold transition-all disabled:opacity-50 active:scale-98"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span>使用 Google 快速驗證登入</span>
                </button>
              </motion.form>
            ) : (
              /* REGISTER step formulation from Screen 3 specifications */
              <motion.div
                key="register-form"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-4"
              >
                {registerStep === 1 ? (
                  <form onSubmit={handleRegisterSendCode} className="space-y-4">
                    {/* Security Info callout box */}
                    <div className="p-4 rounded-lg bg-purple-50/50 border-l-4 border-[#585595] text-xs leading-relaxed text-[#585595]/95">
                      <strong className="block font-bold mb-1">🎓 世新在校生身份限定：</strong>
                      為保障教職員與學生的實名制租屋安全，本平台限開放世新學子。請鍵入 <strong>@mail.shu.edu.tw</strong> 結尾之校園信箱。
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 block">學校核發之學生信箱</label>
                      <div className="relative">
                        <School className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          value={registerEmail}
                          onChange={(e) => setRegisterEmail(e.target.value)}
                          placeholder="學號@mail.shu.edu.tw"
                          className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#585595]/20 focus:border-[#585595] text-xs font-semibold"
                        />
                      </div>
                      {emailError && (
                        <p className="text-[10px] text-red-500 font-bold mt-1">{emailError}</p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-[#585595] text-white py-3.5 rounded-lg font-bold text-xs hover:bg-[#4a4780] transition-colors shadow-sm active:scale-98 disabled:opacity-50"
                    >
                      {isLoading ? '處理中...' : '發送校園驗證碼'}
                    </button>

                    <div className="relative my-4">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-slate-100" />
                      </div>
                      <div className="relative flex justify-center text-[10px] uppercase">
                        <span className="bg-white px-2 text-slate-400 font-medium font-mono">OR</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={onGoogleSignIn}
                      disabled={isLoading}
                      className="w-full flex items-center justify-center gap-2.5 border border-slate-200 hover:border-purple-300 hover:bg-purple-50/10 text-slate-700 py-3 rounded-lg text-xs font-bold transition-all disabled:opacity-50 active:scale-98"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      <span>使用 Google 快速驗證登入</span>
                    </button>
                  </form>
                ) : (
                  /* STEP 2: Verify Code sequences */
                  <form onSubmit={handleVerifyCode} className="space-y-5">
                    <div className="text-center space-y-1.5">
                      <h4 className="font-extrabold text-[#585595] text-sm">輸入四位驗證碼</h4>
                      <p className="text-xs text-slate-500">
                        密碼已發送至學友信箱 <span className="font-medium text-slate-800">{registerEmail}</span>
                      </p>
                    </div>

                    {/* Numeric sequences squares */}
                    <div className="flex justify-center gap-3">
                      {registerCode.map((char, index) => (
                        <input
                          key={index}
                          ref={codeRefs[index]}
                          type="text"
                          required
                          maxLength={1}
                          pattern="[0-9]*"
                          value={char}
                          onChange={(e) => handleCodeChange(index, e.target.value)}
                          onKeyDown={(e) => handleCodeKeyDown(index, e)}
                          className="w-12 h-14 text-center text-lg font-extrabold rounded-lg border border-slate-200 focus:border-[#585595] focus:ring-2 focus:ring-[#585595]/20 outline-none"
                        />
                      ))}
                    </div>

                    <div className="space-y-2">
                      <button
                        type="submit"
                        className="w-full bg-[#585595] text-white py-3 rounded-lg font-bold text-xs hover:bg-[#4a4780] transition-colors shadow-sm active:scale-98"
                      >
                        確認並完成身份核驗
                      </button>
                      <button
                        type="button"
                        onClick={() => setRegisterStep(1)}
                        className="w-full text-center text-xs text-slate-400 font-bold hover:text-slate-600 transition-colors py-2"
                      >
                        返回重鍵驗證信箱
                      </button>
                    </div>
                  </form>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Privacy Disclaimer */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center text-[10px] text-slate-400 leading-normal">
            點擊確認即表示您同意本平台的{' '}
            <a href="#terms" className="text-[#585595] underline font-bold">
              服務約約
            </a>{' '}
            與{' '}
            <a href="#privacy" className="text-[#585595] underline font-bold">
              隱私安全規範
            </a>
          </div>
        </div>
      </section>
    </motion.div>
  );
}
