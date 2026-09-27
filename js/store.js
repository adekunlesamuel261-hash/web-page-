/**
 * SMART STUDIO WEB APP - DATA STORE & PERSISTENCE
 * Manages LocalStorage State for Authentication, Orders, Proofing Galleries, and Admin Control
 */

const STORAGE_KEYS = {
  CURRENT_USER: 'smart_studio_current_user',
  USERS: 'smart_studio_users',
  ORDERS: 'smart_studio_orders',
  PROOFS: 'smart_studio_proofs'
};

// Initial Seed Data
const DEFAULT_SERVICES = [
  {
    id: 'portrait',
    name: 'Portrait Photography',
    tagline: 'Individual, personal branding and creative editorial headshots',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    packages: [
      { id: 'port-basic', name: 'Basic Studio Session', price: 45000, features: ['1 Outfit', 'Professional lighting setup', '5 Master retouched photos', 'Online proof gallery', '48-hour preview'] },
      { id: 'port-sig', name: 'Signature Studio Session', price: 85000, popular: true, features: ['Up to 2 Outfits', 'Creative gel lighting', '12 Master retouched photos', 'All unedited raw proofs', 'Wardrobe change guidance'] },
      { id: 'port-lux', name: 'Luxury Editorial Portfolio', price: 150000, features: ['Up to 4 Outfits', 'Full creative concept direction', '25 Master retouched photos', 'Hair & Makeup artist included', 'Express 48h final delivery'] }
    ]
  },
  {
    id: 'wedding',
    name: 'Wedding Photography',
    tagline: 'Cinematic visual legacy for ceremonies, receptions and pre-wedding',
    image: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
    packages: [
      { id: 'wed-ess', name: 'Essential Ceremony', price: 350000, features: ['6 Hours coverage', '1 Lead photographer', '150 High-res retouched photos', 'Online digital guest gallery', 'Wooden keepsake USB'] },
      { id: 'wed-lux', name: 'Luxury Full Day Coverage', price: 650000, popular: true, features: ['Full Day (up to 12 Hours)', '2 Professional photographers', 'Pre-wedding studio shoot included', '350 Retouched editorial photos', 'Premium 30-page Italian album'] },
      { id: 'wed-roy', name: 'Royal Cinematic Celebration', price: 1200000, features: ['2-Day Multi-event coverage', '3 Photographers + 2 4K Cinematographers', '4K Drone aerial footage included', 'Unlimited raw captures + 600 retouches', '2 Master Parent Albums + Leather Case'] }
    ]
  },
  {
    id: 'fashion',
    name: 'Fashion Photography',
    tagline: 'High-impact campaigns, lookbooks, model portfolios and brand campaigns',
    image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80',
    packages: [
      { id: 'fash-look', name: 'Designer Lookbook', price: 95000, features: ['Studio or on-location in Abuja', 'Up to 3 Model changes', '15 Retouched editorial photos', 'High-res commercial license'] },
      { id: 'fash-camp', name: 'Brand Campaign Master', price: 180000, popular: true, features: ['Full Day studio production', 'Creative direction moodboard', '35 High-fashion retouches', 'Social video teaser cuts', 'Full commercial copyright release'] }
    ]
  },
  {
    id: 'corporate',
    name: 'Corporate Photography',
    tagline: 'Executive portraits, board members, company teams and corporate events',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80',
    packages: [
      { id: 'corp-exec', name: 'Executive Headshots', price: 60000, features: ['Individual studio session', '3 Background styles', '6 Polished corporate portraits', 'LinkedIn & Press ready formats'] },
      { id: 'corp-team', name: 'Company Team & Culture', price: 140000, popular: true, features: ['Up to 15 Staff members', 'Group & leadership imagery', 'On-site mobile studio setup available', 'All high-res retouched files'] }
    ]
  },
  {
    id: 'product',
    name: 'Product Photography',
    tagline: 'Precision tabletop lighting for e-commerce, luxury packaging & advertising',
    image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80',
    packages: [
      { id: 'prod-cat', name: 'E-Commerce Catalog', price: 50000, features: ['Up to 5 Products', 'Pure white & transparent backdrops', '3 Angles per product', 'Web & print optimized files'] },
      { id: 'prod-lux', name: 'Luxury Commercial Staging', price: 110000, popular: true, features: ['Up to 12 Products', 'Lifestyle & creative props staging', 'Macro texture shots', 'Commercial advertisement license'] }
    ]
  },
  {
    id: 'maternity',
    name: 'Maternity & Baby Photography',
    tagline: 'Comfortable, temperature-controlled studio sessions celebrating new life',
    image: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=800&q=80',
    packages: [
      { id: 'mat-solo', name: 'Maternity Radiance', price: 65000, features: ['Studio robes & fabric wraps provided', 'Partner & sibling included', '10 Fine-art retouched images', 'Gentle, relaxed pacing'] },
      { id: 'mat-combo', name: 'Maternity & Newborn Bundle', price: 125000, popular: true, features: ['2 Separate studio sessions', 'Maternity shoot + Newborn shoot (within 30 days)', '25 Master retouched keepsakes', 'Custom photo mini-album'] }
    ]
  },
  {
    id: 'graduation',
    name: 'Graduation Photography',
    tagline: 'Celebrate academic achievements with timeless family & solo portraits',
    image: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80',
    packages: [
      { id: 'grad-solo', name: 'Graduate Solo Session', price: 40000, features: ['Cap & gown portraits', '1 Casual look change', '8 Master retouched photos', 'Graduation announcement card design'] },
      { id: 'grad-fam', name: 'Graduate & Family Special', price: 75000, popular: true, features: ['Graduate + up to 6 family members', '18 Retouched keepsake portraits', 'Framed 12x16 studio print included', 'Online family viewing link'] }
    ]
  },
  {
    id: 'creative',
    name: 'Creative / Concept Photography',
    tagline: 'Visionary lighting, moodboards, artistic set design and music artwork',
    image: 'https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?auto=format&fit=crop&w=800&q=80',
    packages: [
      { id: 'creat-art', name: 'Conceptual Single Look', price: 80000, features: ['Custom color gel lighting & smoke', '1 Detailed artistic setup', '8 Surreal master retouched files', 'High-res poster export'] },
      { id: 'creat-album', name: 'Album & Creative Campaign', price: 160000, popular: true, features: ['2 Elaborate studio sets', 'Art direction & moodboard consultation', '18 Campaign images', 'Artwork typography overlay included'] }
    ]
  },
  {
    id: 'videography',
    name: '4K Cinema Videography',
    tagline: 'Cinematic commercials, event documentaries, reels and visual storytelling',
    image: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=800&q=80',
    packages: [
      { id: 'vid-short', name: 'Brand Promo & Social Reel', price: 150000, features: ['3 Hours shoot', '4K Cinema Camera + Gimbal', '60-second edited dynamic promo', 'Licensed soundtrack & sound design', 'Vertical 9:16 + Horizontal 16:9'] },
      { id: 'vid-full', name: 'Full Production Documentary', price: 300000, popular: true, features: ['Full day multi-camera coverage', 'Wireless lavalier audio recording', '3 to 5-minute cinematic film', 'Color grading in DaVinci Resolve', 'Raw b-roll footage delivery'] }
    ]
  }
];

