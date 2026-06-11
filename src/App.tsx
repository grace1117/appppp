import React, { useState, useEffect } from 'react';
import { Home as HomeIcon, Search as SearchIcon, Heart, User, Bell } from 'lucide-react';
import { mockProperties, mockNotifications } from './data';
import { Property, ActiveTab, UserProfile, NotificationItem, Review } from './types';
import Home from './components/Home';
import Search from './components/Search';
import Details from './components/Details';
import Favorites from './components/Favorites';
import Comparison from './components/Comparison';
import Notifications from './components/Notifications';
import Profile from './components/Profile';
import Auth from './components/Auth';

// Firebase core bindings
import {
  auth,
  db,
  signInWithGoogle,
  logoutUser,
  handleFirestoreError,
  OperationType
} from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import {
  doc,
  setDoc,
  updateDoc,
  collection,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';

function sanitizeProperty(p: Property): Property {
  let source = p.source;
  if (typeof source === 'string') {
    const sLower = source.toLowerCase();
    if (sLower.includes('591')) {
      source = 'platform';
    } else if (sLower.includes('fb') || sLower.includes('facebook')) {
      source = 'exclusive';
    }
  }

  let title = p.title || '';
  title = title
    .replace(/[\(（]?來源\s*[:：]\s*(591|facebook|fb|租屋網)[\)）]?/gi, '')
    .replace(/591\s*(租屋網)?/gi, '')
    .trim();

  let description = p.description || '';
  description = description
    .replace(/[\(（]?來源\s*[:：]\s*(591|facebook|fb|租屋網)[\)）]?/gi, '')
    .replace(/591\s*(租屋網|來源|報價|_ID)/gi, '')
    .replace(/facebook\s*(租屋社團|社團|來源)/gi, '')
    .trim();

  return {
    ...p,
    source: source as any,
    title,
    description
  };
}

export default function App() {
  // Navigation active state - Defaults to 'auth' for unauthenticated startup
  const [tab, setTab] = useState<ActiveTab>('auth');
  
  // Shared search query state to map popular streets
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Dynamic properties list loaded from Firestore
  const [properties, setProperties] = useState<Property[]>(mockProperties);
  
  // Real-time reviews fetched for the active details view
  const [reviews, setReviews] = useState<Review[]>([]);
  
  // Real-time favorites state synced with Firestore if authed
  const [favorites, setFavorites] = useState<string[]>([
    'prop-wenshan-premium',
    'prop-muzha-lighting',
    'prop-jingmei-mrt'
  ]);
  
  // Real-time compared properties state synced with Firestore if authed
  const [comparedIds, setComparedIds] = useState<string[]>([
    'prop-wenshan-premium',
    'prop-muzha-lighting',
    'prop-jingmei-mrt'
  ]);

  // Notifications list
  const [notifications, setNotifications] = useState<NotificationItem[]>(mockNotifications);
  
  // Active User session model
  const [user, setUser] = useState<UserProfile | null>(null);

  // Authentication loading tracking
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);
  const [socialLoading, setSocialLoading] = useState<boolean>(false);
  const [socialError, setSocialError] = useState<string>('');
  
  // Selected single listing for Details view
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('prop-wenshan-premium');

  // Find active selected property object
  const selectedProperty = properties.find((p) => p.id === selectedPropertyId) || properties[0];

  // 1. Hook up properties real-time feed from Firestore
  useEffect(() => {
    const propertiesRef = collection(db, 'properties');
    
    const unsubscribeProperties = onSnapshot(propertiesRef, async (snapshot) => {
      if (snapshot.empty) {
        // Database is clean and empty, let's proactively seed it with standard listings only if an authenticated user is active
        if (auth.currentUser) {
          console.log("Seeding properties to Firestore database...");
          try {
            for (const prop of mockProperties) {
              await setDoc(doc(db, 'properties', prop.id), prop);
            }
          } catch (err) {
            console.warn("Seeding properties warning: ", err);
          }
        }
      } else {
        const loaded: Property[] = [];
        snapshot.forEach((snapDoc) => {
          const rawDoc = snapDoc.data() as Property;
          loaded.push(sanitizeProperty(rawDoc));
        });
        setProperties(loaded);
      }
    }, (error) => {
      // Catch exceptions silently or report safely
      try {
        handleFirestoreError(error, OperationType.LIST, 'properties');
      } catch (err) {
        console.error("Properties feed error intercepted: ", err);
      }
    });

    return () => unsubscribeProperties();
  }, []);

  // 2. Hook up active user session and profile syncing
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (currentUser) => {
      setIsLoadingAuth(true);
      if (currentUser) {
        // Real authenticated Firebase session
        const userDocRef = doc(db, 'users', currentUser.uid);
        
        const unsubUserDoc = onSnapshot(userDocRef, async (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            setUser({
              name: data.name || '世新同學',
              studentId: data.studentId || 'A112XXXXXX',
              department: data.department || '傳播學院',
              isVerified: data.isVerified ?? false,
              avatar: data.avatar || currentUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
              favoriteCount: data.favorites?.length || 0,
              comparingCount: data.comparedIds?.length || 0,
              requirements: data.requirements || {
                maxPrice: 15000,
                maxDistance: '10分鐘',
                needElevator: false,
                amenities: [],
                rawText: ''
              }
            });
            setFavorites(data.favorites || []);
            setComparedIds(data.comparedIds || []);
          } else {
            // New register profile setup on first landing
            const savedReqStr = localStorage.getItem('guest_housing_requirements');
            let initialReq = {
              maxPrice: 15000,
              maxDistance: '10分鐘',
              needElevator: false,
              amenities: [],
              rawText: ''
            };
            if (savedReqStr) {
              try {
                initialReq = JSON.parse(savedReqStr);
              } catch (e) {
                console.error("Error parsing guest requirements", e);
              }
            }
            const initialProfile = {
              uid: currentUser.uid,
              name: currentUser.displayName || '世新學友',
              studentId: currentUser.email?.split('@')[0].toUpperCase().substring(0, 10) || 'A11200000X',
              department: '傳播學院',
              isVerified: currentUser.email?.endsWith('@mail.shu.edu.tw') || false,
              avatar: currentUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
              favorites: ['prop-wenshan-premium', 'prop-muzha-lighting'],
              comparedIds: ['prop-wenshan-premium'],
              requirements: initialReq
            };
            try {
              await setDoc(userDocRef, initialProfile);
            } catch (err) {
              console.error("Profile set failure: ", err);
            }
          }
          setIsLoadingAuth(false);
          // Redirect authenticated user to 'home' on initial load if they were on 'auth'
          setTab((prev) => (prev === 'auth' ? 'home' : prev));
        }, (error) => {
          try {
            handleFirestoreError(error, OperationType.GET, `users/${currentUser.uid}`);
          } catch (err) {
            console.error("UserProfile snapshot feed error intercepted: ", err);
          }
          setIsLoadingAuth(false);
        });

        return () => unsubUserDoc();
      } else {
        // Visitor/unsigned state - Defaults to not logged in (user = null)
        setUser(null);
        setIsLoadingAuth(false);
        setTab('auth');
      }
    });

    return () => unsubAuth();
  }, []);

  // 3. Hook up dynamic real-time property reviews subcollection syncing
  useEffect(() => {
    if (!selectedPropertyId) return;

    const reviewsRef = collection(db, 'properties', selectedPropertyId, 'reviews');
    
    const unsubscribeReviews = onSnapshot(reviewsRef, (snapshot) => {
      const defaultWenshanReviews: Review[] = [
        { id: 'r1', author: 'Lin J.', dept: '世新資傳', avatar: 'LJ', content: 'Quiet for studying and the soundproofing is actually decent. Highly recommend for finals week.', rating: 4.8 },
        { id: 'r2', author: 'Chen Y.', dept: '世新傳管', avatar: 'CY', content: 'Landlord is very responsive. Fixed my AC within 24 hours. Safe building for female students.', rating: 4.9 }
      ];
      const defaultOtherReviews: Review[] = [
        { id: 'r3', author: 'Wang S.', dept: '世新資管', avatar: 'WS', content: '整體環境不錯，雖然是頂加但熱水器與水壓很新很熱，租金真的佛心！', rating: 4.5 }
      ];
      const syncList = selectedPropertyId === 'prop-wenshan-premium' ? defaultWenshanReviews : defaultOtherReviews;

      if (snapshot.empty) {
        setReviews(syncList);
      } else {
        const loadedReviews: Review[] = [];
        snapshot.forEach((snapDoc) => {
          const data = snapDoc.data();
          loadedReviews.push({
            id: data.id || snapDoc.id,
            author: data.author || '匿名同學',
            dept: data.dept || '傳播學院',
            avatar: data.avatar || '匿',
            content: data.content || '',
            rating: data.rating || 5
          });
        });
        // Concatenate real user reviews first, then show the default ones if there's space
        setReviews([...loadedReviews, ...syncList.filter(s => !loadedReviews.some(r => r.id === s.id))]);
      }
    }, (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, `properties/${selectedPropertyId}/reviews`);
      } catch (err) {
        console.error("Reviews listener error intercepted: ", err);
      }
    });

    return () => unsubscribeReviews();
  }, [selectedPropertyId]);

  // Auth execution controllers
  const handleGoogleSignIn = async () => {
    setSocialLoading(true);
    setSocialError('');
    try {
      await signInWithGoogle();
      setTab('profile');
    } catch (err: any) {
      console.error("Google sign-in failure: ", err);
      setSocialError('Google 登入失敗：' + (err.message || '請確認在安全窗口開啟，並允許彈出視窗。'));
    } finally {
      setSocialLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      setUser(null);
      setFavorites([
        'prop-wenshan-premium',
        'prop-muzha-lighting',
        'prop-jingmei-mrt'
      ]);
      setComparedIds([
        'prop-wenshan-premium',
        'prop-muzha-lighting',
        'prop-jingmei-mrt'
      ]);
      setTab('auth');
    } catch (err) {
      console.error("Sign out action error: ", err);
    }
  };

  const handleLoginSuccess = (name: string, studentId: string, email: string, avatarUrl: string) => {
    // Local session simulation backup if they choose email
    setUser({
      name,
      studentId,
      department: '傳播學院',
      isVerified: email.endsWith('@mail.shu.edu.tw') || false,
      avatar: avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      favoriteCount: favorites.length,
      comparingCount: comparedIds.length,
    });
    setTab('profile');
  };

  // Favorite toggle controls matching database persistence
  const handleToggleFavorite = async (propertyId: string, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    const updated = favorites.includes(propertyId)
      ? favorites.filter((id) => id !== propertyId)
      : [...favorites, propertyId];

    if (auth.currentUser) {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      try {
        await updateDoc(userRef, { favorites: updated });
      } catch (error) {
        try {
          handleFirestoreError(error, OperationType.UPDATE, `users/${auth.currentUser.uid}`);
        } catch (err) {
          console.error("Firestore favorite update error: ", err);
        }
      }
    } else {
      setFavorites(updated);
    }
  };

  // Compare listings controls matching database persistence
  const handleToggleComparison = async (prop: Property) => {
    const updated = comparedIds.includes(prop.id)
      ? comparedIds.filter((id) => id !== prop.id)
      : comparedIds.length < 3
      ? [...comparedIds, prop.id]
      : [comparedIds[1], comparedIds[2], prop.id];

    if (auth.currentUser) {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      try {
        await updateDoc(userRef, { comparedIds: updated });
      } catch (error) {
        try {
          handleFirestoreError(error, OperationType.UPDATE, `users/${auth.currentUser.uid}`);
        } catch (err) {
          console.error("Firestore comparison update error: ", err);
        }
      }
    } else {
      setComparedIds(updated);
    }
  };

  const handleToggleComparisonById = async (propertyId: string) => {
    const updated = comparedIds.includes(propertyId)
      ? comparedIds.filter((id) => id !== propertyId)
      : comparedIds.length < 3
      ? [...comparedIds, propertyId]
      : [comparedIds[1], comparedIds[2], propertyId];

    if (auth.currentUser) {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      try {
        await updateDoc(userRef, { comparedIds: updated });
      } catch (error) {
        try {
          handleFirestoreError(error, OperationType.UPDATE, `users/${auth.currentUser.uid}`);
        } catch (err) {
          console.error("Firestore comparison update error: ", err);
        }
      }
    } else {
      setComparedIds(updated);
    }
  };

  // Submit student review to Firestore properties subcollection
  const handleAddReview = async (content: string, rating: number) => {
    if (!auth.currentUser) return;
    const reviewId = `rev-${Date.now()}`;
    const path = `properties/${selectedPropertyId}/reviews/${reviewId}`;
    try {
      await setDoc(doc(db, 'properties', selectedPropertyId, 'reviews', reviewId), {
        id: reviewId,
        author: user?.name || '匿名在校生',
        dept: user?.department || '傳播學院',
        avatar: (user?.name || '匿').substring(0, 2),
        content,
        rating,
        userId: auth.currentUser.uid,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.CREATE, path);
      } catch (err) {
        console.error("Firestore review creation failed: ", err);
        alert("無法新增評論，請確認是否登入或權限符合!");
      }
    }
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const handleSelectProperty = (propertyId: string) => {
    setSelectedPropertyId(propertyId);
    setTab('details');
  };



  const handleUpdateProfile = async (name: string, studentId: string, department: string, avatar: string) => {
    if (auth.currentUser) {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      try {
        await updateDoc(userRef, {
          name,
          studentId,
          department,
          avatar
        });
      } catch (error) {
        try {
          handleFirestoreError(error, OperationType.UPDATE, `users/${auth.currentUser.uid}`);
        } catch (err) {
          console.error("Firestore user profile update failed: ", err);
          throw err;
        }
      }
    } else {
      setUser((prev) =>
        prev
          ? {
              ...prev,
              name,
              studentId,
              department,
              avatar,
            }
          : null
      );
    }
  };

  const handleUpdateRequirements = async (requirements: any) => {
    if (auth.currentUser) {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      try {
        await updateDoc(userRef, { requirements });
      } catch (error) {
        try {
          handleFirestoreError(error, OperationType.UPDATE, `users/${auth.currentUser.uid}`);
        } catch (err) {
          console.error("Firestore user requirements update failed: ", err);
          throw err;
        }
      }
    } else {
      localStorage.setItem('guest_housing_requirements', JSON.stringify(requirements));
      setUser((prev) =>
        prev
          ? {
              ...prev,
              requirements,
            }
          : null
      );
    }
  };

  return (
    <div id="app-viewport-container" className="min-h-screen bg-[#fcf8ff] text-slate-800 flex flex-col justify-between selection:bg-purple-100 selection:text-[#585595]">
      
      {/* Dynamic Global Top App Bar  */}
      <header className="fixed top-0 left-0 w-full z-45 bg-[#fcf8ff]/95 backdrop-blur-md border-b border-purple-100/60 shadow-none px-4 py-3 h-16 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => setTab('home')}>
          <div className="w-8 h-8 rounded-lg bg-[#585595] flex items-center justify-center text-white text-xs font-bold shadow-sm">
            🏫
          </div>
          <h1 className="text-base font-extrabold tracking-wide text-[#585595] font-sans">
            世新大學租屋指引
          </h1>
        </div>

        {/* Action icons corner */}
        <div className="flex items-center gap-2">
          {/* Notifications Icon with active badge tally count */}
          <button
            onClick={() => setTab('notifications')}
            className="p-2 hover:bg-purple-50 rounded-full transition-colors relative"
            title="通知中心"
          >
            <Bell className="w-5 h-5 text-[#585595]" />
            {notifications.some((n) => n.unread) && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-[#fcf8ff]" />
            )}
          </button>
        </div>
      </header>

      {/* Main Container Workspace */}
      <main className="flex-grow pt-20 pb-24 px-4 max-w-5xl w-full mx-auto">
        {isLoadingAuth ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-10 h-10 border-4 border-[#585595] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-bold text-slate-400">正在安全加載世新租屋系統...</p>
          </div>
        ) : (
          <>
            {tab === 'home' && (
              <Home
                properties={properties}
                onSelectProperty={handleSelectProperty}
                onNavigateToTab={setTab}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              />
            )}
            
            {tab === 'search' && (
              <Search
                properties={properties}
                onSelectProperty={handleSelectProperty}
                onNavigateToTab={setTab}
                onToggleFavorite={handleToggleFavorite}
                favorites={favorites}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              />
            )}

            {tab === 'details' && (
              <Details
                property={selectedProperty}
                reviews={reviews}
                onBack={() => setTab('search')}
                onNavigateToTab={setTab}
                isFavorite={favorites.includes(selectedProperty.id)}
                onToggleFavorite={() => handleToggleFavorite(selectedProperty.id)}
                onToggleComparison={handleToggleComparison}
                isInComparison={comparedIds.includes(selectedProperty.id)}
                user={user}
                onAddReview={handleAddReview}
              />
            )}

            {tab === 'favorites' && (
              <Favorites
                properties={properties}
                favorites={favorites}
                comparedIds={comparedIds}
                onToggleFavorite={handleToggleFavorite}
                onToggleComparisonById={handleToggleComparisonById}
                onSelectProperty={handleSelectProperty}
                onNavigateToTab={setTab}
              />
            )}

            {tab === 'comparison' && (
              <Comparison
                properties={properties}
                comparedIds={comparedIds}
                onBackToFavorites={() => setTab('favorites')}
                user={user}
                onUpdateRequirements={handleUpdateRequirements}
              />
            )}

            {tab === 'notifications' && (
              <Notifications
                notifications={notifications}
                onMarkAllAsRead={handleMarkAllAsRead}
                onNavigateToTab={setTab}
              />
            )}

            {tab === 'profile' && (
              <Profile
                user={user || { name: '遊客學長', studentId: '未認證', department: '訪客觀摩', isVerified: false, avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150', favoriteCount: favorites.length, comparingCount: comparedIds.length }}
                properties={properties}
                favorites={favorites}
                comparedIds={comparedIds}
                onNavigateToTab={setTab}
                onLogout={handleLogout}
                onUpdateProfile={handleUpdateProfile}
                onUpdateRequirements={handleUpdateRequirements}
              />
            )}

            {tab === 'auth' && (
              <Auth
                onLoginSuccess={handleLoginSuccess}
                onGoogleSignIn={handleGoogleSignIn}
                isLoading={socialLoading}
                socialError={socialError}
              />
            )}
          </>
        )}
      </main>

      {/* Persistent Visual Bottom Nav Bar aligned with material specifications */}
      <nav className="fixed bottom-0 left-0 w-full z-45 bg-[#fcf8ff]/95 backdrop-blur-md border-t border-purple-100 px-4 py-2 flex justify-around items-center h-16 shadow-[0_-4px_10px_rgba(0,0,0,0.02)] max-w-7xl mx-auto">
        
        {/* Tab 1: 首頁 (Home) */}
        <button
          onClick={() => setTab('home')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            tab === 'home' ? 'text-[#585595] font-sans scale-102 font-extrabold' : 'text-slate-400 hover:text-slate-600 scale-98'
          }`}
        >
          <HomeIcon className={`w-5.5 h-5.5 ${tab === 'home' ? 'stroke-[2.5px]' : 'stroke-1.5'}`} />
          <span className="text-[10px] mt-0.5 tracking-wider font-semibold">首頁</span>
        </button>

        {/* Tab 2: 搜尋 (Search) */}
        <button
          onClick={() => setTab('search')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            tab === 'search' || tab === 'details' ? 'text-[#585595] font-sans scale-102 font-extrabold' : 'text-slate-400 hover:text-slate-600 scale-98'
          }`}
        >
          <SearchIcon className={`w-5.5 h-5.5 ${tab === 'search' || tab === 'details' ? 'stroke-[2.5px]' : 'stroke-1.5'}`} />
          <span className="text-[10px] mt-0.5 tracking-wider font-semibold">搜尋房源</span>
        </button>

        {/* Tab 3: 收藏 (Favorites & Compare) */}
        <button
          onClick={() => setTab('favorites')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            tab === 'favorites' || tab === 'comparison' ? 'text-[#585595] font-sans scale-102 font-extrabold' : 'text-slate-400 hover:text-slate-600 scale-98'
          }`}
        >
          <Heart className={`w-5.5 h-5.5 ${tab === 'favorites' || tab === 'comparison' ? 'stroke-[2.5px] fill-[#585595]/10' : 'stroke-1.5'}`} />
          <span className="text-[10px] mt-0.5 tracking-wider font-semibold">我的收藏</span>
        </button>

        {/* Tab 4: 會員 (Profile & Auth) */}
        <button
          onClick={() => {
            if (user) {
              setTab('profile');
            } else {
              setTab('auth');
            }
          }}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            tab === 'profile' || tab === 'auth' ? 'text-[#585595] font-sans scale-102 font-extrabold' : 'text-slate-400 hover:text-slate-600 scale-98'
          }`}
        >
          <User className={`w-5.5 h-5.5 ${tab === 'profile' || tab === 'auth' ? 'stroke-[2.5px]' : 'stroke-1.5'}`} />
          <span className="text-[10px] mt-0.5 tracking-wider font-semibold">{user ? '個人頁面' : '登入在校'}</span>
        </button>
      </nav>
    </div>
  );
}
