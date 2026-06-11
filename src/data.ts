import { Property, NotificationItem, UserProfile, Review } from './types';

export const mockProperties: Property[] = [
  {
    id: 'prop-wenshan-premium',
    title: '文山精品獨立套房',
    price: 12000,
    location: '文山區試院路',
    timeUnit: '月',
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&auto=format&fit=crop&q=80',
    tags: ['有電梯', '可養寵物', '獨立衛浴'],
    distance: '步行至校門 3 分鐘',
    source: 'platform',
    totalEstimate: 13300,
    rating: 4.8,
    floor: '8F / 12F',
    description: '採光良好，屋況極佳，隔音一流，非常適合需要安靜讀書研究的世修同學。附全套家具、無綖網路與冷氣。垃圾有集中處理免追垃圾車，提供超優質的研究生生活品質。',
    amenities: ['無綫網路', '冷氣', '冰箱', '書桌', '電梯', '獨立洗衣機', '遮光窗簾'],
    costBreakdown: {
      rent: 12000,
      electric: 800,
      water: 200,
      management: 300,
    }
  },
  {
    id: 'prop-muzha-lighting',
    title: '木柵路近學校採光房',
    price: 9500,
    location: '文山區木柵路',
    timeUnit: '月',
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&auto=format&fit=crop&q=80',
    tags: ['含網路', '有陽台', '採光極佳'],
    distance: '距離學校 800m',
    source: 'exclusive',
    totalEstimate: 10800,
    rating: 4.5,
    floor: '3F / 5F',
    description: '近考友社與世新大門，通風極佳，大落地窗，擁有獨立陽台可以曬衣服。鄰近便利商店與傳統小吃店，機能完整。',
    amenities: ['無綫網路', '冷氣', '冰箱', '書桌', '陽台', '共用洗衣機'],
    costBreakdown: {
      rent: 9500,
      electric: 700,
      water: 200,
      management: 400,
    }
  },
  {
    id: 'prop-jingmei-mrt',
    title: '景美捷運站電梯套房',
    price: 12000,
    location: '文山區景美街',
    timeUnit: '月',
    image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&auto=format&fit=crop&q=80',
    tags: ['校友推薦', '近捷運', '電梯大樓'],
    distance: '捷運站步行 5 分鐘',
    source: 'alumni',
    totalEstimate: 13500,
    rating: 4.8,
    floor: '10F / 15F',
    description: '景美夜市旁極優大樓！捷運出口走路即達，世新同學通勤只需一站或騎腳踏車8分鐘。大樓備有24小時警衛管理，收發包裹極方便。',
    amenities: ['無綫網路', '冷氣', '冰箱', '書桌', '電梯', '管理室', '24H保全'],
    costBreakdown: {
      rent: 12000,
      electric: 900,
      water: 200,
      management: 400,
    }
  },
  {
    id: 'prop-jingmei-suite',
    title: '景美站步行5分雅房',
    price: 7500,
    location: '文山區景美街',
    timeUnit: '月',
    image: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=600&auto=format&fit=crop&q=80',
    tags: ['限女性', '免管理費', '近捷運'],
    distance: '景美捷運站週邊',
    source: 'FB',
    totalEstimate: 8200,
    rating: 4.7,
    floor: '4F / 5F',
    description: '溫馨雅房，公用衛浴僅與另一位世新女同學共用。客廳公共空間寬敞，垃圾可代收，租金貼心實惠。',
    amenities: ['無綫網路', '冷氣', '冰箱', '書桌', '垃圾代收'],
    costBreakdown: {
      rent: 7500,
      electric: 500,
      water: 200,
      management: 0,
    }
  },
  {
    id: 'prop-muzha-landscape',
    title: '木柵路景觀大套房',
    price: 14500,
    location: '文山區木柵路一段',
    timeUnit: '月',
    image: 'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=600&auto=format&fit=crop&q=80',
    tags: ['電梯大樓', '24H管理', '校友推薦'],
    distance: '復興路口站牌旁',
    source: 'exclusive',
    totalEstimate: 16200,
    rating: 4.6,
    floor: '12F / 18F',
    description: '高樓層超跑大景觀！可直接遠眺河景，全天候保全，刷卡進出安全無虞。房東為世新傑出校友，特別為學弟妹提供租金優惠。',
    amenities: ['無綫網路', '冷氣', '冰箱', '書桌', '電梯', '管理室', '可養寵物', '微波爐'],
    costBreakdown: {
      rent: 14500,
      electric: 1000,
      water: 200,
      management: 500,
    }
  },
  {
    id: 'prop-shixin-coliving-3b1l',
    title: '世新大門旁合租首選（3房1廳2衛）',
    price: 27000,
    location: '文山區試院路一段',
    timeUnit: '月',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=80',
    tags: ['同學合租', '大客廳', '價格低廉'],
    distance: '步行至世新大門僅 2 分鐘',
    source: 'platform',
    totalEstimate: 29000,
    rating: 4.9,
    floor: '3F / 5F (公寓)',
    description: '世新大門旁超人氣 3房1廳 公寓！客廳、餐廳一應俱全，採光無遮擋，通風舒適。超適合世新學子3位好友或社團幹部一同合租平攤！每房皆配有變頻冷氣與大書桌，租金超實惠。',
    amenities: ['無綫網路', '冷氣', '冰箱', '書桌', '陽台', '個人洗衣機', '熱水器', '微波爐', '客廳沙發'],
    costBreakdown: {
      rent: 27000,
      electric: 1500,
      water: 500,
      management: 0,
    }
  },
  {
    id: 'prop-shixin-budget-8k',
    title: '試院路靜巷精美省電小套房',
    price: 8000,
    location: '文山區試院路二段',
    timeUnit: '月',
    image: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=600&auto=format&fit=crop&q=80',
    tags: ['獨立套房', '一級變頻', '免管理費'],
    distance: '後校門步行 4 分鐘',
    source: 'exclusive',
    totalEstimate: 8800,
    rating: 4.4,
    floor: '2F / 4F (公寓)',
    description: '專為世新學生量身打造的精緻小套房！配備全新一級省電變頻冷氣，夏天開得放心。租金包含網路與清潔費，房東專職代管、修繕快速。學期初降價優惠招租中！',
    amenities: ['無綫網路', '冷氣', '冰箱', '書桌', '衣櫃', '熱水器', '共用洗衣機'],
    costBreakdown: {
      rent: 8000,
      electric: 600,
      water: 200,
      management: 0,
    }
  },
  {
    id: 'prop-shixin-cozy-9k',
    title: '景美街特約採光溫馨大雅房',
    price: 9000,
    location: '文山區景美街',
    timeUnit: '月',
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&auto=format&fit=crop&q=80',
    tags: ['限世新學生', '近捷運', '生活極便'],
    distance: '捷運景美站步行 3 分鐘',
    source: 'alumni',
    totalEstimate: 9750,
    rating: 4.6,
    floor: '5F / 6F (電梯華廈)',
    description: '出門就是景美街、景美夜市，買晚餐、消夜超方便！大樓設有垃圾集中，免追台北市垃圾車。室友皆為熱心的世新同學，歡迎預約看房。',
    amenities: ['無綫網路', '冷氣', '冰箱', '書桌', '大衣架', '電梯', '個人洗衣機'],
    costBreakdown: {
      rent: 9000,
      electric: 550,
      water: 200,
      management: 0,
    }
  }
];