const AVAILABLE_ADDONS = [
  { id: 'addon-retouch', name: '5 Extra Master Retouched Photos', price: 15000, desc: 'High-end frequency separation and detail polishing' },
  { id: 'addon-mua', name: 'Professional Studio Makeup Artist (MUA)', price: 25000, desc: 'On-site glam artist ready before your shoot' },
  { id: 'addon-styling', name: 'Wardrobe Stylist & Fitting Prep', price: 35000, desc: 'Studio styling assistance with garments & accessories' },
  { id: 'addon-album', name: 'Handcrafted Italian Photobook (20 Pages)', price: 75000, desc: 'Luxurious archival print album delivered to your door' },
  { id: 'addon-express', name: 'Express 48-Hour Priority Delivery', price: 30000, desc: 'Skip the standard queue with expedited editing' },
  { id: 'addon-drone', name: '4K Aerial Drone Coverage', price: 60000, desc: 'Licensed drone operator for striking outdoor vistas' }
];

const DEFAULT_USERS = [
  {
    id: 'user-client-1',
    email: 'client@smartstudio.ng',
    password: 'password123',
    name: 'Samuel Adekunle',
    phone: '09027462645',
    role: 'client',
    memberSince: 'March 2026',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80'
  },
  {
    id: 'user-admin-1',
    email: 'admin@smartstudio.ng',
    password: 'admin123',
    name: 'Studio Director',
    phone: '09027462645',
    role: 'admin',
    memberSince: 'January 2026',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
  }
];

