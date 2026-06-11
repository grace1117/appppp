import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Share2, ShieldCheck, Mail, MapPin, Layers, Wifi, Wind, Refrigerator, Clipboard, Star, CheckCircle2, MessageSquare, Heart, RefreshCw, Sliders, Sparkles, Clock, AlertTriangle, Zap } from 'lucide-react';
import { Property, Review, UserProfile } from '../types';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { collection, doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';

interface DetailsProps {
  property: Property;
  reviews: Review[];
  onBack: () => void;
  onNavigateToTab: (tab: 'home' | 'search' | 'favorites' | 'profile' | 'details' | 'comparison' | 'notifications' | 'auth') => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onToggleComparison: (property: Property) => void;
  isInComparison: boolean;
  user: UserProfile | null;
  onAddReview: (content: string, rating: number) => Promise<void>;
}

export default function Details({
  property,
  reviews,
  onBack,
  onNavigateToTab,
  isFavorite,
  onToggleFavorite,
  onToggleComparison,
  isInComparison,
  user,
  onAddReview,
}: DetailsProps) {
  const [copied, setCopied] = useState(false);
  const [newReviewContent, setNewReviewContent] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // States for dynamic AI personalized utility estimation
  const [showHabitsForm, setShowHabitsForm] = useState(false);
  const [isEstimating, setIsEstimating] = useState(false);
  const [estimationResult, setEstimationResult] = useState<{
    summerElectric: number;
    summerWater: number;
    winterElectric: number;
    winterWater: number;
    electricityPercent: number;
    waterPercent: number;
    analysisReport: string;
  } | null>(null);
  const [activeEstimateSeason, setActiveEstimateSeason] = useState<'summer' | 'winter' | 'default'>('default');

  const [habits, setHabits] = useState({
    occupants: 1,
    homeHours: '20:00–09:00',
    acFrequency: '適度開啟（高溫才開）',
    showerDetails: '每天 1 次，每次約 15 分鐘',
    waterHeaterType: '儲熱式電熱水器',
    acHours: 6,
    tvHours: 1,
    computerHours: 8,
    dehumidifierHours: 2,
    waterHabits: '一週自洗衣服 1-2 次，不開伙外食族',
  });

  // Landlord ratings collection synchronization state
  const [landlordRatings, setLandlordRatings] = useState<any[]>([]);
  const [hasUserRatedLandlord, setHasUserRatedLandlord] = useState(false);
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  const [landlordForm, setLandlordForm] = useState({
    overall: 5,
    response: 5,
    attitude: 5,
    repair: 5,
    contract: 5,
    deposit: 5,
    subsidies: 5,
    comment: '',
  });

  // Pull real-time landlord ratings from Firestore subcollection
  useEffect(() => {
    if (!property.id) return;
    const ratingsRef = collection(db, 'properties', property.id, 'landlord_ratings');
    const unsub = onSnapshot(ratingsRef, (snapshot) => {
      const loaded: any[] = [];
      let rated = false;
      snapshot.forEach((snapDoc) => {
        const d = snapDoc.data();
        loaded.push({ id: snapDoc.id, ...d });
        if (auth.currentUser && d.userId === auth.currentUser.uid) {
          rated = true;
        }
      });

      // Seed mock records only if clean to prevent empty UI states
      if (snapshot.empty) {
        const sampleRatings = [
          {
            id: 'sample-l1',
            userId: 'sample-user-1',
            overallRating: 5,
            responseSpeed: 5,
            communicationAttitude: 5,
            repairEfficiency: 5,
            contractTransparency: 5,
            depositReturnFairness: 5,
            assistanceSubsidies: 4,
            comment: '報修冷氣後隔天就處理完成，房東人真的很好，住在世新這一帶非常有保障！',
            createdAt: { seconds: Date.now() / 1000 - 86400 * 20 }
          },
          {
            id: 'sample-l2',
            userId: 'sample-user-2',
            overallRating: 4,
            responseSpeed: 4,
            communicationAttitude: 4,
            repairEfficiency: 5,
            contractTransparency: 5,
            depositReturnFairness: 4,
            assistanceSubsidies: 5,
            comment: '訊息通常在幾小時內回覆，很好溝通。退租時押金也依照合約順利退還，令人信賴！',
            createdAt: { seconds: Date.now() / 1000 - 86400 * 10 }
          }
        ];
        setLandlordRatings(sampleRatings);
        setHasUserRatedLandlord(false);
      } else {
        setLandlordRatings(loaded);
        setHasUserRatedLandlord(rated);
      }
    }, (err) => {
      console.error("Landlord ratings load error intercepted: ", err);
      handleFirestoreError(err, OperationType.LIST, `properties/${property.id}/landlord_ratings`);
    });

    return () => unsub();
  }, [property.id, user]);

  const handleShare = () => {
    setCopied(true);
    navigator.clipboard.writeText(window.location.href);
    setTimeout(() => setCopied(false), 2000);
  };

  // Safe defaults for property variables
  let rent = property.costBreakdown?.rent ?? property.price;
  let electric = property.costBreakdown?.electric ?? 800;
  let water = property.costBreakdown?.water ?? 200;
  let management = property.costBreakdown?.management ?? 300;

  // Dynamically overlay estimate costs based on selected active season
  if (estimationResult && activeEstimateSeason === 'summer') {
    electric = estimationResult.summerElectric;
    water = estimationResult.summerWater;
  } else if (estimationResult && activeEstimateSeason === 'winter') {
    electric = estimationResult.winterElectric;
    water = estimationResult.winterWater;
  }

  const total = rent + electric + water + management;

  const rentPercent = Math.round((rent / total) * 100);
  const electricPercent = Math.round((electric / total) * 100);
  const otherPercent = 100 - rentPercent - electricPercent;

  const hasElevator = 
    (property.tags && property.tags.some(tag => tag.includes('電梯'))) ||
    (property.amenities && property.amenities.some(amenity => amenity.includes('電梯'))) ||
    property.title.includes('電梯') ||
    (property.description && (property.description.includes('電梯') || property.description.includes('電梯大樓'))) ||
    (property.floor && property.floor.includes('電梯'));

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6 pb-28 pt-1"
    >
      {/* Top Gallery Layer */}
      <section className="relative aspect-video rounded-2xl overflow-hidden bg-slate-100 shadow-sm border border-slate-150">
        <img
          src={property.image}
          alt={property.title}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-4 left-4 flex gap-2">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-white/95 backdrop-blur-md flex items-center justify-center text-slate-800 hover:bg-slate-101 shadow-sm transition-all active:scale-90"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>
        
        <div className="absolute top-4 right-4 flex gap-2">
          {/* Share */}
          <button
            onClick={handleShare}
            className="w-9 h-9 rounded-full bg-white/95 backdrop-blur-md flex items-center justify-center text-slate-800 hover:bg-slate-101 shadow-sm relative"
          >
            {copied ? <span className="text-[10px] font-bold text-green-600">已剪貼</span> : <Share2 className="w-4.5 h-4.5" />}
          </button>
        </div>

        <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md">
          1 / 5
        </div>
      </section>

      {/* Title block with tags & Trust Verification badges */}
      <section className="space-y-3">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-2xl font-bold text-slate-900 leading-tight">
            {property.title}
          </h2>
          <p className="text-xs text-slate-500 flex items-center gap-1">
            <MapPin className="w-4 h-4 text-[#585595]" />
            <span>台北市文山區 · 鄰近世新大學校區</span>
          </p>
        </div>

        {/* Dynamic badges */}
        <div className="flex flex-wrap gap-2 pt-1">
          <span className="px-3 py-1 bg-purple-50 text-[#585595] rounded-lg text-xs font-semibold flex items-center gap-1">
            🛏️ {property.title.includes('套房') ? '獨立套房' : '雅房'}
          </span>
          <span className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 ${
            hasElevator 
              ? 'bg-emerald-50 text-emerald-700' 
              : 'bg-amber-50 text-amber-700'
          }`}>
            {hasElevator ? '🏢 有電梯設備' : '🏃 無電梯 / 走樓梯'}
          </span>
          <span className="px-3 py-1 bg-purple-50 text-[#585595] rounded-lg text-xs font-semibold flex items-center gap-1">
            🐾 寵物友善
          </span>
        </div>

        {/* Verification badging from specimen */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50 border border-slate-200/50 rounded-xl">
          <div className="flex items-center gap-2 text-[#585595]">
            <ShieldCheck className="w-5 h-5" />
            <span className="text-xs font-bold tracking-wide">世新租屋平台校方認證</span>
          </div>
        </div>
      </section>

      {/* Pricing Analysis - Donut Chart Representation matching Screen 4 spec */}
      <section className="bg-[#ffffff] p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex justify-between items-center border-b border-purple-50 pb-2 flex-wrap gap-2">
          <div className="flex items-center gap-2 text-[#585595]">
            <span className="text-base font-bold flex items-center gap-1.5">
              📊 費用佔比分析
            </span>
            {estimationResult && (
              <span className="bg-[#585595]/10 text-[#585595] text-[10px] font-extrabold px-1.5 py-0.5 rounded-md flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-[#585595] fill-[#585595]" /> AI已重新估算
              </span>
            )}
          </div>

          {estimationResult && (
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border text-[11px] font-bold">
              <button 
                type="button"
                onClick={() => setActiveEstimateSeason('summer')}
                className={`px-2 py-1 rounded transition-all cursor-pointer ${activeEstimateSeason === 'summer' ? 'bg-[#585595] text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                🌞 夏季估算
              </button>
              <button 
                type="button"
                onClick={() => setActiveEstimateSeason('winter')}
                className={`px-2 py-1 rounded transition-all cursor-pointer ${activeEstimateSeason === 'winter' ? 'bg-[#585595] text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                ❄️ 冬季估算
              </button>
              <button 
                type="button"
                onClick={() => setActiveEstimateSeason('default')}
                className={`px-2 py-1 rounded transition-all cursor-pointer ${activeEstimateSeason === 'default' ? 'bg-[#585595]/20 text-slate-600 font-extrabold' : 'text-slate-400'}`}
              >
                預設
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Custom Conic Gradient design */}
          <div className="relative w-36 h-36 rounded-full flex items-center justify-center flex-shrink-0 shadow-inner select-none transition-all duration-500"
               style={{
                 background: `conic-gradient(#585595 0% ${rentPercent}%, #706daf ${rentPercent}% ${rentPercent + electricPercent}%, #e0dcfc ${rentPercent + electricPercent}% 100%)`
               }}>
            <div className="absolute w-26 h-26 bg-white rounded-full shadow-xs flex flex-col items-center justify-center">
              <span className="text-[10px] text-slate-400 font-semibold">
                {activeEstimateSeason === 'summer' ? '🌞 夏季總開銷' : activeEstimateSeason === 'winter' ? '❄️ 冬季總開銷' : '預計總花費'}
              </span>
              <span className="font-extrabold text-[#585595] text-lg transition-all duration-300">
                ${total.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Details breakdown legend */}
          <div className="flex-grow w-full space-y-3 text-sm font-medium">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-md bg-[#585595]" />
                <span className="text-slate-700">月租金 ({rentPercent}%)</span>
              </div>
              <span className="font-bold text-slate-900">NT$ {rent.toLocaleString()}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-md bg-[#706daf]" />
                <div className="flex flex-col">
                  <span>
                    {activeEstimateSeason === 'summer' ? '預估夏季水電' : activeEstimateSeason === 'winter' ? '預估冬季水電' : '預估基礎水電'} ({electricPercent}%)
                  </span>
                  <span className="text-[10px] text-amber-600 font-extrabold flex items-center gap-1 mt-0.5">
                    <Zap className="w-3 h-3 fill-amber-500 text-amber-500" />
                    {activeEstimateSeason === 'summer' ? '夏季電價：一度 6.0 元' : activeEstimateSeason === 'winter' ? '冬季電價：一度 5.0 元' : '正常電費計計：一度 5.0 元'}
                  </span>
                </div>
              </div>
              <span className="font-bold text-slate-900">NT$ {(electric + water).toLocaleString()}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-md bg-[#e0dcfc]" />
                <span className="text-slate-500">管理費 ({otherPercent}%)</span>
              </div>
              <span className="font-bold text-slate-900">NT$ {management.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* AI Estimation Result Callout Report */}
        {estimationResult && activeEstimateSeason !== 'default' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-purple-50/50 border border-purple-100 rounded-xl space-y-2 mt-4"
          >
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#585595]">
              <Sparkles className="w-4 h-4 fill-[#585595]" />
              <span>世新學長姐 AI 智能水電評估診斷報告：</span>
            </div>
            <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed font-semibold">
              {estimationResult.analysisReport}
            </p>
          </motion.div>
        )}

        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 text-xs text-slate-400">
          <div className="flex flex-col">
            <span className="italic font-medium">包含所有已知固定支出與個人使用 habits 損耗估計</span>
            <span className="font-bold text-slate-500 mt-0.5">總計：NT$ {total.toLocaleString()} / 月</span>
          </div>
          <button
            type="button"
            onClick={() => setShowHabitsForm(!showHabitsForm)}
            className="bg-[#585595] hover:bg-[#4a4780] text-white font-extrabold px-3.5 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all text-xs cursor-pointer shadow-xs"
          >
            <Sliders className="w-3.5 h-3.5" />
            {showHabitsForm ? '關閉作息填寫' : '【依我的使用習慣重新估算】'}
          </button>
        </div>

        {/* Dynamic Habit Inputs Form */}
        {showHabitsForm && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="border-t border-dashed border-slate-200 pt-4 mt-2 space-y-4 text-xs bg-slate-50/50 p-4 rounded-xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
              <span className="font-extrabold text-slate-700 flex items-center gap-1">
                ✍️ 依我的生活作息重新試算（夏/冬差異自動核實）
              </span>
              <span className="text-[10px] text-slate-400 font-bold">完全保障個人隱私</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Occupants */}
              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">1. 居住人數 (人)</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="range" 
                    min={1} 
                    max={4} 
                    value={habits.occupants} 
                    onChange={(e) => setHabits(prev => ({ ...prev, occupants: Number(e.target.value) }))}
                    className="w-full accent-[#585595] h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                  />
                  <span className="font-extrabold text-slate-800 text-sm w-6 text-center">{habits.occupants}人</span>
                </div>
              </div>

              {/* Home hours */}
              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">2. 每日最常在家時段：</label>
                <select 
                  value={habits.homeHours}
                  onChange={(e) => setHabits(prev => ({ ...prev, homeHours: e.target.value }))}
                  className="w-full p-2 border rounded-lg bg-white font-semibold outline-none text-slate-700"
                >
                  <option value="20:00–09:00">晚上睡覺與通勤 (20:00–09:00)</option>
                  <option value="17:00–10:00">傍晚起長期待在家 (17:00–10:00)</option>
                  <option value="24小時全天都在">全天候都在房間 (外宿重度宅)</option>
                  <option value="12:00–19:00">僅中午到黃昏在房間</option>
                </select>
              </div>

              {/* Shower habits */}
              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">3. 洗澡次數與時間：</label>
                <select 
                  value={habits.showerDetails}
                  onChange={(e) => setHabits(prev => ({ ...prev, showerDetails: e.target.value }))}
                  className="w-full p-2 border rounded-lg bg-white font-semibold outline-none text-slate-700"
                >
                  <option value="每天 1 次，每次約 15 分鐘">每天 1 次，每次約 15 分鐘 (標準)</option>
                  <option value="每天 2 次，每次 10 分鐘">每天 2 次，每次 10 分鐘 (運動族)</option>
                  <option value="每天 1 次，每次 30 分鐘以上">每天 1 次，熱澡放鬆洗 30 分鐘以上</option>
                  <option value="習慣戰鬥澡，每次 5 分鐘內">習慣快速戰鬥澡 (5 分鐘內)</option>
                </select>
              </div>

              {/* Water heater type */}
              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">4. 熱水器類型 (省電熱水諮詢)：</label>
                <select 
                  value={habits.waterHeaterType}
                  onChange={(e) => setHabits(prev => ({ ...prev, waterHeaterType: e.target.value }))}
                  className="w-full p-2 border rounded-lg bg-white font-semibold outline-none text-slate-700"
                >
                  <option value="儲熱式電熱水器">儲熱式電熱水器 (通常較耗電，保溫耗待機電)</option>
                  <option value="瞬熱式電熱水器">瞬熱式電熱水器 (加熱快瓦特高，洗時吃電高)</option>
                  <option value="天然氣瓦斯熱水器">天然瓦斯、天然氣或桶裝瓦斯熱水器 (瓦斯省電錢)</option>
                </select>
              </div>

              {/* Summer Ac usage hours */}
              <div className="space-y-2 col-span-1 sm:col-span-2 border-t border-slate-100 pt-3">
                <span className="font-extrabold text-slate-700 block">💡 常見生活家電之每日預估使用時數：</span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-white p-2.5 rounded-lg border">
                  
                  <div className="space-y-1 flex flex-col justify-between items-center bg-slate-50 p-1.5 rounded">
                    <span className="font-bold text-slate-500 text-[10px]">夏季冷氣</span>
                    <input 
                      type="number" 
                      min={0} 
                      max={24} 
                      value={habits.acHours} 
                      onChange={(e) => setHabits(prev => ({ ...prev, acHours: Number(e.target.value) }))}
                      className="w-12 p-1 border rounded bg-white text-xs font-bold outline-none text-center"
                    />
                    <span className="text-[9px] text-[#585595] font-extrabold">{habits.acHours} 小時/天</span>
                  </div>

                  <div className="space-y-1 flex flex-col justify-between items-center bg-slate-50 p-1.5 rounded">
                    <span className="font-bold text-slate-500 text-[10px]">筆電/桌機</span>
                    <input 
                      type="number" 
                      min={0} 
                      max={24} 
                      value={habits.computerHours} 
                      onChange={(e) => setHabits(prev => ({ ...prev, computerHours: Number(e.target.value) }))}
                      className="w-12 p-1 border rounded bg-white text-xs font-bold outline-none text-center"
                    />
                    <span className="text-[9px] text-[#585595] font-extrabold">{habits.computerHours} 小時/天</span>
                  </div>

                  <div className="space-y-1 flex flex-col justify-between items-center bg-slate-50 p-1.5 rounded">
                    <span className="font-bold text-slate-500 text-[10px]">電視娛樂</span>
                    <input 
                      type="number" 
                      min={0} 
                      max={24} 
                      value={habits.tvHours} 
                      onChange={(e) => setHabits(prev => ({ ...prev, tvHours: Number(e.target.value) }))}
                      className="w-12 p-1 border rounded bg-white text-xs font-bold outline-none text-center"
                    />
                    <span className="text-[9px] text-[#585595] font-extrabold">{habits.tvHours} 小時/天</span>
                  </div>

                  <div className="space-y-1 flex flex-col justify-between items-center bg-slate-50 p-1.5 rounded col-span-2 sm:col-span-1">
                    <span className="font-bold text-slate-500 text-[10px]">除濕/冬溫</span>
                    <input 
                      type="number" 
                      min={0} 
                      max={24} 
                      value={habits.dehumidifierHours} 
                      onChange={(e) => setHabits(prev => ({ ...prev, dehumidifierHours: Number(e.target.value) }))}
                      className="w-12 p-1 border rounded bg-white text-xs font-bold outline-none text-center"
                    />
                    <span className="text-[9px] text-[#585595] font-extrabold">{habits.dehumidifierHours} 小時/天</span>
                  </div>

                  <div className="space-y-1 flex flex-col justify-between items-center bg-green-50 p-1.5 rounded col-span-2 sm:col-span-1">
                    <span className="font-bold text-green-700 text-[10px]">電冰箱</span>
                    <span className="text-xs font-extrabold text-slate-800">24H</span>
                    <span className="text-[8px] text-green-700 font-bold">全天常規運轉</span>
                  </div>

                </div>
              </div>

              {/* Water habits block */}
              <div className="space-y-1 col-span-1 sm:col-span-2">
                <label className="font-bold text-slate-600 block">5. 用水與每日開伙習慣：</label>
                <select 
                  value={habits.waterHabits}
                  onChange={(e) => setHabits(prev => ({ ...prev, waterHabits: e.target.value }))}
                  className="w-full p-2 border rounded-lg bg-white font-semibold outline-none text-slate-700"
                >
                  <option value="一週自洗衣服 1-2 次，不開伙外食族">一週自洗衣服 1-2 次，不開伙完全外食 (基本省水)</option>
                  <option value="一週洗衣服 3 次以上，習慣天天自己開伙">一週洗衣服 3 次以上，且天天烹飪開伙 (高配水耗)</option>
                  <option value="一週洗衣服 1 次，少開伙偶爾下麵煮宵夜">一週洗衣服 1 次，偶爾配麵或宵夜簡單炊煮</option>
                  <option value="全部拿回家洗，外食族無下廚用水習慣">全部拿回家洗，天天外食無下廚</option>
                </select>
              </div>

            </div>

            <button
              type="button"
              onClick={async () => {
                setIsEstimating(true);
                try {
                  const response = await fetch('/api/utility-estimate-ai', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ habits, propertyInfo: property }),
                  });
                  const result = await response.json();
                  setEstimationResult(result);
                  setActiveEstimateSeason('summer');
                  setShowHabitsForm(false);
                } catch (e) {
                  console.error("AI estimating water electricity error", e);
                } finally {
                  setIsEstimating(false);
                }
              }}
              disabled={isEstimating}
              className="w-full bg-[#585595] text-white font-extrabold py-3.5 rounded-xl shadow-xs hover:bg-[#434070] transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {isEstimating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>AI 正在估算您專屬的夏冬季水電平均開銷...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 fill-white" />
                  <span>結合物業設備 · 啟動 AI 重新試算</span>
                </>
              )}
            </button>
          </motion.div>
        )}
      </section>

      {/* Property Details Grid & Amenities */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-4">
          <h3 className="font-bold text-slate-900 text-base">房源基礎資訊</h3>
          <div className="grid grid-cols-2 gap-3.5">
            <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl">
              <MapPin className="w-5 h-5 text-[#585595]" />
              <div>
                <p className="text-[10px] text-slate-400">位置與距離</p>
                <p className="text-xs font-bold text-slate-800">{property.distance}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl">
              <Layers className="w-5 h-5 text-[#585595]" />
              <div>
                <p className="text-[10px] text-slate-400">房源樓層</p>
                <p className="text-xs font-bold text-slate-800">{property.floor ?? '中樓層'}</p>
              </div>
            </div>

            {/* Elevator Status Block */}
            <div className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl col-span-2">
              <span className="text-lg mt-0.5" id="elevator-icon">🛗</span>
              <div>
                <p className="text-[10px] text-slate-400">升降電梯設備</p>
                <p className="text-xs font-bold text-slate-800">
                  {hasElevator 
                    ? '配備電梯大樓，進出、搬運行李、採買生活用品輕鬆省力！' 
                    : '傳統無電梯公寓，樓梯寬敞好走、公設比低，適合重視預算與健身的同學！'}
                </p>
              </div>
            </div>

            {/* Electricity rate card */}
            <div className="flex items-start gap-3 p-3 bg-amber-50/60 border border-amber-100 rounded-xl col-span-2">
              <Zap className="w-5 h-5 text-amber-500 fill-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] text-amber-700 font-extrabold flex items-center gap-1">
                  ⚡ 獨立分電表 · 電費計費基準
                </p>
                <p className="text-xs font-bold text-slate-801 mt-0.5">
                  本房源計費方式為 <span className="text-amber-750 font-extrabold text-[#585595] text-sm">一度 5.0 元</span>
                  <span className="text-slate-650 font-medium text-[11px] block mt-1">（夏季電費季節 6月 - 9月 為 一度 6.0 元，其餘季節為 一度 5.0 元。非夏季依分電表核實申報）</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Amenities List */}
        <div className="space-y-4">
          <h3 className="font-bold text-slate-900 text-base">提供設備與服務</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-2 gap-2.5">
            {(property.amenities ?? ['無綫網路', '冷氣', '冰箱', '書桌']).map((item, idx) => (
              <div 
                key={idx} 
                className="flex items-center gap-2 p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-purple-50/20 hover:border-purple-200/50 transition-all text-xs font-medium text-slate-700"
              >
                {item.includes('網路') && <Wifi className="w-4 h-4 text-[#585595]" />}
                {item.includes('冷氣') && <Wind className="w-4 h-4 text-[#585595]" />}
                {item.includes('冰箱') && <Refrigerator className="w-4 h-4 text-[#585595]" />}
                {item.includes('書桌') && <Clipboard className="w-4 h-4 text-[#585595]" />}
                {!item.includes('網路') && !item.includes('冷氣') && !item.includes('冰箱') && !item.includes('書桌') && (
                  <CheckCircle2 className="w-4 h-4 text-[#585595]" />
                )}
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Property description block with custom descriptions */}
      <section className="bg-white p-5 rounded-2xl border border-slate-200/80 space-y-3.5 shadow-xs">
        <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
          📝 房源詳細描述與房東叮嚀
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line font-medium bg-slate-50/40 p-4 rounded-xl border border-slate-100">
          {property.description || "房東非常歡迎世新大學學弟妹與同學入住！本房源採光通風極佳，定期接受學校與警消安全巡檢（各樓層均配備滅火器、逃生指示與警報裝置）。鄰近捷運景美、木柵站，周邊生鮮超市、景美夜市生活機能極佳，水電費用核實分攤，合約清楚透明，無隱藏代辦費。歡迎預約實地考察！"}
        </p>
      </section>

      {/* Landlord Service Rating System - Embedded cleanly below landlord/property info card */}
      <section className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-2 flex-wrap gap-2">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-1.5">
              🧑‍🏫 房東服務評價（真實匿名回饋）
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5 font-medium">學生退租或入住滿期後可填寫，守護資訊對稱安全</p>
          </div>

          {!hasUserRatedLandlord && (
            <button
              type="button"
              onClick={() => {
                if (!user) {
                  onNavigateToTab('auth');
                } else {
                  setShowRatingForm(!showRatingForm);
                }
              }}
              className="bg-purple-50 text-[#585595] hover:bg-purple-100 font-extrabold px-3 py-1.5 rounded-lg border border-purple-100 transition-colors text-xs flex items-center gap-1 cursor-pointer"
            >
              ★ 我要匿名評價房東
            </button>
          )}
        </div>

        {/* Aggregated Score Panel */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 bg-slate-50/60 p-4 rounded-xl border">
          <div className="flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-slate-200/60 pb-3 md:pb-0 md:pr-5">
            <span className="text-xs text-slate-400 font-bold">整體滿意度評評</span>
            <span className="text-3xl font-extrabold text-slate-900 mt-1">
              {(landlordRatings.length > 0
                ? (landlordRatings.reduce((acc, r) => acc + r.overallRating, 0) / landlordRatings.length).toFixed(1)
                : '4.8')}
            </span>
            <div className="flex items-center gap-0.5 text-amber-500 my-1 justify-center">
              {[1, 2, 3, 4, 5].map((s) => {
                const avg = landlordRatings.length > 0
                  ? landlordRatings.reduce((acc, r) => acc + r.overallRating, 0) / landlordRatings.length
                  : 4.8;
                return (
                  <Star 
                    key={s} 
                    className={`w-3.5 h-3.5 ${s <= Math.round(avg) ? 'fill-amber-400 text-amber-500' : 'text-slate-200'}`} 
                  />
                );
              })}
            </div>
            <span className="text-[10px] text-slate-400 font-bold">{landlordRatings.length} 份在校/畢業生評價</span>
          </div>

          <div className="col-span-2 space-y-2 text-xs font-semibold text-slate-600">
            {/* Compute individual sub-averages or safe demo defaults */}
            {[
              {
                label: '1. 回覆訊息速度',
                score: (landlordRatings.reduce((acc, r) => acc + (r.responseSpeed || 5), 0) / (landlordRatings.length || 1)).toFixed(1),
              },
              {
                label: '2. 溝通態度與和善度',
                score: (landlordRatings.reduce((acc, r) => acc + (r.communicationAttitude || 5), 0) / (landlordRatings.length || 1)).toFixed(1),
              },
              {
                label: '3. 報修效率與出資大方',
                score: (landlordRatings.reduce((acc, r) => acc + (r.repairEfficiency || 5), 0) / (landlordRatings.length || 1)).toFixed(1),
              },
              {
                label: '4. 租約條款與費用透明度',
                score: (landlordRatings.reduce((acc, r) => acc + (r.contractTransparency || 5), 0) / (landlordRatings.length || 1)).toFixed(1),
              },
              {
                label: '5. 退租押金返還乾脆度',
                score: (landlordRatings.reduce((acc, r) => acc + (r.depositReturnFairness || 5), 0) / (landlordRatings.length || 1)).toFixed(1),
              },
              {
                label: '6. 配合政府補助/申報稅務',
                score: (landlordRatings.reduce((acc, r) => acc + (r.assistanceSubsidies || 5), 0) / (landlordRatings.length || 1)).toFixed(1),
              }
            ].map((metric, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-36 text-slate-500 font-medium">{metric.label}</span>
                <div className="flex-grow bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-[#585595] h-full rounded-full transition-all duration-500" 
                    style={{ width: `${(Number(metric.score) / 5) * 100}%` }}
                  />
                </div>
                <span className="font-extrabold text-[#585595] font-mono text-right w-6">{metric.score}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Dynamic Form for Anonymous Rating Submission */}
        {showRatingForm && user && (
          <motion.form 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            onSubmit={async (e) => {
              e.preventDefault();
              setIsSubmittingRating(true);
              const ratingId = `landlord-r-${Date.now()}`;
              try {
                await setDoc(doc(db, 'properties', property.id, 'landlord_ratings', ratingId), {
                  id: ratingId,
                  userId: auth.currentUser?.uid || '',
                  overallRating: Number(landlordForm.overall),
                  responseSpeed: Number(landlordForm.response),
                  communicationAttitude: Number(landlordForm.attitude),
                  repairEfficiency: Number(landlordForm.repair),
                  contractTransparency: Number(landlordForm.contract),
                  depositReturnFairness: Number(landlordForm.deposit),
                  assistanceSubsidies: Number(landlordForm.subsidies),
                  comment: landlordForm.comment,
                  createdAt: serverTimestamp()
                });
                setShowRatingForm(false);
                setHasUserRatedLandlord(true);
              } catch (err) {
                console.error("Submitting landlord rating exception: ", err);
              } finally {
                setIsSubmittingRating(false);
              }
            }}
            className="p-4 bg-purple-50/20 border border-purple-100 rounded-xl space-y-4 text-xs font-semibold text-slate-700"
          >
            <div className="flex items-center gap-1.5 text-[#585595] border-b pb-1.5 border-purple-100">
              <span>✍️ 匿名評價房東服務與管理（請客觀填寫）</span>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200/80 space-y-3.5">
              <p className="text-[10px] text-slate-400 font-bold leading-normal flex items-start gap-1">
                <AlertTriangle className="w-4.5 h-4.5 text-amber-500 flex-shrink-0 mt-0.5" />
                <span>為維護本校互助精神並防止惡意抹黑或不實洗板，評價將綁定世新信箱認證，但對外呈現則**絕對匿名**（保護個人隱私並免受房東騷擾），且同一房源同一用戶帳號僅限填寫評價一次。</span>
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: '整體評價分數 (1-5 星)', key: 'overall' },
                  { label: '1. 回覆訊息速度', key: 'response' },
                  { label: '2. 溝通態度與和善度', key: 'attitude' },
                  { label: '3. 報修效率與出資大方', key: 'repair' },
                  { label: '4. 租約條款與費用透明度', key: 'contract' },
                  { label: '5. 退租押金返還乾脆度', key: 'deposit' },
                  { label: '6. 配合申報補助與稅務', key: 'subsidies' },
                ].map((inputSpec) => (
                  <div key={inputSpec.key} className="space-y-1.5">
                    <label className="text-slate-600 block">{inputSpec.label}</label>
                    <select
                      value={(landlordForm as any)[inputSpec.key]}
                      onChange={(e) => setLandlordForm(prev => ({ ...prev, [inputSpec.key]: Number(e.target.value) }))}
                      className="w-full p-2 border rounded-lg bg-white outline-none font-bold"
                    >
                      <option value="5">★★★★★ 5 / 5 (極其優秀)</option>
                      <option value="4">★★★★☆ 4 / 5 (還算滿意)</option>
                      <option value="3">★★★☆☆ 3 / 5 (普普通通)</option>
                      <option value="2">★★☆☆☆ 2 / 5 (偶爾推託)</option>
                      <option value="1">★☆☆☆☆ 1 / 5 (極其惡劣)</option>
                    </select>
                  </div>
                ))}
              </div>

              <div className="space-y-1 mt-1">
                <label className="text-slate-600 block">7. 匿名留言說明（真實描述居住與退租體驗，限600字）：</label>
                <textarea
                  required
                  rows={3}
                  value={landlordForm.comment}
                  onChange={(e) => setLandlordForm(prev => ({ ...prev, comment: e.target.value.substring(0, 600) }))}
                  placeholder="請客觀且真實地描述此位房東的管理、溝通模式及修繕態度..."
                  className="w-full text-xs font-medium p-2.5 rounded-lg border focus:outline-none focus:ring-1 focus:ring-[#585595] focus:border-[#585595] outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmittingRating || !landlordForm.comment.trim()}
              className="w-full bg-[#585595] hover:bg-[#474475] text-white font-extrabold py-3 rounded-lg text-xs transition-all disabled:opacity-50 flex items-center justify-center gap-1 cursor-pointer shadow-xs"
            >
              {isSubmittingRating ? '正在安全性加密上載中...' : '確認無誤，送出匿名誠實評價'}
            </button>
          </motion.form>
        )}

        {/* Tenant comments lists */}
        <div className="space-y-3 pt-1">
          <span className="text-slate-500 font-extrabold text-xs block">💬 同學留下的匿名詳細描述：</span>
          <div className="grid grid-cols-1 gap-3">
            {landlordRatings.map((rating) => (
              <div key={rating.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 shadow-2xs">
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold">
                  <div className="flex items-center gap-2">
                    <span className="text-[#585595] bg-[#585595]/10 px-1.5 py-0.5 rounded">匿名租客</span>
                    <span>學長姐真實經歷</span>
                  </div>
                  <span>{rating.createdAt?.seconds ? new Date(rating.createdAt.seconds * 1000).toLocaleDateString() : '近期'}</span>
                </div>
                <p className="text-xs text-slate-600 italic font-medium">
                  "{rating.comment || '房東態度很好。'}"
                </p>
                <div className="flex gap-4 text-[10px] text-slate-400 pt-1 font-bold">
                  <span>回覆訊息: <span className="text-[#585595] font-extrabold font-mono">{rating.responseSpeed || 5}★</span></span>
                  <span>報修效率: <span className="text-[#585595] font-extrabold font-mono">{rating.repairEfficiency || 5}★</span></span>
                  <span>押金返還: <span className="text-[#585595] font-extrabold font-mono">{rating.depositReturnFairness || 5}★</span></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cross-Platform Comparison State */}
      <section className="bg-purple-50/25 p-5 rounded-xl border border-purple-100">
        <h3 className="font-bold text-[#585595] text-sm flex items-center gap-1.5 mb-3">
          <RefreshCw className="w-4 h-4" /> 價格透明度與校園福利
        </h3>
        
        <div className="space-y-2.5 text-xs">
          <div className="flex justify-between items-center p-3 rounded-lg bg-white border border-slate-200/60 shadow-xs">
            <span className="font-medium text-slate-600">世新學生專屬特惠價</span>
            <span className="font-extrabold text-[#585595]">NT$ {property.price.toLocaleString()}</span>
          </div>
          
          <div className="flex justify-between items-center p-3 rounded-lg bg-white border border-slate-200/60 shadow-xs">
            <span className="font-medium text-slate-500">周邊同等房源市價估算</span>
            <span className="font-extrabold text-slate-500 line-through">NT$ {Math.round(property.price * 1.15 / 100) * 100}</span>
          </div>
          
          <p className="text-[10px] text-slate-400 leading-normal">
            世新租屋平台與各特約房東、校友簽署「學生互惠條款」，保證無房東隨意漲租，且租金合約經過本校代表專屬審閱認證！
          </p>
        </div>
      </section>

      {/* Reviews block */}
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-base">學生真實評價</h3>
          <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100 text-[#585595]">
            <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
            <span className="text-xs font-bold">{(reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : property.rating)} / 5.0</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reviews.map((rev) => (
            <div key={rev.id} className="p-4 bg-white border border-slate-150 rounded-xl space-y-2.5 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-indigo-50 text-[#585595] flex items-center justify-center font-bold text-xs uppercase border border-indigo-100">
                    {rev.avatar}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs">{rev.author}</h4>
                    <p className="text-[10px] text-slate-400">{rev.dept} 在校同學</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-amber-500">
                  <Star className="w-3.5 h-3.5 fill-amber-500" />
                  <span className="text-xs font-bold font-mono">{rev.rating}</span>
                </div>
              </div>
              <p className="text-xs text-slate-600 italic leading-relaxed">
                "{rev.content}"
              </p>
            </div>
          ))}
        </div>

        {/* Dynamic add review form */}
        <div className="bg-[#faf9fc] p-5 rounded-2xl border border-purple-100 shadow-sm space-y-4">
          <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5 border-b border-purple-50 pb-2">
            ✍️ 新增學生真實評價（加強資訊對稱）
          </h4>
          {user ? (
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!newReviewContent.trim()) return;
              setIsSubmittingReview(true);
              try {
                await onAddReview(newReviewContent, newReviewRating);
                setNewReviewContent('');
                setNewReviewRating(5);
              } finally {
                setIsSubmittingReview(false);
              }
            }} className="space-y-4">
              <div className="flex items-center gap-2.5">
                <span className="text-xs text-slate-500 font-bold">我的評分：</span>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((stars) => (
                    <button
                      key={stars}
                      type="button"
                      onClick={() => setNewReviewRating(stars)}
                      className="p-0.5 transition-transform active:scale-110"
                    >
                      <Star className={`w-5 h-5 ${stars <= newReviewRating ? 'fill-amber-400 text-amber-500' : 'text-slate-300'}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 block">居住體驗評論（回饋學弟妹）</label>
                <textarea
                  required
                  rows={3}
                  value={newReviewContent}
                  onChange={(e) => setNewReviewContent(e.target.value)}
                  placeholder="輸入您的居住心得，這能極大幫助在捷運景美、木柵、試院路一帶尋找理想校外住處的世新同學..."
                  className="w-full text-xs font-medium p-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#585595]/20 focus:border-[#585595] bg-white outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmittingReview || !newReviewContent.trim()}
                className="bg-[#585595] text-white py-2 px-5 rounded-lg text-xs font-extrabold shadow-sm hover:bg-[#4b4880] transition-colors disabled:opacity-50"
              >
                {isSubmittingReview ? '正在安全上載中...' : '送出真心評價'}
              </button>
            </form>
          ) : (
            <div className="text-center p-5 bg-white border border-slate-150 rounded-xl space-y-3">
              <p className="text-xs text-slate-500 font-bold leading-relaxed">
                🔒 登入以留學長姐真實租賃經驗與評價。幫助更多同學尋找優質好房！
              </p>
              <button
                type="button"
                onClick={() => onNavigateToTab('auth')}
                className="bg-purple-50 hover:bg-purple-100 text-[#585595] font-extrabold text-xs py-2 px-4 rounded-lg transition-colors border border-purple-150 inline-block shadow-xs"
              >
                立即學生信箱認證 / Google 快速登入
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Sticky Bottom contextual Action control */}
      <div className="fixed bottom-16 md:bottom-0 left-0 w-full bg-white/95 backdrop-blur-md border-t border-slate-200 py-3 px-4 shadow-lg z-40">
        <div className="max-w-2xl mx-auto flex gap-3">
          <button className="flex-grow bg-[#585595] text-white py-3 px-6 rounded-xl text-sm font-bold shadow-sm hover:bg-[#4b4880] transition-colors flex items-center justify-center gap-2">
            <Mail className="w-4 h-4" /> 聯絡房東預約
          </button>
          
          <button 
            type="button"
            onClick={() => onToggleComparison(property)}
            className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-all ${
              isInComparison 
                ? 'bg-purple-100 border-[#585595] text-[#585595]' 
                : 'border-slate-200 text-slate-500 hover:bg-slate-50'
            }`}
            title="加入比較分析"
          >
            <span className="text-sm font-bold">🆚</span>
          </button>

          <button 
            type="button"
            onClick={onToggleFavorite}
            className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-all ${
              isFavorite 
                ? 'bg-red-50 border-red-200 text-red-500 shadow-xs' 
                : 'border-slate-200 text-slate-400 hover:bg-slate-50'
            }`}
          >
            <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500' : ''}`} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
