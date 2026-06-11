import React from 'react';
import { motion } from 'motion/react';
import { Search, Home as HomeIcon, MapPin, Star, AlertCircle, Sparkles} from 'lucide-react';
import { Property } from '../types';

interface HomeProps {
  properties: Property[];
  onSelectProperty: (propertyId: string) => void;
  onNavigateToTab: (tab: 'home' | 'search' | 'favorites' | 'profile' | 'details' | 'comparison' | 'notifications' | 'auth') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export default function Home({ properties, onSelectProperty, onNavigateToTab, searchQuery, onSearchChange }: HomeProps) {
  // Take first 2 properties for home screen hot items
  const hotProperties = properties.slice(0, 2);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-6 pb-12"
    >
      {/* Search Header Hero */}
      <div className="space-y-4">
        <div className="relative cursor-pointer" onClick={() => onNavigateToTab('search')}>
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            readOnly
            value={searchQuery}
            placeholder="搜尋 試院路、木柵路、景美街、復興路..."
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl shadow-sm focus:outline-none cursor-pointer text-slate-800 placeholder-slate-400"
          />
        </div>

        {/* Quick Filter Sliders */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none scroll-smooth">
          {['近捷運', '近校門', '獨立套房', '雅房', '可寵物'].map((filter, idx) => (
            <motion.button
              whileTap={{ scale: 0.95 }}
              key={idx}
              onClick={() => {
                const keyword = filter === '近捷運' ? '捷運' : filter === '近校門' ? '學校' : filter === '獨立套房' ? '套房' : filter === '雅房' ? '雅房' : filter;
                onSearchChange(keyword);
                onNavigateToTab('search');
              }}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors duration-150 ${
                idx === 1
                  ? 'bg-[#585595] text-white shadow-sm'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-150'
              }`}
            >
              {filter === '近捷運' && '🚇 '}
              {filter === '近校門' && '🎓 '}
              {filter === '獨立套房' && '🏢 '}
              {filter === '雅房' && '🛏️ '}
              {filter}
            </motion.button>
          ))}
        </div>
      </div>

      {/* SHU Surrounding Popular Roads Shortcut Grid */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-extrabold text-slate-700 tracking-wide flex items-center gap-1.5">
            🏫 世新大學學生熱門路段首選
          </h3>
          <span className="text-[11px] text-slate-400">點擊路名可自動篩選</span>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {[
            { name: '試院路', query: '試院路', info: '近校大門文教區', count: properties.filter(p => p.location.includes('試院路') || p.description?.includes('試院路')).length, style: 'from-blue-50/60 to-indigo-50/40 border-blue-100 hover:border-blue-200 text-blue-900' },
            { name: '木柵路', query: '木柵路', info: '近後校門/管理學院', count: properties.filter(p => p.location.includes('木柵路') || p.description?.includes('木柵路')).length, style: 'from-amber-50/60 to-orange-50/40 border-amber-100 hover:border-amber-200 text-amber-900' },
            { name: '景美街', query: '景美', info: '景美捷運站/景美夜市', count: properties.filter(p => p.location.includes('景美') || p.description?.includes('景美')).length, style: 'from-teal-50/60 to-emerald-50/40 border-teal-100 hover:border-teal-200 text-teal-900' },
            { name: '復興路', query: '復興路', info: '大坪林商圈/近校區', count: properties.filter(p => p.location.includes('復興路') || p.description?.includes('復興路')).length, style: 'from-purple-50/60 to-fuchsia-50/40 border-purple-100 hover:border-purple-200 text-purple-900' },
          ].map((st) => (
            <motion.div
              key={st.name}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                onSearchChange(st.query);
                onNavigateToTab('search');
              }}
              className={`p-3.5 rounded-2xl border bg-gradient-to-br ${st.style} flex flex-col justify-between h-24 shadow-xs transition-all hover:shadow-xs cursor-pointer`}
            >
              <div className="flex justify-between items-center w-full">
                <span className="font-extrabold text-sm tracking-wide">
                  📍 {st.name}
                </span>
                <span className="text-[9px] bg-white/70 px-2 py-0.5 rounded-full font-bold">
                  {st.count} 間房源
                </span>
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] opacity-80 font-medium truncate">{st.info}</p>
                <div className="text-[10px] font-bold underline flex items-center gap-0.5">
                  查看最近房源 →
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recommended Section Header */}
      <div className="space-y-4">
        <div className="flex justify-between items-end">
          <div>
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-1.5">
              熱門推薦
            </h3>
            <p className="text-xs text-slate-500">依據學生評價與熱度排序</p>
          </div>
          <button 
            onClick={() => onNavigateToTab('search')} 
            className="text-sm font-semibold text-[#585595] hover:underline"
          >
            查看更多 &gt;
          </button>
        </div>

        {/* Property cards matching Screen 1 details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {hotProperties.map((prop, index) => (
            <motion.div
              key={prop.id}
              whileHover={{ y: -4, transition: { duration: 0.15 } }}
              onClick={() => onSelectProperty(prop.id)}
              className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md cursor-pointer group flex flex-col"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                <img
                  src={prop.image}
                  alt={prop.title}
                  className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />
                
                {/* Badges in visual specification */}
                <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
                  <span className="bg-[#ba1a1a] text-white px-2.5 py-0.5 rounded-md text-[10px] font-bold tracking-wider">
                    {index === 0 ? '新上架' : '熱門秒殺'}
                  </span>
                  <span className="bg-[#844773] text-white px-2.5 py-0.5 rounded-md text-[10px] font-bold tracking-wider">
                    校方認證
                  </span>
                </div>
                
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigateToTab('favorites');
                  }}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/95 backdrop-blur-md flex items-center justify-center text-slate-450 hover:text-red-500 shadow-sm transition-colors"
                >
                  <span className="text-red-500 font-bold">♥</span>
                </button>
              </div>

              {/* Property Details */}
              <div className="p-4 flex-grow flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <h4 className="font-bold text-slate-900 group-hover:text-[#585595] transition-colors text-base truncate">
                      {prop.title}
                    </h4>
                    <div className="flex items-center gap-0.5 text-xs font-semibold text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      <span>{prop.rating}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 flex items-center gap-1 mb-3">
                    <MapPin className="w-3.5 h-3.5 text-[#585595]" />
                    <span>{prop.location} · {prop.distance}</span>
                  </p>

                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {prop.tags.map((tag, tIdx) => (
                      <span key={tIdx} className="bg-slate-50 border border-slate-100 text-slate-600 px-2 py-0.5 rounded-md text-xs font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                  <div className="text-[#ba1a1a] font-bold text-lg">
                    NT$ {prop.price.toLocaleString()} <span className="text-xs font-normal text-slate-500">/ {prop.timeUnit}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Unique SHU Housing Subsidy Interactive Bento Box */}
      <motion.div
        whileHover={{ scale: 1.005 }}
        className="relative bg-gradient-to-br from-[#5c5b96] to-[#7f7cb8] text-white rounded-2xl p-6 shadow-md overflow-hidden flex flex-col justify-between"
      >
        <div className="relative z-10 max-w-[80%] space-y-3">
          <div className="inline-flex items-center gap-1 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold">
            <Sparkles className="w-3 h-3 text-yellow-200 fill-yellow-200" />
            <span>官方學生支援</span>
          </div>
          <h4 className="text-xl font-bold tracking-wide">需要確屋補助諮詢嗎嗎？</h4>
          <p className="text-sm text-purple-100 leading-relaxed">
            內政部擴大租金補貼專案，世新同學最高每月可省下 <strong className="text-yellow-200 text-base font-extrabold">$3,600</strong> 補助金！
          </p>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3 items-start relative z-10">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="bg-white text-[#585595] font-bold px-6 py-2.5 rounded-xl text-sm shadow-sm hover:bg-purple-50 transition-colors"
          >
            立即諮詢
          </motion.button>
          
          <div className="flex items-center gap-1.5 text-xs text-purple-100 mt-2 sm:mt-0">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>線上限時專家免費諮詢</span>
          </div>
        </div>

        {/* Abstract floating wallet visual decoration */}
        <div className="absolute -bottom-6 -right-6 opacity-15 text-white scale-[2.2] pointer-events-none z-0">
          <div className="border-[6px] border-white rounded-[24px] p-6 w-24 h-24 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full border-4 border-white flex items-center justify-center">
              <div className="w-4 h-4 bg-white rounded-full"></div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
