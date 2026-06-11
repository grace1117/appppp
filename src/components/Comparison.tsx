import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { BarChart3, Star, Map, AlertCircle, Sparkles, ArrowLeft, Send, RefreshCw, ChevronRight } from 'lucide-react';
import { Property, UserProfile, UserRequirements } from '../types';

interface ComparisonProps {
  properties: Property[];
  comparedIds: string[];
  onBackToFavorites: () => void;
  user: UserProfile | null;
  onUpdateRequirements: (requirements: UserRequirements) => Promise<void>;
}

export default function Comparison({
  properties,
  comparedIds,
  onBackToFavorites,
  user,
  onUpdateRequirements,
}: ComparisonProps) {
  // Extract compared entities
  const comparedProperties = properties.filter((p) => comparedIds.includes(p.id));

  // Safe fallback to first three items if none chose
  const displayProperties = comparedProperties.length > 0 ? comparedProperties : properties.slice(0, 3);

  // States
  const [aiInput, setAiInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Track requirements in extremely robust local state to enable instant matching calculations
  const [localRequirements, setLocalRequirements] = useState<UserRequirements | undefined>(
    user?.requirements || {
      maxPrice: 15000,
      maxDistance: '10分鐘',
      needElevator: false,
      amenities: [],
      rawText: ''
    }
  );

  const [aiMessage, setAiMessage] = useState(
    localRequirements?.rawText
      ? `🤖 已根據您剛才輸入的：「${localRequirements.rawText}」進行精準匹配分析與物件重排！`
      : '🤖 歡迎使用世新 AI 租屋需求推薦！請在下方輸入您的具體租屋條件（如預算、電梯、特定所需的茶几沙發等，或直接輸入一段描述），AI 將自動为您解析條件並產出深度對比報告。'
  );
  const [aiReport, setAiReport] = useState('');
  const [isLoadingReport, setIsLoadingReport] = useState(false);

  // Keep local requirements in perfect sync with parent/database changes
  useEffect(() => {
    if (user?.requirements) {
      setLocalRequirements(user.requirements);
    }
  }, [user?.requirements]);

  // Score matcher function with robust safe-fallback defaults
  const calculateMatchScore = (prop: Property, req: UserRequirements | undefined) => {
    // Treat null/undefined/partial requirements with perfect default values
    const maxPrice = Number(req?.maxPrice) || 15000;
    const maxDistance = req?.maxDistance || '10分鐘';
    const needElevator = !!req?.needElevator;
    const amenities = Array.isArray(req?.amenities) ? req?.amenities : [];

    let score = 100;

    // 1. Price Budget Match (35%) - If under budget, zero penalty
    if (prop.price > maxPrice) {
      const excess = prop.price - maxPrice;
      const penalty = Math.min(35, (excess / maxPrice) * 35);
      score -= penalty;
    }

    // 2. Elevator Match (25%) - Strict layout check
    const titleAndDesc = (prop.title + ' ' + (prop.description || '') + ' ' + (prop.tags || []).join(' ')).toLowerCase();
    const hasElevator = 
      titleAndDesc.includes('電梯') || 
      (prop.floor && prop.floor.includes('電梯')) || 
      (prop.amenities && prop.amenities.some(a => a.includes('電梯')));

    if (needElevator && !hasElevator) {
      score -= 25;
    }

    // 3. Distance Match (20%) - Support for minutes & meters parsing
    let pDist = 10; // Default center fallback
    if (prop.distance) {
      const distMatch = prop.distance.match(/(\d+)/);
      if (distMatch) {
        const num = parseInt(distMatch[1]);
        if (prop.distance.includes('m') || prop.distance.includes('米')) {
          // Standard student walking speed is ~80 meters per minute
          pDist = Math.round(num / 80);
        } else {
          pDist = num;
        }
      }
    }

    let reqDist = 10;
    if (maxDistance === '5分鐘') reqDist = 5;
    else if (maxDistance === '15分鐘') reqDist = 15;
    else if (maxDistance === '無限制') reqDist = 999;

    if (pDist > reqDist) {
      const penalty = Math.min(20, ((pDist - reqDist) / 5) * 10);
      score -= penalty;
    }

    // 4. Amenities Match (20%) - Partial substring search match to avoid rigid mismatch
    if (amenities.length > 0) {
      const pAmenities = prop.amenities || [];
      const matchedCount = amenities.filter((a: string) => 
        pAmenities.some(pa => pa.toLowerCase().includes(a.toLowerCase())) || 
        titleAndDesc.includes(a.toLowerCase())
      ).length;
      const matchRatio = matchedCount / amenities.length;
      score -= (1 - matchRatio) * 20;
    }

    return Math.max(0, Math.round(score));
  };

  // Generate recommendation report API call
  const generateAiReport = async (currentRequirements: UserRequirements) => {
    setIsLoadingReport(true);
    try {
      const response = await fetch('/api/recommendation-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          properties: displayProperties,
          requirements: currentRequirements,
        }),
      });
      const data = await response.json();
      if (data.report) {
        setAiReport(data.report);
      }
    } catch (e) {
      console.error('Failed generating recommendation report', e);
    } finally {
      setIsLoadingReport(false);
    }
  };

  // Analyze free-form text input endpoint
  const handleAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim()) return;
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/compare-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: aiInput }),
      });
      const data = await response.json();

      const updatedReq: UserRequirements = {
        maxPrice: Number(data.maxPrice) || 15000,
        maxDistance: data.maxDistance || '10分鐘',
        needElevator: !!data.needElevator,
        amenities: Array.isArray(data.amenities) ? data.amenities : [],
        rawText: aiInput,
      };

      // Set local state instantly for an immediate visual match update
      setLocalRequirements(updatedReq);
      setAiMessage(data.responseMessage);

      // Persist to parents & database
      await onUpdateRequirements(updatedReq);

      // Trigger recommendation report calculation
      await generateAiReport(updatedReq);
      setAiInput('');
    } catch (err) {
      console.error('AI Analysis of requirements failed: ', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Fetch report when local requirements change or selected compared properties change
  useEffect(() => {
    if (localRequirements && displayProperties.length > 0) {
      generateAiReport(localRequirements);
    }
  }, [localRequirements, comparedIds]);

  // Markdown custom renderer
  const renderReportText = (text: string) => {
    if (!text) return null;
    return text.split('\n').map((line, i) => {
      const trimmed = line.trim();
      if (!trimmed) {
        return <div key={i} className="h-1.5" />;
      }

      // Check header
      if (trimmed.startsWith('###')) {
        return (
          <h5 key={i} className="text-sm font-extrabold text-[#585595] mt-4 mb-2">
            {trimmed.replace('###', '').trim()}
          </h5>
        );
      }

      // Check bullet points or numbered lists
      const isBullet = trimmed.startsWith('*') || trimmed.startsWith('-');
      const isNumbered = /^\d+\./.test(trimmed);

      let cleanText = trimmed;
      if (isBullet) {
        cleanText = trimmed.replace(/^[-*]\s*/, '');
      }

      // Helper to process **bold** text in a line
      const processBold = (inputStr: string) => {
        const parts = inputStr.split('**');
        return parts.map((part, idx) => {
          if (idx % 2 === 1) {
            return <strong key={idx} className="font-extrabold text-slate-900 bg-purple-50/50 px-1 rounded">{part}</strong>;
          }
          return part;
        });
      };

      if (isBullet) {
        return (
          <li key={i} className="text-xs text-slate-600 leading-relaxed list-disc ml-4 mb-1.5 font-medium">
            {processBold(cleanText)}
          </li>
        );
      }

      return (
        <p key={i} className={`text-xs text-slate-600 leading-relaxed mb-1.5 font-medium ${isNumbered ? 'pl-2 text-[#585595]' : ''}`}>
          {processBold(cleanText)}
        </p>
      );
    });
  };

  // Sort display listing strictly by price ascending (cheaper is better) to compare based on renting cost
  const scoredProperties = displayProperties
    .map((p) => ({
      ...p,
      matchScore: calculateMatchScore(p, localRequirements),
    }))
    .sort((a, b) => {
      return a.price - b.price;
    });

  return (
    <motion.div
      initial={{ opacity: 0, x: -15 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-6 pb-12"
      id="comparison-viewport-container"
    >
      {/* Visual top bar header with back trigger */}
      <div className="flex items-center justify-between border-b border-purple-50 pb-3" id="comparison-header">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToFavorites}
            className="p-1.5 rounded-full hover:bg-slate-100 transition-colors text-slate-800"
            title="返回我的收藏"
          >
            <ArrowLeft className="w-5 h-5 text-[#585595]" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-900 leading-none mb-1">比較分析報告</h2>
            <p className="text-xs text-slate-500">對比分析您的精選房源</p>
          </div>
        </div>

        {localRequirements && (
          <span className="hidden sm:inline-flex bg-purple-50 text-[#585595] border border-purple-100/50 text-[10px] font-bold px-2.5 py-1 rounded-lg">
            🔑 篩選標準：${(localRequirements.maxPrice || 15000).toLocaleString()}元 | {localRequirements.maxDistance || '10分鐘'} | {localRequirements.needElevator ? '有電梯' : '無限制'}
          </span>
        )}
      </div>

      {/* Monthly predicted budgets bars with MATCH SCORE */}
      <section className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4" id="match-scores-bar-section">
        <div className="flex justify-between items-center pb-2 border-b border-slate-50">
          <div>
            <h4 className="font-extrabold text-slate-900 text-sm">精選房源租金價格與匹配度排行</h4>
            <p className="text-[10px] text-slate-400">所有待選房源已依據「租金價格由低到高（由便宜到貴）」進行排序，並標註與您預設條件的匹配係數</p>
          </div>
          <span className="bg-purple-100 text-[#585595] px-2.5 py-0.5 rounded-full text-[10px] font-bold">
            依價格由低到高排序
          </span>
        </div>

        <div className="space-y-4">
          {scoredProperties.map((prop, index) => {
            const isMatchExcellent = prop.matchScore >= 80;
            return (
              <div key={prop.id} className="space-y-1.5 p-3 rounded-xl hover:bg-slate-50/55 border border-transparent hover:border-slate-100 transition-all">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-sm font-black text-slate-800 truncate max-w-[150px]">{prop.title}</span>
                    <span className="font-extrabold text-[#ba1a1a] bg-red-50 px-1.5 py-0.5 rounded text-[10px] scale-90 flex-shrink-0">
                       ${prop.price.toLocaleString()}/月
                    </span>
                    {index === 0 && isMatchExcellent && (
                      <span className="bg-purple-50 text-[#585595] border border-purple-100 px-1.5 rounded text-[9px] font-black scale-90 flex-shrink-0">
                        ★ 首選最佳匹配物件
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-450 font-bold">匹配度：</span>
                    <span className={`font-black text-sm ${isMatchExcellent ? 'text-[#585595]' : 'text-slate-500'}`}>
                      {prop.matchScore}%
                    </span>
                  </div>
                </div>
                
                {/* Visual score bar */}
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${prop.matchScore}%` }}
                    transition={{ duration: 0.6 }}
                    className={`h-full rounded-full ${
                      isMatchExcellent
                        ? 'bg-gradient-to-r from-[#585595] to-purple-400'
                        : 'bg-slate-400'
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Structured compare matrix table */}
      <section className="space-y-3" id="comparison-matrix-table-card">
        <h4 className="font-bold text-slate-900 text-sm">設施與地理矩陣對比</h4>
        
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
          <table className="w-full border-collapse text-xs text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-3.5 font-bold text-slate-500 w-24">指標項目</th>
                {scoredProperties.map((prop) => (
                  <th key={prop.id} className="p-3.5 font-extrabold text-[#585595] text-center min-w-[100px]">
                    {prop.title.substring(0, 5)}...
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="p-3.5 font-medium text-slate-500 bg-slate-50/50">交通距離</td>
                {scoredProperties.map((prop) => (
                  <td key={prop.id} className="p-3.5 text-center font-bold text-slate-700">
                    {prop.distance.replace('步行至校門 ', '')}
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-3.5 font-medium text-slate-500 bg-slate-50/50 border-r border-slate-100">公共設施</td>
                {scoredProperties.map((prop) => (
                  <td key={prop.id} className="p-3.5 text-center text-slate-600 leading-normal">
                    <div className="flex flex-col gap-0.5 items-center">
                      {(prop.amenities ?? ['電梯', '冰箱', '熱水器']).slice(0, 3).map((am, i) => (
                        <span key={i} className="bg-purple-100/50 text-[#585595] px-1.5 py-0.5 rounded text-[10px] font-bold">
                          {am}
                        </span>
                      ))}
                    </div>
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-3.5 font-medium text-slate-500 bg-slate-50/50">是否有電梯</td>
                {scoredProperties.map((prop) => {
                  const hasElevator = (prop.title + ' ' + (prop.description || '') + ' ' + (prop.tags || []).join(' ')).includes('電梯') || (prop.floor && prop.floor.includes('電梯'));
                  return (
                    <td key={prop.id} className="p-3.5 text-center font-bold">
                      {hasElevator ? (
                        <span className="text-[#585595] bg-purple-50 px-1.5 py-0.5 rounded">有電梯 🛗</span>
                      ) : (
                        <span className="text-slate-400">無電梯 (爬樓梯)</span>
                      )}
                    </td>
                  );
                })}
              </tr>

              <tr>
                <td className="p-3.5 font-medium text-slate-500 bg-slate-50/50">學生評分</td>
                {scoredProperties.map((prop) => (
                  <td key={prop.id} className="p-3.5 text-center">
                    <div className="inline-flex items-center gap-0.5 font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded">
                      <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                      <span>{prop.rating}</span>
                    </div>
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-3.5 font-medium text-slate-500 bg-slate-50/50">基本月租</td>
                {scoredProperties.map((prop) => (
                  <td key={prop.id} className="p-3.5 text-center font-bold text-slate-800">
                    ${prop.price.toLocaleString()}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Map visual pinning area (Screen 2 Context) */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4" id="visual-map-analysis-card">
        <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-sm">
          <img
            src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=600&auto=format&fit=crop&q=80"
            alt="地理分步圖"
            className="w-full h-full object-cover brightness-95 contrast-95 saturate-75"
            referrerPolicy="no-referrer"
          />
          {/* Mock locator pins */}
          <div className="absolute top-[30%] left-[45%] text-[#585595] animate-bounce">
            📍 <span className="bg-white/95 backdrop-blur-md px-1.5 py-0.5 rounded text-[8px] font-extrabold shadow-sm">首選 A</span>
          </div>
          <div className="absolute top-[60%] left-[65%] text-indigo-700 animate-bounce delay-150">
            📍 <span className="bg-white/95 backdrop-blur-md px-1.5 py-0.5 rounded text-[8px] font-extrabold shadow-sm">次選 B</span>
          </div>

          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 text-white">
            <span className="text-xs font-semibold flex items-center gap-1">
              🗺️ 景美 & 文山地理區位分佈
            </span>
          </div>
        </div>

        {/* Conclusion textual review */}
        <div className="bg-[#f0ecf3] p-5 rounded-xl border border-slate-200/50 flex flex-col justify-between space-y-3">
          <div className="flex items-center gap-1.5 text-[#585595]">
            <Sparkles className="w-5 h-5 text-[#585595] animate-pulse" />
            <h5 className="font-extrabold text-sm">世新平台 AI 推薦報告</h5>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[160px] pr-1 space-y-1">
            {isLoadingReport ? (
              <div className="flex flex-col items-center justify-center h-full py-6 space-y-2 text-slate-400">
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span className="text-[10px] font-bold">正在調度世新專屬 AI 產出深度對比報告...</span>
              </div>
            ) : aiReport ? (
              <div className="prose prose-sm text-xs font-medium">
                {renderReportText(aiReport)}
              </div>
            ) : (
              <p className="text-xs text-slate-600 leading-relaxed font-semibold italic">
                請在上方輸入框中輸入您的起居需求以即時產生精準推薦，或者隨意修改下方條件試試！
              </p>
            )}
          </div>

          <div className="border-t border-purple-100 pt-2 flex justify-between items-center text-[9px] text-slate-400 font-bold">
            <span>基於 {displayProperties.length} 間房源分析</span>
            <span>更新於 2026</span>
          </div>
        </div>
      </section>
    </motion.div>
  );
}