const DEFAULT_ORDERS = [
  {
    id: 'SS-ABJ-9041',
    userId: 'user-client-1',
    userName: 'Samuel Adekunle',
    userEmail: 'client@smartstudio.ng',
    userPhone: '09027462645',
    serviceId: 'portrait',
    serviceName: 'Portrait Photography',
    packageId: 'port-sig',
    packageName: 'Signature Studio Session',
    basePrice: 85000,
    addons: [
      { id: 'addon-mua', name: 'Professional Studio Makeup Artist (MUA)', price: 25000 }
    ],
    totalPrice: 110000,
    status: 'shooting', // 'booked', 'shooting', 'proofing', 'retouching', 'completed'
    statusLabel: 'Studio Shoot In Progress',
    scheduledDate: '2026-10-04',
    scheduledTime: '10:00 AM - 12:30 PM',
    location: 'Smart Studio Cyclorama (4 Kabama Estate Layout, Abuja)',
    notes: 'Classic black turtleneck and gold wristwatch portrait for personal brand branding.',
    paymentStatus: 'Paid (Deposit 50% Verified)',
    paymentMethod: 'Paystack / Online Card',
    createdAt: '2026-09-26T14:30:00Z',
    galleryId: null
  },
  {
    id: 'SS-ABJ-8724',
    userId: 'user-client-1',
    userName: 'Samuel Adekunle',
    userEmail: 'client@smartstudio.ng',
    userPhone: '09027462645',
    serviceId: 'creative',
    serviceName: 'Creative / Concept Photography',
    packageId: 'creat-album',
    packageName: 'Album & Creative Campaign',
    basePrice: 160000,
    addons: [],
    totalPrice: 160000,
    status: 'proofing',
    statusLabel: 'Client Proofing Ready',
    scheduledDate: '2026-09-20',
    scheduledTime: '02:00 PM - 05:00 PM',
    location: 'Smart Studio Cyclorama & Dark Stage',
    notes: 'Avant-garde gel lighting and textured backdrop shoot for musical EP launch.',
    paymentStatus: 'Paid in Full',
    paymentMethod: 'Bank Transfer (Verified)',
    createdAt: '2026-09-15T09:12:00Z',
    galleryId: 'gal-8724'
  }
];

