import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Landmark, ChevronRight, BarChart3, HelpCircle, GraduationCap } from 'lucide-react';
import { Property } from '../types';

interface FavoritesProps {
  properties: Property[];
  favorites: string[];
  comparedIds: string[];
  onToggleFavorite: (propertyId: string, event: React.MouseEvent) => void;
  onToggleComparisonById: (propertyId: string) => void;
  onSelectProperty: (propertyId: string) => void;
  onNavigateToTab: (tab: 'home' | 'search' | 'favorites' | 'profile' | 'details' | 'comparison' | 'notifications' | 'auth') => void;
}

export default function Favorites({
  properties,
  favorites,
  comparedIds,
  onToggleFavorite,
  onToggleComparisonById,
  onSelectProperty,
  onNavigateToTab,
}: FavoritesProps) {
  // Filter core favorites from mock listings
  const favoritedProperties = properties.filter((p) => favorites.includes(p.id));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      {/* Comparison analysis triggering banner (Screen 6 Spec) */}
      {favoritedProperties.length > 0 && (
        <section>
          <div className="bg-[#e0dcfc] rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm border border-purple-200">
            <div className="flex items-center gap-4">
              <div className="bg-[#585595] text-white p-3 rounded-full hidden md:block">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-[#62607b]">房源對比分析報告</h3>
                <p className="text-xs text-[#62607b]/90">
                  即刻點選最多 3 個收藏物件，產出交通距離、費率佔比及公共設施矩陣對比。
                </p>
              </div>
            </div>
            
            <button
              onClick={() => onNavigateToTab('comparison')}
              disabled={comparedIds.length === 0}
              className={`px-6 py-2.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 text-sm shadow-sm active:scale-95 whitespace-nowrap ${
                comparedIds.length > 0
                  ? 'bg-[#585595] text-white hover:bg-[#4a4780]'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              📊 查看對比報告 ({comparedIds.length})
            </button>
          </div>
        </section>
      )}

      {/* Grid containing bookmarks card items */}
      <AnimatePresence mode="popLayout">
        {favoritedProperties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="favorites-container">
            {favoritedProperties.map((prop) => {
              const isComparing = comparedIds.includes(prop.id);
              return (
                <motion.div
                  key={prop.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`group bg-white rounded-xl overflow-hidden border transition-all duration-200 shadow-sm ${
                    isComparing ? 'ring-2 ring-[#585595] border-[#585595]' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Photo area */}
                  <div className="relative aspect-video overflow-hidden bg-slate-100">
                    <img
                      src={prop.image}
                      alt={prop.title}
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                    
                    {/* Floating top controls */}
                    <div className="absolute top-3 right-3">
                      <button
                        onClick={(e) => onToggleFavorite(prop.id, e)}
                        className="p-2 bg-white/90 backdrop-blur-md rounded-full text-red-500 shadow-xs hover:bg-white transition-transform active:scale-125"
                      >
                        <Heart className="w-4.5 h-4.5 fill-red-500" />
                      </button>
                    </div>

                    {/* Bottom visual categorizations tags */}
                    <div className="absolute bottom-3 left-3 flex gap-1.5 flex-wrap">
                      <span className="bg-[#844773] text-white px-2.5 py-0.5 rounded text-[10px] font-bold tracking-wide">
                        校友推薦
                      </span>
                      <span className="bg-slate-900/60 backdrop-blur-xs text-white px-2.5 py-0.5 rounded text-[10px] font-medium">
                        {prop.distance.includes('3 分鐘') ? '極近校園' : '近捷運'}
                      </span>
                    </div>
                  </div>

                  {/* Body textual data */}
                  <div className="p-4 space-y-2.5">
                    <div onClick={() => onSelectProperty(prop.id)} className="cursor-pointer space-y-1">
                      <h4 className="font-bold text-slate-900 group-hover:text-[#585595] transition-colors truncate">
                        {prop.title}
                      </h4>
                      <p className="text-[#585595] font-extrabold text-base">
                        NT$ {prop.price.toLocaleString()} <span className="text-xs font-normal text-slate-500">/{prop.timeUnit}</span>
                      </p>
                    </div>

                    {/* Compare Selector & Details Arrow trigger */}
                    <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
                      <label className="flex items-center gap-2.5 cursor-pointer select-none py-1">
                        <input
                          type="checkbox"
                          checked={isComparing}
                          onChange={() => onToggleComparisonById(prop.id)}
                          className="w-5 h-5 rounded border-slate-300 text-[#585595] focus:ring-[#585595]/20 focus:border-[#585595] transition-all"
                        />
                        <span className={`text-xs font-semibold ${isComparing ? 'text-[#585595]' : 'text-slate-500'}`}>
                          加入對比
                        </span>
                      </label>
                      
                      <button
                        onClick={() => onSelectProperty(prop.id)}
                        className="text-[#585595] font-bold text-xs flex items-center gap-1 hover:underline"
                      >
                        <span>詳細資訊</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          /* Empty State Section - matching Screen 6 mock block */
          <motion.section
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center space-y-5"
            id="empty-state"
          >
            <div className="bg-purple-50 p-8 rounded-full">
              <Heart className="w-16 h-16 text-[#585595] opacity-50" />
            </div>
            <div className="space-y-1.5">
              <h4 className="text-xl font-bold text-slate-800">您的收藏夾目前是空的</h4>
              <p className="text-sm text-slate-500 max-w-sm">
                點選心儀物件卡片上的愛心按鈕，即可加入此頁面並產出進階比較分析。
              </p>
            </div>
            
            <button
              onClick={() => onNavigateToTab('search')}
              className="bg-[#585595] text-white font-bold px-8 py-3 rounded-xl text-sm shadow-sm hover:bg-[#4a4780] transition-colors active:scale-95"
            >
              開往搜尋房源 🎒
            </button>
          </motion.section>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
