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
    if (['dashboard', 'new-order', 'orders', 'proofing', 'admin', 'profile', 'auth'].includes(hash)) {
      this.navigate(hash);
    } else {
      this.navigate('dashboard');
    }

    // Initialize sub-modules
    AuthModule.init();
    OrderingModule.init();
    ProofingModule.init();
    AdminModule.init();
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
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.app-modal-backdrop').forEach(m => m.classList.remove('active'));
      }
    });
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
