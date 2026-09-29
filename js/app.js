/**
 * SMART STUDIO WEB APP - MASTER CONTROLLER
 */

const AppModule = {
  currentView: 'dashboard',

  init() {
    this.bindGlobalEvents();
    this.refreshUserState();
    
    // Check initial route from hash or default to dashboard
    const hash = window.location.hash.replace('#', '');
    if (['dashboard', 'new-order', 'orders', 'proofing', 'reviews', 'admin', 'profile', 'auth'].includes(hash)) {
      this.navigate(hash);
    } else {
      this.navigate('dashboard');
    }

    // Initialize sub-modules
    AuthModule.init();
    OrderingModule.init();
    ProofingModule.init();
    ReviewsModule.init();
    AdminModule.init();

    // Initialize luxury feature extensions
    this.startCountdown();
    this.initVipCard3D();
    this.initSoundscape();
  },

  navigate(viewId) {
    const user = window.StudioStore.getCurrentUser();

    // Guard: If not logged in and trying to access protected views, redirect to auth
    if (!user && viewId !== 'auth') {
      viewId = 'auth';
    }

    this.currentView = viewId;
    window.location.hash = viewId;

    // Toggle view panels
    document.querySelectorAll('.app-view-panel').forEach(panel => {
      const isTarget = panel.getAttribute('data-view') === viewId;
      panel.style.display = isTarget ? 'block' : 'none';
    });

    // Update active nav links in sidebar
    document.querySelectorAll('.app-nav-item').forEach(item => {
      const targetNav = item.getAttribute('data-target-view');
      item.classList.toggle('active', targetNav === viewId);
    });

    // Update topbar breadcrumbs
    const breadcrumbCurrent = document.getElementById('breadcrumb-current');
    const viewNames = {
      'dashboard': 'Client Overview',
      'new-order': 'Online Ordering & Customizer',
      'orders': 'My Bookings & Milestones',
      'proofing': 'Digital Photo Proofing',
      'reviews': 'Client Reviews & Reputation',
      'admin': 'Studio Manager Console',
      'profile': 'My Account & Settings',
      'auth': 'Sign In / Register'
    };
    if (breadcrumbCurrent) {
      breadcrumbCurrent.innerText = viewNames[viewId] || 'Portal';
    }

    // View specific refreshes
    if (viewId === 'dashboard') {
      this.renderDashboard();
    } else if (viewId === 'orders') {
      this.renderOrdersView();
    } else if (viewId === 'proofing') {
      ProofingModule.renderGallery();
    } else if (viewId === 'reviews') {
      ReviewsModule.renderReviews();
    } else if (viewId === 'admin') {
      AdminModule.renderMetrics();
      AdminModule.renderOrdersTable();
    }

    // Close mobile drawer if open
    document.querySelector('.app-sidebar')?.classList.remove('open');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  refreshUserState() {
    const user = window.StudioStore.getCurrentUser();
    const userWidget = document.getElementById('sidebar-user-widget');
    const userNameEl = document.getElementById('sidebar-user-name');
    const userRoleEl = document.getElementById('sidebar-user-role');
    const userAvatarEl = document.getElementById('sidebar-user-avatar');
    const adminNavSection = document.getElementById('sidebar-admin-section');
    const clientSwitchBtn = document.getElementById('role-btn-client');
    const adminSwitchBtn = document.getElementById('role-btn-admin');

    if (user) {
      if (userWidget) userWidget.style.display = 'flex';
      if (userNameEl) userNameEl.innerText = user.name;
      if (userRoleEl) userRoleEl.innerText = user.role === 'admin' ? 'Studio Director' : 'VIP Client';
      if (userAvatarEl) userAvatarEl.src = user.avatar;

      // Show/hide admin options based on role or mode
      const isAdmin = user.role === 'admin';
      if (adminNavSection) adminNavSection.style.display = isAdmin ? 'block' : 'none';
      if (clientSwitchBtn && adminSwitchBtn) {
        clientSwitchBtn.classList.toggle('active', !isAdmin);
        adminSwitchBtn.classList.toggle('active', isAdmin);
      }

      // Profile View Synchronization
      const profileAvatar = document.getElementById('profile-view-avatar');
      const profileName = document.getElementById('profile-display-name');
      const profileBadge = document.getElementById('profile-display-badge');
      const inputName = document.getElementById('profile-input-name');
      const inputEmail = document.getElementById('profile-input-email');
      const inputPhone = document.getElementById('profile-input-phone');

      if (profileAvatar) profileAvatar.src = user.avatar;
      if (profileName) profileName.innerText = user.name;
      if (profileBadge) profileBadge.innerText = user.role === 'admin' ? 'Studio Director' : 'VIP Creative Client';
      if (inputName) inputName.value = user.name;
      if (inputEmail) inputEmail.value = user.email;
      if (inputPhone) inputPhone.value = user.phone;

      // VIP Metal Card Synchronization
      const vipCardAvatar = document.getElementById('vip-card-avatar-img');
      const vipCardHolder = document.getElementById('vip-card-holder-name');
      const vipCardTier = document.getElementById('vip-card-tier-text');
      if (vipCardAvatar) vipCardAvatar.src = user.avatar;
      if (vipCardHolder) vipCardHolder.innerText = user.name;
      if (vipCardTier) vipCardTier.innerText = user.role === 'admin' ? 'STUDIO DIRECTOR ACCESS' : 'VIP CREATIVE CLIENT';
    } else {
      if (userWidget) userWidget.style.display = 'none';
      if (adminNavSection) adminNavSection.style.display = 'none';
    }
  },

  renderDashboard() {
    const user = window.StudioStore.getCurrentUser();
    if (!user) return;

    const greetingEl = document.getElementById('dashboard-greeting-name');
    if (greetingEl) greetingEl.innerText = user.name.split(' ')[0];

    const orders = window.StudioStore.getUserOrders(user.id);
    const activeShoots = orders.filter(o => ['booked', 'shooting', 'proofing', 'retouching'].includes(o.status)).length;
    const completedShoots = orders.filter(o => o.status === 'completed').length;
    const totalSpent = orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);

    // Dashboard metrics
    const statActive = document.getElementById('dash-stat-active');
    const statProofs = document.getElementById('dash-stat-proofs');
    const statDone = document.getElementById('dash-stat-completed');
    const statSpent = document.getElementById('dash-stat-spent');

    if (statActive) statActive.innerText = activeShoots;
    if (statProofs) statProofs.innerText = '1 Gallery';
    if (statDone) statDone.innerText = completedShoots;
    if (statSpent) statSpent.innerText = window.StudioStore.formatNaira(totalSpent);

    // Render Recent Orders in Dashboard
    const tbody = document.getElementById('dash-orders-table-body');
    if (tbody) {
      if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--app-gray); padding: 2rem;">No bookings yet. Click "Book New Session" to create your first shoot!</td></tr>';
      } else {
        tbody.innerHTML = orders.slice(0, 3).map(o => `
          <tr>
            <td><strong>#${o.id}</strong></td>
            <td>${o.serviceName} &bull; <span style="color: var(--app-gold); font-size: 0.8rem;">${o.packageName}</span></td>
            <td>${o.scheduledDate}</td>
            <td><span class="status-badge status-${o.status}">${o.statusLabel}</span></td>
            <td>
              <button class="btn-dark" style="padding: 0.35rem 0.8rem; font-size: 0.75rem;" data-action="view-invoice" data-order-id="${o.id}">
                View Receipt
              </button>
            </td>
          </tr>
        `).join('');
      }
    }
  },

  renderOrdersView() {
    const user = window.StudioStore.getCurrentUser();
    if (!user) return;

    const orders = window.StudioStore.getUserOrders(user.id);
    const container = document.getElementById('my-orders-list-container');
    if (!container) return;

    if (orders.length === 0) {
      container.innerHTML = '<div style="padding: 3rem; text-align: center; color: var(--app-gray);">No active bookings found.</div>';
      return;
    }

    container.innerHTML = orders.map(order => `
      <div class="timeline-card" style="margin-bottom: 2rem;">
        <div class="timeline-card-header">
          <div>
            <span style="font-size: 0.75rem; letter-spacing: 0.15em; color: var(--app-gold); text-transform: uppercase; font-weight: 700;">
              ORDER #${order.id} &bull; ${order.serviceName}
            </span>
            <h3 style="font-size: 1.6rem; color: var(--app-ivory); margin-top: 0.3rem;">${order.packageName}</h3>
            <p style="color: var(--app-gray); font-size: 0.85rem;">Scheduled: ${order.scheduledDate} (${order.scheduledTime}) &bull; ${order.location}</p>
          </div>
          <div style="text-align: right;">
            <div style="font-family: var(--font-serif); font-size: 1.8rem; color: var(--app-gold); font-weight: 600;">
              ${window.StudioStore.formatNaira(order.totalPrice)}
            </div>
            <span class="status-badge status-${order.status}" style="margin-top: 0.5rem;">${order.statusLabel}</span>
          </div>
        </div>

        <!-- 5-Step Live Milestone Tracker -->
        <div class="tracker-steps">
          <div class="tracker-step ${['booked', 'shooting', 'proofing', 'retouching', 'completed'].includes(order.status) ? (order.status === 'booked' ? 'current' : 'completed') : ''}">
            <div class="step-node">1</div>
            <div class="step-title">Booked</div>
            <div class="step-desc">Deposit &amp; Slot Confirmed</div>
          </div>

          <div class="tracker-step ${['shooting', 'proofing', 'retouching', 'completed'].includes(order.status) ? (order.status === 'shooting' ? 'current' : 'completed') : ''}">
            <div class="step-node">2</div>
            <div class="step-title">Studio Shoot</div>
            <div class="step-desc">Production Session</div>
          </div>

          <div class="tracker-step ${['proofing', 'retouching', 'completed'].includes(order.status) ? (order.status === 'proofing' ? 'current' : 'completed') : ''}">
            <div class="step-node">3</div>
            <div class="step-title">Proofing</div>
            <div class="step-desc">Client Selections</div>
          </div>

          <div class="tracker-step ${['retouching', 'completed'].includes(order.status) ? (order.status === 'retouching' ? 'current' : 'completed') : ''}">
            <div class="step-node">4</div>
            <div class="step-title">Retouching</div>
            <div class="step-desc">Master Skin &amp; Color Grade</div>
          </div>

          <div class="tracker-step ${order.status === 'completed' ? 'current' : ''}">
            <div class="step-node">5</div>
            <div class="step-title">Delivered</div>
            <div class="step-desc">High-Res Gallery Download</div>
          </div>
        </div>

        <div style="margin-top: 1.8rem; padding-top: 1.2rem; border-top: 1px solid var(--app-border); display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 0.8rem; color: var(--app-gray);">Payment: ${order.paymentStatus} via ${order.paymentMethod}</span>
          <div style="display: flex; gap: 0.8rem;">
            ${order.galleryId ? `<button class="btn-gold" style="padding: 0.5rem 1.2rem; font-size: 0.75rem;" onclick="AppModule.navigate('proofing')">Review Proof Gallery &rarr;</button>` : ''}
            <button class="btn-dark" style="padding: 0.5rem 1.2rem; font-size: 0.75rem;" data-action="view-invoice" data-order-id="${order.id}">Print Receipt</button>
          </div>
        </div>
      </div>
    `).join('');
  },

  bindGlobalEvents() {
    // Nav Click Router
    document.addEventListener('click', (e) => {
      const navItem = e.target.closest('[data-target-view]');
      if (navItem) {
        e.preventDefault();
        const viewId = navItem.getAttribute('data-target-view');
        this.navigate(viewId);
      }

      // Quick Role Switcher
      if (e.target.id === 'role-btn-client' || e.target.closest('#role-btn-client')) {
        window.StudioStore.login('client@smartstudio.ng', 'password123');
        this.refreshUserState();
        this.navigate('dashboard');
        this.showToast('Switched to Client View: Samuel Adekunle');
      }

      if (e.target.id === 'role-btn-admin' || e.target.closest('#role-btn-admin')) {
        window.StudioStore.login('admin@smartstudio.ng', 'admin123');
        this.refreshUserState();
        this.navigate('admin');
        this.showToast('Switched to Studio Manager View');
      }

      // Close modals
      if (e.target.matches('.app-modal-close') || e.target.closest('.app-modal-close') || e.target.matches('.app-modal-backdrop')) {
        document.querySelectorAll('.app-modal-backdrop').forEach(m => m.classList.remove('active'));
      }

      // Mobile Menu Toggle
      if (e.target.id === 'app-mobile-menu-toggle' || e.target.closest('#app-mobile-menu-toggle')) {
        document.querySelector('.app-sidebar')?.classList.toggle('open');
      }

      // Avatar upload triggers
      if (e.target.id === 'btn-trigger-upload' || e.target.closest('#btn-trigger-upload') || e.target.id === 'avatar-click-zone' || e.target.closest('#avatar-click-zone')) {
        document.getElementById('profile-file-input')?.click();
      }

      // Toggle presets drawer
      if (e.target.id === 'btn-toggle-presets' || e.target.closest('#btn-toggle-presets')) {
        const drawer = document.getElementById('avatar-presets-drawer');
        if (drawer) {
          drawer.style.display = drawer.style.display === 'none' ? 'block' : 'none';
        }
      }

      // Preset avatar option clicked
      const presetOption = e.target.closest('.preset-avatar-option');
      if (presetOption) {
        const url = presetOption.getAttribute('data-url');
        if (url) {
          window.StudioStore.updateUserAvatar(url);
          this.refreshUserState();
          this.showToast('Avatar preset applied!');
        }
      }

      // Apply custom avatar URL
      if (e.target.id === 'btn-apply-avatar-url' || e.target.closest('#btn-apply-avatar-url')) {
        const urlInput = document.getElementById('custom-avatar-url');
        const url = urlInput?.value.trim();
        if (!url) {
          this.showToast('Please enter an image link.', 'error');
        } else {
          window.StudioStore.updateUserAvatar(url);
          this.refreshUserState();
          urlInput.value = '';
          this.showToast('Profile picture updated from URL!');
        }
      }

      // Open shoot checklist modal
      if (e.target.id === 'btn-shoot-prep-guide' || e.target.closest('#btn-shoot-prep-guide')) {
        document.getElementById('prep-checklist-modal')?.classList.add('active');
      }

      // Sync shoot to calendar
      if (e.target.id === 'btn-sync-calendar' || e.target.closest('#btn-sync-calendar')) {
        this.downloadCalendarFile();
      }
    });

    // Native file input change -> read file as Data URL
    document.getElementById('profile-file-input')?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        this.showToast('Please select a valid image file.', 'error');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target.result;
        window.StudioStore.updateUserAvatar(dataUrl);
        this.refreshUserState();
        this.showToast('Profile picture uploaded & updated!');
      };
      reader.readAsDataURL(file);
    });

    // Edit profile form submit
    document.getElementById('profile-edit-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('profile-input-name').value;
      const phone = document.getElementById('profile-input-phone').value;

      window.StudioStore.updateUserProfile({ name, phone });
      this.refreshUserState();
      this.showToast('Profile details updated successfully!');
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.app-modal-backdrop').forEach(m => m.classList.remove('active'));
      }
    });
  },

  startCountdown() {
    const cdDays = document.getElementById('cd-days');
    const cdHours = document.getElementById('cd-hours');
    const cdMins = document.getElementById('cd-mins');
    const cdSecs = document.getElementById('cd-secs');

    if (!cdDays || !cdHours || !cdMins || !cdSecs) return;

    // Set countdown target to upcoming session: 6 days, 14 hours from now
    const now = new Date();
    let target = new Date(now.getFullYear(), 9, 4, 10, 0, 0);
    if (target.getTime() <= now.getTime()) {
      target = new Date(now.getTime() + (6 * 24 * 60 * 60 * 1000) + (14 * 60 * 60 * 1000) + (32 * 60 * 1000));
    }

    const update = () => {
      const diff = Math.max(0, target.getTime() - Date.now());
      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);

      cdDays.innerText = String(d).padStart(2, '0');
      cdHours.innerText = String(h).padStart(2, '0');
      cdMins.innerText = String(m).padStart(2, '0');
      cdSecs.innerText = String(s).padStart(2, '0');
    };

    update();
    setInterval(update, 1000);
  },

  initVipCard3D() {
    const card = document.getElementById('vip-card-3d');
    const shine = document.getElementById('vip-card-shine');
    if (!card) return;

    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -12;
      const rotateY = ((x - centerX) / centerX) * 14;

      card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-4px)`;

      if (shine) {
        const shinePercent = (x / rect.width) * 100;
        shine.style.left = `${(shinePercent * 1.5) - 80}%`;
        shine.style.opacity = '1';
      }
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)';
      if (shine) {
        shine.style.opacity = '0';
      }
    });
  },

  audioContext: null,
  soundscapeNodes: null,
  isAudioPlaying: false,

  initSoundscape() {
    const toggleBtn = document.getElementById('soundscape-toggle');
    if (!toggleBtn) return;

    toggleBtn.addEventListener('click', () => {
      if (!this.audioContext) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) {
          this.showToast('Web Audio is not supported in this browser.', 'error');
          return;
        }
        this.audioContext = new AudioCtx();
      }

      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      if (this.isAudioPlaying) {
        this.stopSoundscape();
        toggleBtn.classList.remove('playing');
        this.isAudioPlaying = false;
        this.showToast('Studio Lounge Ambient Audio: OFF');
      } else {
        this.startSoundscape();
        toggleBtn.classList.add('playing');
        this.isAudioPlaying = true;
        this.showToast('Studio Lounge Ambient Audio: ON (Lo-Fi Vinyl Vibes)');
      }
    });
  },

  startSoundscape() {
    if (!this.audioContext) return;
    const ctx = this.audioContext;
    const now = ctx.currentTime;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.001, now);
    masterGain.gain.exponentialRampToValueAtTime(0.06, now + 1.2);
    masterGain.connect(ctx.destination);

    // Warm lowpass filter for velvet lounge texture
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, now);
    filter.connect(masterGain);

    // Rich harmonic chord: A minor 9th (A2, C3, E3, G3, B3)
    const freqs = [110, 130.81, 164.81, 196.00, 246.94];
    const oscs = [];

    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      osc.detune.setValueAtTime((idx - 2) * 5, now);

      const oscGain = ctx.createGain();
      oscGain.gain.setValueAtTime(0.18 / freqs.length, now);

      osc.connect(oscGain);
      oscGain.connect(filter);
      osc.start(now);
      oscs.push(osc);
    });

    this.soundscapeNodes = { masterGain, oscs };
  },

  stopSoundscape() {
    if (!this.soundscapeNodes || !this.audioContext) return;
    const { masterGain, oscs } = this.soundscapeNodes;
    const now = this.audioContext.currentTime;

    masterGain.gain.setValueAtTime(masterGain.gain.value, now);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);

    setTimeout(() => {
      oscs.forEach(osc => {
        try { osc.stop(); osc.disconnect(); } catch (e) {}
      });
      this.soundscapeNodes = null;
    }, 650);
  },

  downloadCalendarFile() {
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Smart Studio Abuja//Production Booking//EN',
      'BEGIN:VEVENT',
      'UID:ss-abj-9041-' + Date.now() + '@smartstudio.ng',
      'DTSTAMP:20261001T090000Z',
      'DTSTART:20261004T090000Z',
      'DTEND:20261004T120000Z',
      'SUMMARY:Smart Studio Abuja - Signature Portrait Session',
      'DESCRIPTION:VIP Studio Production Session at 4 Kabama Estate Layout, Abuja. Wardrobe and styling consultation included.',
      'LOCATION:Smart Studio, 4 Kabama Estate Layout, Abuja, Nigeria',
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'Smart_Studio_Shoot_Oct4.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.showToast('Shoot session calendar invite (.ics) downloaded!');
  },

  showToast(message, type = 'info') {
    let container = document.querySelector('.app-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'app-toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'app-toast';
    if (type === 'error') {
      toast.style.borderColor = '#EF4444';
      toast.style.borderLeftColor = '#EF4444';
    }
    toast.innerText = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  AppModule.init();
});