const DEFAULT_PROOFS = [
  {
    id: 'gal-8724',
    orderId: 'SS-ABJ-8724',
    title: 'Creative EP Concept Shoot &bull; Selection Gallery',
    shootDate: 'September 20, 2026',
    quota: 10,
    status: 'Reviewing Proofs',
    photos: [
      { id: 'ph-1', url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=1200&q=80', title: 'Frame 01 - Golden Warm Key Light', isFavorite: true, clientComment: 'Love the rim light here. Please soften background shadow slightly.' },
      { id: 'ph-2', url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1200&q=80', title: 'Frame 02 - High-Fashion Kinetic Pose', isFavorite: true, clientComment: '' },
      { id: 'ph-3', url: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=1200&q=80', title: 'Frame 03 - Tailored Coat Profile', isFavorite: false, clientComment: '' },
      { id: 'ph-4', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80', title: 'Frame 04 - Direct Rembrandt Portrait', isFavorite: true, clientComment: 'Perfect for the album front cover!' },
      { id: 'ph-5', url: 'https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?auto=format&fit=crop&w=1200&q=80', title: 'Frame 05 - Minimalist Shadow Play', isFavorite: false, clientComment: '' },
      { id: 'ph-6', url: 'https://images.unsplash.com/photo-1589156280159-27698a70f29e?auto=format&fit=crop&w=1200&q=80', title: 'Frame 06 - Close-Up Editorial Focus', isFavorite: true, clientComment: 'Flawless eyes and reflection.' },
      { id: 'ph-7', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=1200&q=80', title: 'Frame 07 - Studio Strobe Contrast', isFavorite: true, clientComment: '' },
      { id: 'ph-8', url: 'https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?auto=format&fit=crop&w=1200&q=80', title: 'Frame 08 - Prism Geometric Reflections', isFavorite: false, clientComment: '' },
      { id: 'ph-9', url: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=1200&q=80', title: 'Frame 09 - Warm Amber Halo', isFavorite: true, clientComment: '' },
      { id: 'ph-10', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1200&q=80', title: 'Frame 10 - Candid Expression Stance', isFavorite: false, clientComment: '' },
      { id: 'ph-11', url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80', title: 'Frame 11 - Ambient Light Silhouette', isFavorite: false, clientComment: '' },
      { id: 'ph-12', url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=1200&q=80', title: 'Frame 12 - Confident Studio Gaze', isFavorite: true, clientComment: 'Great backup press image.' }
    ]
  }
];

class AppStore {
  constructor() {
    this.init();
  }

  init() {
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ORDERS)) {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(DEFAULT_ORDERS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.PROOFS)) {
      localStorage.setItem(STORAGE_KEYS.PROOFS, JSON.stringify(DEFAULT_PROOFS));
    }
    // Auto-login default client if not logged in
    if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) {
      this.setCurrentUser(DEFAULT_USERS[0]);
    }
  }

  // --- Auth Methods ---
  getCurrentUser() {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return data ? JSON.parse(data) : null;
  }

  setCurrentUser(user) {
    if (!user) {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    } else {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    }
  }

  login(email, password) {
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim() && u.password === password);
    if (user) {
      this.setCurrentUser(user);
      return { success: true, user };
    }
    return { success: false, message: 'Invalid email or password.' };
  }

  register(userData) {
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const exists = users.some(u => u.email.toLowerCase() === userData.email.toLowerCase().trim());
    if (exists) {
      return { success: false, message: 'An account with this email already exists.' };
    }

    const newUser = {
      id: 'user-' + Date.now(),
      email: userData.email.trim(),
      password: userData.password,
      name: userData.name.trim(),
      phone: userData.phone.trim(),
      role: 'client',
      memberSince: 'September 2026',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
    };

    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    this.setCurrentUser(newUser);
    return { success: true, user: newUser };
  }

  logout() {
    this.setCurrentUser(null);
  }

  updateUserAvatar(avatarUrl) {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return false;

    currentUser.avatar = avatarUrl;
    this.setCurrentUser(currentUser);

    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const user = users.find(u => u.id === currentUser.id);
    if (user) {
      user.avatar = avatarUrl;
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    }
    return true;
  }

  updateUserProfile(profileData) {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return false;

    if (profileData.name) currentUser.name = profileData.name.trim();
    if (profileData.phone) currentUser.phone = profileData.phone.trim();
    if (profileData.avatar) currentUser.avatar = profileData.avatar;

    this.setCurrentUser(currentUser);

    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const user = users.find(u => u.id === currentUser.id);
    if (user) {
      if (profileData.name) user.name = profileData.name.trim();
      if (profileData.phone) user.phone = profileData.phone.trim();
      if (profileData.avatar) user.avatar = profileData.avatar;
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    }
    return true;
  }

  // --- Services & Addons ---
  getServices() {
    return DEFAULT_SERVICES;
  }

  getServiceById(id) {
    return DEFAULT_SERVICES.find(s => s.id === id);
  }

  getAddons() {
    return AVAILABLE_ADDONS;
  }

  // --- Orders Methods ---
  getOrders() {
    const data = localStorage.getItem(STORAGE_KEYS.ORDERS);
    return data ? JSON.parse(data) : [];
  }

  getUserOrders(userId) {
    const orders = this.getOrders();
    return orders.filter(o => o.userId === userId);
  }

  getOrderById(id) {
    const orders = this.getOrders();
    return orders.find(o => o.id === id);
  }

  createOrder(orderData) {
    const orders = this.getOrders();
    const currentUser = this.getCurrentUser();

    const newOrder = {
      id: 'SS-ABJ-' + Math.floor(1000 + Math.random() * 9000),
      userId: currentUser ? currentUser.id : 'guest',
      userName: currentUser ? currentUser.name : orderData.name,
      userEmail: currentUser ? currentUser.email : orderData.email,
      userPhone: currentUser ? currentUser.phone : orderData.phone,
      serviceId: orderData.serviceId,
      serviceName: orderData.serviceName,
      packageId: orderData.packageId,
      packageName: orderData.packageName,
      basePrice: orderData.basePrice,
      addons: orderData.addons || [],
      totalPrice: orderData.totalPrice,
      status: 'booked',
      statusLabel: 'Confirmed & Scheduled',
      scheduledDate: orderData.scheduledDate,
      scheduledTime: orderData.scheduledTime,
      location: orderData.location || 'Smart Studio (4 Kabama Estate Layout, Abuja)',
      notes: orderData.notes || '',
      paymentStatus: 'Payment Pending at Studio',
      paymentMethod: orderData.paymentMethod || 'Studio POS / Paystack',
      createdAt: new Date().toISOString(),
      galleryId: null
    };

    orders.unshift(newOrder);
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    return newOrder;
  }

  updateOrderStatus(orderId, newStatus, newStatusLabel) {
    const orders = this.getOrders();
    const order = orders.find(o => o.id === orderId);
    if (order) {
      order.status = newStatus;
      if (newStatusLabel) order.statusLabel = newStatusLabel;
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
      return true;
    }
    return false;
  }

  // --- Proofing Galleries ---
  getProofs() {
    const data = localStorage.getItem(STORAGE_KEYS.PROOFS);
    return data ? JSON.parse(data) : [];
  }

  getProofById(galleryId) {
    const proofs = this.getProofs();
    return proofs.find(p => p.id === galleryId);
  }

  toggleProofFavorite(galleryId, photoId) {
    const proofs = this.getProofs();
    const gallery = proofs.find(p => p.id === galleryId);
    if (gallery) {
      const photo = gallery.photos.find(ph => ph.id === photoId);
      if (photo) {
        photo.isFavorite = !photo.isFavorite;
        localStorage.setItem(STORAGE_KEYS.PROOFS, JSON.stringify(proofs));
        return { success: true, isFavorite: photo.isFavorite };
      }
    }
    return { success: false };
  }

  addProofComment(galleryId, photoId, comment) {
    const proofs = this.getProofs();
    const gallery = proofs.find(p => p.id === galleryId);
    if (gallery) {
      const photo = gallery.photos.find(ph => ph.id === photoId);
      if (photo) {
        photo.clientComment = comment;
        localStorage.setItem(STORAGE_KEYS.PROOFS, JSON.stringify(proofs));
        return { success: true };
      }
    }
    return { success: false };
  }

  submitProofSelections(galleryId) {
    const proofs = this.getProofs();
    const gallery = proofs.find(p => p.id === galleryId);
    if (gallery) {
      gallery.status = 'Selections Submitted to Retouching';
      localStorage.setItem(STORAGE_KEYS.PROOFS, JSON.stringify(proofs));
      return { success: true };
    }
    return { success: false };
  }

  // Currency Formatter
  formatNaira(amount) {
    return '₦' + Number(amount).toLocaleString('en-NG');
  }
}

// Global Store Instance
window.StudioStore = new AppStore();