export const mockReviews: Review[] = [
  {
    id: 'r1',
    author: 'Lin J.',
    dept: '世新資傳',
    avatar: 'LJ',
    content: 'Quiet for studying and the soundproofing is actually decent. Highly recommend for finals week.',
    rating: 4.8
  },
  {
    id: 'r2',
    author: 'Chen Y.',
    dept: '世新傳管',
    avatar: 'CY',
    content: 'Landlord is very responsive. Fixed my AC within 24 hours. Safe building for female students.',
    rating: 4.9
  }
];

export const mockNotifications: NotificationItem[] = [
  {
    id: 'notif-1',
    type: 'new_listing',
    title: '新房源推薦',
    content: '木柵路新房源上架！符合您的『文山區/獨立套房』搜尋條件。',
    time: '10 分鐘前',
    unread: true,
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'notif-2',
    type: 'price_drop',
    title: '降價通知',
    content: '您的收藏『景美捷運站電梯套房』租金調降為 $11,500/月。',
    time: '2 小時前',
    unread: true
  },
  {
    id: 'notif-3',
    type: 'system',
    title: '系統消息',
    content: '歡迎使用世新大學租屋平台！完成校園信箱驗證即可開啟完整功能。',
    time: '昨天',
    unread: false
  },
  {
    id: 'notif-4',
    type: 'announcement',
    title: '重要公告',
    content: '【公告】113學年度租屋補助申請教學已上線。世新學子專屬權益，請務必查看申請細則。',
    time: '2 天前',
    unread: false
  }
];

export const mockUserProfile: UserProfile = {
  name: '李曉明',
  studentId: 'A1100100XX',
  department: '傳播學院',
  isVerified: true,
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  favoriteCount: 12,
  comparingCount: 3
};
