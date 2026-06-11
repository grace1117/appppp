import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, Globe2, BellRing, HelpCircle, LogOut, ChevronRight, CheckCircle, Smartphone, PlusCircle, ArrowUpRight, X, Sparkles, Sliders } from 'lucide-react';
import { UserProfile, Property, UserRequirements } from '../types';

interface ProfileProps {
  user: UserProfile;
  properties: Property[];
  favorites: string[];
  comparedIds: string[];
  onNavigateToTab: (tab: 'home' | 'search' | 'favorites' | 'profile' | 'details' | 'comparison' | 'notifications' | 'auth') => void;
  onLogout: () => void;
  onUpdateProfile: (name: string, studentId: string, department: string, avatar: string) => Promise<void>;
  onUpdateRequirements: (requirements: UserRequirements) => Promise<void>;
}

export default function Profile({
  user,
  properties,
  favorites,
  comparedIds,
  onNavigateToTab,
  onLogout,
  onUpdateProfile,
  onUpdateRequirements,
}: ProfileProps) {
  // Take saved items
  const savedProperties = properties.filter((p) => favorites.includes(p.id)).slice(0, 2);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user.name);
  const [editStudentId, setEditStudentId] = useState(user.studentId);
  const [editDepartment, setEditDepartment] = useState(user.department);
  const [editAvatar, setEditAvatar] = useState(user.avatar);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const [isEditingReq, setIsEditingReq] = useState(false);
  const [reqMaxPrice, setReqMaxPrice] = useState(user.requirements?.maxPrice || 15000);
  const [reqMaxDistance, setReqMaxDistance] = useState(user.requirements?.maxDistance || '10分鐘');
  const [reqNeedElevator, setReqNeedElevator] = useState(user.requirements?.needElevator || false);
  const [reqAmenities, setReqAmenities] = useState<string[]>(user.requirements?.amenities || []);
  const [isSavingReq, setIsSavingReq] = useState(false);
  const [saveReqError, setSaveReqError] = useState('');

  // Keep states synchronized when user from firestore feed updates
  useEffect(() => {
    setEditName(user.name);
    setEditStudentId(user.studentId);
    setEditDepartment(user.department);
    setEditAvatar(user.avatar);
    
    if (user.requirements) {
      setReqMaxPrice(user.requirements.maxPrice);
      setReqMaxDistance(user.requirements.maxDistance);
      setReqNeedElevator(user.requirements.needElevator);
      setReqAmenities(user.requirements.amenities || []);
    }
  }, [user]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      {/* Bento Block 1: User Profile details */}
      <section className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-5 relative">
        <div 
          className="relative cursor-pointer group" 
          onClick={() => {
            setEditName(user.name);
            setEditStudentId(user.studentId);
            setEditDepartment(user.department);
            setEditAvatar(user.avatar);
            setIsEditing(true);
            setSaveError('');
          }}
          title="修改頭像"
        >
          <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-purple-200 group-hover:border-[#585595] transition-colors">
            <img
              src={user.avatar}
              alt="頭像"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="absolute bottom-0 right-0 bg-[#585595] text-white p-1.5 rounded-full border border-white shadow-sm">
            <span className="text-[10px] font-bold leading-none block">✎</span>
          </div>
        </div>

        <div className="text-center sm:text-left flex-1 space-y-1">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h3 className="text-lg font-bold text-slate-900">{user.name}</h3>
            <span className="bg-purple-100/60 border border-purple-150 text-[#585595] px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-[#585595] fill-purple-100" />
              世新在校生
            </span>
          </div>
          <p className="text-xs text-slate-400">
            學號：{user.studentId} · {user.department}
          </p>

          {/* Quick numbers summary state */}
          <div className="flex justify-center sm:justify-start gap-5 pt-2">
            <div>
              <p className="text-base font-extrabold text-[#585595]">{favorites.length}</p>
              <p className="text-[10px] text-slate-400 font-medium">我的收藏</p>
            </div>
            <div className="w-[1px] h-6 bg-slate-200 self-center" />
            <div>
              <p className="text-base font-extrabold text-[#585595]">{comparedIds.length}</p>
              <p className="text-[10px] text-slate-400 font-medium">比較分析中</p>
            </div>
          </div>
        </div>
        
        {/* Trigger profile editor */}
        <button
          onClick={() => {
            setEditName(user.name);
            setEditStudentId(user.studentId);
            setEditDepartment(user.department);
            setEditAvatar(user.avatar);
            setIsEditing(true);
            setSaveError('');
          }}
          className="px-4 py-2 border border-[#585595] text-[#585595] hover:bg-purple-50 text-xs font-bold rounded-lg transition-colors shadow-xs"
        >
          編輯個人資料
        </button>
      </section>

      {/* User Housing Requirements Widget */}
      <section className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center pb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-xl">💡</span>
            <div>
              <h4 className="font-extrabold text-slate-800 text-sm">我的租屋需求</h4>
              <p className="text-[10px] text-slate-400">這是 AI 比較報告與智慧排序的主要篩選基準</p>
            </div>
          </div>
          <button
            onClick={() => {
              setReqMaxPrice(user.requirements?.maxPrice || 15000);
              setReqMaxDistance(user.requirements?.maxDistance || '10分鐘');
              setReqNeedElevator(user.requirements?.needElevator || false);
              setReqAmenities(user.requirements?.amenities || []);
              setSaveReqError('');
              setIsEditingReq(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-[#585595] text-[#585595] hover:bg-purple-50 text-[11px] font-bold rounded-lg transition-colors"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>修改需求條件</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Requirement Item 1: Price */}
          <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">月租金預算限額</span>
            <span className="text-xs font-extrabold text-slate-800 focus:outline-none">
              ${user.requirements?.maxPrice?.toLocaleString() || '15,000'} 元以下
            </span>
          </div>

          {/* Requirement Item 2: Distance */}
          <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">步行至校時間</span>
            <span className="text-xs font-extrabold text-slate-800">
              {user.requirements?.maxDistance || '10分鐘'} 內
            </span>
          </div>

          {/* Requirement Item 3: Elevator */}
          <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">升降電梯設施</span>
            <span className="text-xs font-extrabold text-slate-800">
              {user.requirements?.needElevator ? '必須有電梯 🛗' : '不限 / 均可'}
            </span>
          </div>

          {/* Requirement Item 4: Amenities */}
          <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100 space-y-1 col-span-1 min-w-0">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">特定裝置需求</span>
            <span className="text-xs font-extrabold text-[#585595] truncate block">
              {user.requirements?.amenities && user.requirements.amenities.length > 0
                ? user.requirements.amenities.join(', ')
                : '無特別指定'}
            </span>
          </div>
        </div>

        {user.requirements?.rawText && (
          <div className="p-3 bg-purple-50/45 rounded-xl border border-purple-100/30 text-xs text-slate-600 leading-relaxed italic relative">
            <span className="absolute -top-2 left-3 px-1.5 py-0.5 bg-purple-100 text-purple-700 text-[9px] font-bold rounded-md not-italic">
              AI 智能擷取偏好描述
            </span>
            <p className="mt-1">「 {user.requirements.rawText} 」</p>
          </div>
        )}
      </section>

      {/* Bento Block 2: Comparison Analysis reports widget */}
      <section className="bg-gradient-to-br from-[#585595] to-[#7471b6] p-5 rounded-2xl text-white shadow-md relative overflow-hidden flex flex-col justify-between">
        <div className="space-y-1.5 relative z-10 max-w-[80%]">
          <h4 className="text-lg font-extrabold tracking-wide">房源比較分析報告</h4>
          <p className="text-xs text-purple-100 leading-relaxed font-normal">
            依據您的條件設定，系統已將精選的 {comparedIds.length} 間房源，產出包含租金、水電、押金以及步行 commiting 的深度合規對比。
          </p>
        </div>

        <button
          onClick={() => onNavigateToTab('comparison')}
          className="mt-5 relative z-10 bg-white/20 hover:bg-white/35 backdrop-blur-md text-white border border-white/20 py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 self-start shadow-xs hover:shadow-md"
        >
          <span>查看比對報告</span>
          <ArrowUpRight className="w-3.5 h-3.5 animate-pulse" />
        </button>

        {/* Floating icon deco */}
        <div className="absolute right-3 top-3 opacity-15 scale-[1.3] text-white">⚖️</div>
      </section>

      {/* Bento Block 3: My bookmarks short list */}
      <section className="space-y-3">
        <div className="flex justify-between items-center text-xs">
          <h4 className="font-bold text-slate-800 text-sm">❤️ 我的收藏</h4>
          <button
            onClick={() => onNavigateToTab('favorites')}
            className="text-[#585595] font-bold hover:underline"
          >
            管理全部
          </button>
        </div>

        {/* Display actual favorites or explore shortcut */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {savedProperties.map((prop) => (
            <div
              key={prop.id}
              onClick={() => onNavigateToTab('favorites')}
              className="bg-white hover:bg-slate-50 border border-slate-200 rounded-xl p-3 flex gap-3 cursor-pointer transition-colors shadow-xs"
            >
              <div className="w-14 h-14 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                <img
                  src={prop.image}
                  alt={prop.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="min-w-0 flex-1 flex flex-col justify-center">
                <h5 className="font-bold text-slate-900 text-xs truncate">{prop.title}</h5>
                <p className="text-[10px] text-slate-400">{prop.location}</p>
                <p className="text-[#ba1a1a] font-extrabold text-xs mt-0.5">
                  ${prop.price.toLocaleString()}/月
                </p>
              </div>
            </div>
          ))}

          {/* Add bookmark button explore */}
          <div
            onClick={() => onNavigateToTab('search')}
            className="border-2 border-dashed border-slate-200/80 hover:bg-purple-50/10 hover:border-purple-200 rounded-xl flex items-center justify-center p-3 text-slate-400 hover:text-[#585595] transition-colors cursor-pointer gap-2"
          >
            <PlusCircle className="w-5 h-5 text-slate-400 group-hover:scale-105 transition-transform" />
            <span className="text-xs font-semibold">探索更多房源</span>
          </div>
        </div>
      </section>

      {/* Settings list category */}
      <section className="space-y-3">
        <h4 className="font-bold text-slate-800 text-sm">系統設定</h4>
        
        <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden shadow-xs">
          {/* Privacy */}
          <div className="p-4 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-purple-50 flex items-center justify-center text-[#585595]">
                <ShieldAlert className="w-4.5 h-4.5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">隱私與安全性</p>
                <p className="text-[10px] text-slate-400">管理您的帳號授權、信箱驗證與資訊保護</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>

          {/* Language */}
          <div className="p-4 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-purple-50 flex items-center justify-center text-[#585595]">
                <Globe2 className="w-4.5 h-4.5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">語言設定 (Language)</p>
                <p className="text-[10px] text-slate-400">繁體中文 (台灣)</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>

          {/* Notifications Toggle */}
          <div className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-purple-50 flex items-center justify-center text-[#585595]">
                <BellRing className="w-4.5 h-4.5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">通知與推播設定設定</p>
                <p className="text-[10px] text-slate-400">房源最新更新動向與校方諮詢推播頻率</p>
              </div>
            </div>
            {/* Custom switch */}
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#585595]"></div>
            </label>
          </div>

          {/* Help */}
          <div className="p-4 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-purple-50 flex items-center justify-center text-[#585595]">
                <HelpCircle className="w-4.5 h-4.5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">幫助中心</p>
                <p className="text-[10px] text-slate-400">包含租賃契約範本與愛護學子租屋諮詢專線</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>

          {/* Logout button */}
          <div
            onClick={onLogout}
            className="p-4 flex items-center justify-between bg-red-50/20 hover:bg-red-50/60 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center text-[#ba1a1a]">
                <LogOut className="w-4.5 h-4.5" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#ba1a1a]">登出此帳號</p>
                <p className="text-[10px] text-slate-400">
                  登出 {user.studentId}，將關閉個人資料防線
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-red-300" />
          </div>
        </div>
      </section>

      {/* Version disclaimer */}
      <footer className="text-center py-6 opacity-45">
        <p className="text-[10px] font-bold text-slate-400">世新大學租屋整合平台 v2.4.0</p>
        <p className="text-[10px] text-slate-450 mt-1">© 2026 Shih Hsin University</p>
      </footer>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white w-full max-w-md rounded-2xl border border-purple-100 p-6 space-y-4 shadow-2xl relative overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-purple-50 pb-3">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                📂 編輯世新在校資料
              </h3>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="p-1 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!editName.trim()) {
                  setSaveError('請輸入您的姓名');
                  return;
                }
                if (!editStudentId.trim()) {
                  setSaveError('請輸入您的學號');
                  return;
                }
                setIsSaving(true);
                setSaveError('');
                try {
                  await onUpdateProfile(editName.trim(), editStudentId.trim(), editDepartment, editAvatar);
                  setIsEditing(false);
                } catch (err: any) {
                  setSaveError(err.message || '儲存失敗，請確認網路與登入狀態');
                } finally {
                  setIsSaving(false);
                }
              }}
              className="space-y-4"
            >
              {saveError && (
                <div className="p-3 rounded-lg bg-red-50 text-red-600 text-xs font-bold leading-relaxed border border-red-100">
                  ⚠️ {saveError}
                </div>
              )}

              {/* 1. Profile Avatar Picker */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 block">學生頭像設置</label>
                <div className="flex justify-center gap-2.5 py-1.5 bg-slate-50/50 rounded-xl border border-slate-100">
                  {[
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
                    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
                    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
                    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
                    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150'
                  ].map((preset, index) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setEditAvatar(preset)}
                      className={`relative w-11 h-11 rounded-full overflow-hidden border-2 transition-all ${
                        editAvatar === preset ? 'border-[#585595] scale-110 shadow-sm' : 'border-transparent opacity-60 hover:opacity-90'
                      }`}
                    >
                      <img src={preset} alt={`Preset ${index + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      {editAvatar === preset && (
                        <div className="absolute inset-0 bg-[#585595]/15 flex items-center justify-center">
                          <span className="text-[10px] text-white">✓</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 block font-medium">或自訂頭像 URL 連結：</span>
                  <input
                    type="url"
                    value={editAvatar}
                    onChange={(e) => setEditAvatar(e.target.value)}
                    placeholder="輸入 https:// 形式的圖片網址"
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#585595]/20 focus:outline-none focus:border-[#585595] bg-white outline-none"
                  />
                </div>
              </div>

              {/* 2. State Input: Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 block">學生姓名</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="例如：李小明"
                  className="w-full text-xs font-semibold p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#585595]/15 focus:border-[#585595] bg-white outline-none"
                />
              </div>

              {/* 3. State Input: Student ID */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 block">學號認證</label>
                <input
                  type="text"
                  required
                  value={editStudentId}
                  onChange={(e) => setEditStudentId(e.target.value)}
                  placeholder="例如：A112010042"
                  className="w-full text-xs font-mono p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#585595]/15 focus:border-[#585595] bg-white outline-none"
                />
              </div>

              {/* 4. State Select: Department */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 block">原就讀系所</label>
                <select
                  value={editDepartment}
                  onChange={(e) => setEditDepartment(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#585595]/15 focus:border-[#585595] bg-white outline-none"
                >
                  <option value="新聞學系">新聞學系</option>
                  <option value="廣播電視電影學系">廣播電視電影學系</option>
                  <option value="公共關係暨廣告學系">公共關係暨廣告學系</option>
                  <option value="圖文傳播學系">圖文傳播學系</option>
                  <option value="資訊傳播學系">資訊傳播學系</option>
                  <option value="傳播管理學系">傳播管理學系</option>
                  <option value="資訊管理學系">資訊管理學系</option>
                  <option value="財務金融學系">財務金融學系</option>
                  <option value="法律學系">法律學系</option>
                  <option value="企業管理學系">企業管理學系</option>
                  <option value="行政管理學系">行政管理學系</option>
                  <option value="觀光學系">觀光學系</option>
                  <option value="經濟學系">經濟學系</option>
                  <option value="社會心理學系">社會心理學系</option>
                  <option value="英語學系">英語學系</option>
                  <option value="日本語文學系">日本語文學系</option>
                  <option value="數位多媒體設計學系">數位多媒體設計學系</option>
                  <option value="傳播學院">傳播學院</option>
                  <option value="人文社會學院">人文社會學院</option>
                  <option value="管理學院">管理學院</option>
                  <option value="法學院">法學院</option>
                </select>
              </div>

              {/* Control Action Buttons */}
              <div className="flex justify-end gap-2.5 pt-4 border-t border-purple-50">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="py-2 px-4 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="py-2 px-5 rounded-lg bg-[#585595] hover:bg-[#474480] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1"
                >
                  {isSaving ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>儲存中...</span>
                    </>
                  ) : (
                    '儲存變更'
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Edit Requirements Modal */}
      {isEditingReq && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white w-full max-w-md rounded-2xl border border-purple-100 p-6 space-y-4 shadow-2xl relative overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-purple-50 pb-3">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                ⚙️ 編輯我的世新租屋需求
              </h3>
              <button
                type="button"
                onClick={() => setIsEditingReq(false)}
                className="p-1 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setIsSavingReq(true);
                setSaveReqError('');
                try {
                  await onUpdateRequirements({
                    maxPrice: Number(reqMaxPrice),
                    maxDistance: reqMaxDistance,
                    needElevator: reqNeedElevator,
                    amenities: reqAmenities,
                    rawText: user.requirements?.rawText || ''
                  });
                  setIsEditingReq(false);
                } catch (err: any) {
                  setSaveReqError(err.message || '儲存失敗，請重試');
                } finally {
                  setIsSavingReq(false);
                }
              }}
              className="space-y-4"
            >
              {saveReqError && (
                <div className="p-3 rounded-lg bg-red-50 text-red-600 text-xs font-bold border border-red-100">
                  ⚠️ {saveReqError}
                </div>
              )}

              {/* Requirement 1: Price Budget Limit */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 block">租金預算上限 (元 / 月)</label>
                <input
                  type="number"
                  min="3000"
                  max="50000"
                  step="500"
                  value={reqMaxPrice}
                  onChange={(e) => setReqMaxPrice(Number(e.target.value))}
                  className="w-full text-xs font-semibold p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#585595]/15 focus:border-[#585595] bg-white outline-none"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-semibold px-0.5">
                  <span>超低預算 $4k起</span>
                  <span>熱門 $8k - $12k</span>
                  <span>舒適 $15k+</span>
                </div>
              </div>

              {/* Requirement 2: Distance walking choice */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 block">步行至學校距離</label>
                <select
                  value={reqMaxDistance}
                  onChange={(e) => setReqMaxDistance(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#585595]/15 focus:border-[#585595] bg-white outline-none"
                >
                  <option value="5分鐘">5 分鐘內 (極度方便，近世新校門)</option>
                  <option value="10分鐘">10 分鐘內 (合適，包括試院路及木柵路一段)</option>
                  <option value="15分鐘">15 分鐘內 (稍有運動，價格可能較實惠)</option>
                  <option value="無限制">無限制 (只要交通方便都算)</option>
                </select>
              </div>

              {/* Requirement 3: Elevator toggle switcher */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <label className="text-xs font-bold text-slate-800 block">必須有電梯設施 🛗</label>
                  <span className="text-[10px] text-slate-400 font-medium">過濾掉高樓層無電梯公寓</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reqNeedElevator}
                    onChange={(e) => setReqNeedElevator(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#585595]"></div>
                </label>
              </div>

              {/* Requirement 4: Amenities checkbox multiple selectors */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 block">期望隨附的設備 & 服務</label>
                <div className="grid grid-cols-3 gap-2 py-1">
                  {['冷氣', '冰箱', '洗衣機', '電視', '網路', '陽台', '套房', '雅房', '電梯', '車位'].map((item) => {
                    const isChecked = reqAmenities.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => {
                          if (isChecked) {
                            setReqAmenities(reqAmenities.filter((a) => a !== item));
                          } else {
                            setReqAmenities([...reqAmenities, item]);
                          }
                        }}
                        className={`py-1.5 px-2 rounded-lg border text-[11px] font-bold transition-all truncate text-center ${
                          isChecked
                            ? 'bg-purple-50 border-[#585595] text-[#585595] shadow-xs'
                            : 'bg-white border-slate-200 text-slate-500 hover:border-slate-350'
                        }`}
                      >
                        {item}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-2.5 pt-4 border-t border-purple-50">
                <button
                  type="button"
                  onClick={() => setIsEditingReq(false)}
                  className="py-2 px-4 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isSavingReq}
                  className="py-2 px-5 rounded-lg bg-[#585595] hover:bg-[#474480] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1"
                >
                  {isSavingReq ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>儲存中...</span>
                    </>
                  ) : (
                    '儲存租屋條件'
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
