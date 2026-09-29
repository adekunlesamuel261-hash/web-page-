/**
 * SMART STUDIO WEB APP - ONLINE ORDERING & PACKAGE BUILDER MODULE
 * With Multi-Payment Options (Paystack, Bank Wire, Studio POS, USDT Crypto)
 * and 50% VIP Retainer vs 100% Full Payment Breakdown
 */

const OrderingModule = {
  currentStep: 1,
  selectedServiceId: 'portrait',
  selectedPackageId: 'port-sig',
  selectedAddons: [],
  scheduledDate: '',
  scheduledTime: '10:00 AM - 12:30 PM',
  shootLocation: 'Smart Studio Cyclorama Stage (4 Kabama Estate Layout, Abuja)',
  shootNotes: '',
  
  // Payment Options
  paymentType: 'full', // 'full' (100%) or 'deposit' (50%)
  paymentMethod: 'paystack', // 'paystack', 'bank', 'pos', 'crypto'
  pendingOrder: null,

  init() {
    this.renderServices();
    this.renderPackages();
    this.renderAddons();
    this.updateSummary();
    this.bindEvents();
    this.initPaymentSelectors();
    
    // Set default date to 5 days from today
    const d = new Date();
    d.setDate(d.getDate() + 5);
    const dateInput = document.getElementById('wizard-date-input');
    if (dateInput) {
      dateInput.value = d.toISOString().split('T')[0];
      this.scheduledDate = dateInput.value;
    }
  },

  renderServices() {
    const container = document.getElementById('wizard-services-grid');
    if (!container) return;

    const services = window.StudioStore.getServices();
    container.innerHTML = services.map(s => `
      <div class="service-select-box ${s.id === this.selectedServiceId ? 'selected' : ''}" data-service-id="${s.id}">
        <h4 class="service-box-title">${s.name}</h4>
        <p class="service-box-desc">${s.tagline}</p>
        <span style="font-size: 0.75rem; color: var(--app-gold); margin-top: 0.8rem; font-weight: 600;">
          Packages from ${window.StudioStore.formatNaira(s.packages[0].price)}
        </span>
      </div>
    `).join('');
  },

  renderPackages() {
    const container = document.getElementById('wizard-packages-grid');
    if (!container) return;

    const service = window.StudioStore.getServiceById(this.selectedServiceId);
    if (!service) return;

    // Check if current package belongs to service, else default to first
    if (!service.packages.some(p => p.id === this.selectedPackageId)) {
      this.selectedPackageId = service.packages[0].id;
    }

    container.innerHTML = service.packages.map(p => `
      <div class="package-select-box ${p.id === this.selectedPackageId ? 'selected' : ''}" data-package-id="${p.id}">
        ${p.popular ? '<span class="package-popular-tag">MOST POPULAR</span>' : ''}
        <h4 style="font-size: 1.1rem; color: var(--app-ivory);">${p.name}</h4>
        <div class="package-box-price">${window.StudioStore.formatNaira(p.price)}</div>
        <ul class="package-feature-list">
          ${p.features.map(f => `<li>${f}</li>`).join('')}
        </ul>
      </div>
    `).join('');
  },

  renderAddons() {
    const container = document.getElementById('wizard-addons-grid');
    if (!container) return;

    const addons = window.StudioStore.getAddons();
    container.innerHTML = addons.map(a => {
      const isSelected = this.selectedAddons.some(x => x.id === a.id);
      return `
        <div class="addon-checkbox-card ${isSelected ? 'selected' : ''}" data-addon-id="${a.id}">
          <div class="addon-check-box">${isSelected ? '✓' : ''}</div>
          <div style="flex-grow: 1;">
            <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 0.3rem;">
              <h4 style="font-size: 0.92rem; color: var(--app-ivory); font-weight: 600;">${a.name}</h4>
              <span style="font-size: 0.88rem; color: var(--app-gold); font-weight: 700;">+${window.StudioStore.formatNaira(a.price)}</span>
            </div>
            <p style="font-size: 0.78rem; color: var(--app-gray);">${a.desc}</p>
          </div>
        </div>
      `;
    }).join('');
  },

  calculateAmounts() {
    const service = window.StudioStore.getServiceById(this.selectedServiceId);
    const pkg = service?.packages.find(p => p.id === this.selectedPackageId);
    const basePrice = pkg ? pkg.price : 0;
    const addonsTotal = this.selectedAddons.reduce((sum, item) => sum + item.price, 0);
    const grandTotal = basePrice + addonsTotal;
    const depositAmount = Math.round(grandTotal * 0.5);
    const balanceRemaining = this.paymentType === 'deposit' ? grandTotal - depositAmount : 0;
    const dueNow = this.paymentType === 'deposit' ? depositAmount : grandTotal;

    return {
      basePrice,
      addonsTotal,
      grandTotal,
      depositAmount,
      balanceRemaining,
      dueNow
    };
  },

  updateSummary() {
    const service = window.StudioStore.getServiceById(this.selectedServiceId);
    const pkg = service?.packages.find(p => p.id === this.selectedPackageId);
    const { basePrice, grandTotal, dueNow, balanceRemaining } = this.calculateAmounts();

    // Update summary UI rail
    const summaryServiceEl = document.getElementById('summary-service-name');
    const summaryPkgEl = document.getElementById('summary-package-name');
    const summaryBasePriceEl = document.getElementById('summary-base-price');
    const summaryAddonsListEl = document.getElementById('summary-addons-list');
    const summaryTotalEl = document.getElementById('summary-total-price');

    if (summaryServiceEl) summaryServiceEl.innerText = service ? service.name : 'Not selected';
    if (summaryPkgEl) summaryPkgEl.innerText = pkg ? pkg.name : 'Not selected';
    if (summaryBasePriceEl) summaryBasePriceEl.innerText = window.StudioStore.formatNaira(basePrice);
    
    if (summaryAddonsListEl) {
      if (this.selectedAddons.length === 0) {
        summaryAddonsListEl.innerHTML = '<div style="font-size: 0.78rem; color: var(--app-gray); font-style: italic;">No add-ons selected</div>';
      } else {
        summaryAddonsListEl.innerHTML = this.selectedAddons.map(a => `
          <div class="summary-line-item" style="font-size: 0.8rem;">
            <span>+ ${a.name}</span>
            <span style="color: var(--app-gold);">${window.StudioStore.formatNaira(a.price)}</span>
          </div>
        `).join('');
      }
    }

    if (summaryTotalEl) summaryTotalEl.innerText = window.StudioStore.formatNaira(grandTotal);

    // Update Step 4 payment breakdown values if elements exist
    const dueNowEl = document.getElementById('checkout-due-now');
    const balanceEl = document.getElementById('checkout-balance-remaining');
    const submitBtn = document.getElementById('wizard-submit-btn');

    if (dueNowEl) dueNowEl.innerText = window.StudioStore.formatNaira(dueNow);
    if (balanceEl) balanceEl.innerText = window.StudioStore.formatNaira(balanceRemaining);
    if (submitBtn) {
      const methodLabels = {
        'paystack': 'Pay Now via Paystack',
        'bank': 'Pay via Bank Transfer',
        'pos': 'Reserve & Pay at Studio POS',
        'crypto': 'Pay via USDT (Crypto)'
      };
      submitBtn.innerHTML = `${methodLabels[this.paymentMethod] || 'Complete Booking'} (${window.StudioStore.formatNaira(dueNow)}) &rarr;`;
    }
  },

  goToStep(step) {
    this.currentStep = step;

    // Update Step tabs in UI
    document.querySelectorAll('.wizard-step-tab').forEach(tab => {
      const tabNum = parseInt(tab.getAttribute('data-step'), 10);
      tab.classList.toggle('active', tabNum === step);
    });

    // Toggle panels
    document.querySelectorAll('.wizard-step-panel').forEach(panel => {
      const panelNum = parseInt(panel.getAttribute('data-step-panel'), 10);
      panel.style.display = panelNum === step ? 'block' : 'none';
    });

    // Update bottom wizard actions
    const prevBtn = document.getElementById('wizard-prev-btn');
    const nextBtn = document.getElementById('wizard-next-btn');
    const submitBtn = document.getElementById('wizard-submit-btn');

    if (prevBtn) prevBtn.style.display = step > 1 ? 'inline-flex' : 'none';
    if (nextBtn) nextBtn.style.display = step < 4 ? 'inline-flex' : 'none';
    if (submitBtn) submitBtn.style.display = step === 4 ? 'inline-flex' : 'none';

    // Populate review summary in step 4
    if (step === 4) {
      this.populateReviewStep();
    }
  },

  populateReviewStep() {
    const service = window.StudioStore.getServiceById(this.selectedServiceId);
    const pkg = service?.packages.find(p => p.id === this.selectedPackageId);
    const user = window.StudioStore.getCurrentUser();

    const nameEl = document.getElementById('review-client-name');
    const phoneEl = document.getElementById('review-client-phone');
    const dateEl = document.getElementById('review-shoot-date');
    const locEl = document.getElementById('review-shoot-loc');
    const notesEl = document.getElementById('review-shoot-notes');

    if (nameEl) nameEl.innerText = user ? user.name : 'Studio Guest';
    if (phoneEl) phoneEl.innerText = user ? user.phone : '09027462645';
    if (dateEl) dateEl.innerText = this.scheduledDate + ' (' + this.scheduledTime + ')';
    if (locEl) locEl.innerText = this.shootLocation;
    if (notesEl) notesEl.innerText = this.shootNotes || 'No specific wardrobe requests provided.';

    this.updateSummary();
  },

  initPaymentSelectors() {
    // Payment Plan Option (50% Deposit vs 100% Full)
    document.querySelectorAll('.payment-plan-pill').forEach(pill => {
      pill.addEventListener('click', (e) => {
        document.querySelectorAll('.payment-plan-pill').forEach(p => p.classList.remove('active'));
        const target = e.currentTarget;
        target.classList.add('active');
        this.paymentType = target.getAttribute('data-plan');
        this.updateSummary();
      });
    });

    // Payment Method Option (Paystack, Bank, POS, Crypto)
    document.querySelectorAll('.payment-method-card').forEach(card => {
      card.addEventListener('click', (e) => {
        document.querySelectorAll('.payment-method-card').forEach(c => c.classList.remove('active'));
        const target = e.currentTarget;
        target.classList.add('active');
        this.paymentMethod = target.getAttribute('data-method');
        this.updateSummary();
      });
    });
  },

  bindEvents() {
    // Service selection
    document.addEventListener('click', (e) => {
      const serviceBox = e.target.closest('.service-select-box');
      if (serviceBox) {
        this.selectedServiceId = serviceBox.getAttribute('data-service-id');
        this.renderServices();
        this.renderPackages();
        this.updateSummary();
      }

      // Package selection
      const pkgBox = e.target.closest('.package-select-box');
      if (pkgBox) {
        this.selectedPackageId = pkgBox.getAttribute('data-package-id');
        this.renderPackages();
        this.updateSummary();
      }

      // Add-on selection
      const addonCard = e.target.closest('.addon-checkbox-card');
      if (addonCard) {
        const addonId = addonCard.getAttribute('data-addon-id');
        const addon = window.StudioStore.getAddons().find(a => a.id === addonId);
        if (addon) {
          const idx = this.selectedAddons.findIndex(a => a.id === addonId);
          if (idx > -1) {
            this.selectedAddons.splice(idx, 1);
          } else {
            this.selectedAddons.push(addon);
          }
          this.renderAddons();
          this.updateSummary();
        }
      }

      // Wizard Stepper tabs
      const stepTab = e.target.closest('.wizard-step-tab');
      if (stepTab) {
        const stepNum = parseInt(stepTab.getAttribute('data-step'), 10);
        this.goToStep(stepNum);
      }
    });

    // Step Next / Prev / Submit buttons
    const nextBtn = document.getElementById('wizard-next-btn');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (this.currentStep < 4) {
          this.goToStep(this.currentStep + 1);
        }
      });
    }

    const prevBtn = document.getElementById('wizard-prev-btn');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (this.currentStep > 1) {
          this.goToStep(this.currentStep - 1);
        }
      });
    }

    // Date & Time inputs
    const dateInput = document.getElementById('wizard-date-input');
    if (dateInput) {
      dateInput.addEventListener('change', (e) => { this.scheduledDate = e.target.value; });
    }

    const timeSelect = document.getElementById('wizard-time-select');
    if (timeSelect) {
      timeSelect.addEventListener('change', (e) => { this.scheduledTime = e.target.value; });
    }

    const locSelect = document.getElementById('wizard-location-select');
    if (locSelect) {
      locSelect.addEventListener('change', (e) => { this.shootLocation = e.target.value; });
    }

    const notesText = document.getElementById('wizard-notes-input');
    if (notesText) {
      notesText.addEventListener('input', (e) => { this.shootNotes = e.target.value; });
    }

    // Submit Order & Trigger Payment Modal
    const submitBtn = document.getElementById('wizard-submit-btn');
    if (submitBtn) {
      submitBtn.addEventListener('click', () => {
        this.initiateBookingPayment();
      });
    }
  },

  initiateBookingPayment() {
    const service = window.StudioStore.getServiceById(this.selectedServiceId);
    const pkg = service?.packages.find(p => p.id === this.selectedPackageId);
    const { grandTotal, dueNow, balanceRemaining } = this.calculateAmounts();

    const paymentMethodTitles = {
      'paystack': 'Paystack Online Card (Debit/Mastercard/Visa)',
      'bank': 'Guaranty Trust Bank (GTB) Direct Wire',
      'pos': 'Studio Reception POS / Cash on Arrival',
      'crypto': 'Cryptocurrency USDT (TRC20 Network)'
    };

    const paymentStatusLabels = {
      'full': 'Payment Verified in Full',
      'deposit': `50% Deposit Paid (₦${balanceRemaining.toLocaleString('en-NG')} Due at Shoot)`
    };

    // Create preliminary order
    const order = window.StudioStore.createOrder({
      serviceId: this.selectedServiceId,
      serviceName: service.name,
      packageId: this.selectedPackageId,
      packageName: pkg.name,
      basePrice: pkg ? pkg.price : 0,
      addons: this.selectedAddons,
      totalPrice: grandTotal,
      dueNow: dueNow,
      balanceRemaining: balanceRemaining,
      paymentType: this.paymentType,
      paymentMethod: paymentMethodTitles[this.paymentMethod],
      paymentMethodKey: this.paymentMethod,
      scheduledDate: this.scheduledDate,
      scheduledTime: this.scheduledTime,
      location: this.shootLocation,
      notes: this.shootNotes
    });

    this.pendingOrder = order;

    // Open Interactive Payment Simulation Modal
    this.openPaymentCheckoutModal(order, dueNow, balanceRemaining);
  },

  openPaymentCheckoutModal(order, dueNow, balanceRemaining) {
    const modal = document.getElementById('payment-checkout-modal');
    if (!modal) {
      // Fallback directly to receipt
      this.finalizeOrder(order);
      return;
    }

    // Set Header & Amount info
    document.getElementById('pay-modal-order-id').innerText = order.id;
    document.getElementById('pay-modal-amount-due').innerText = window.StudioStore.formatNaira(dueNow);
    document.getElementById('pay-modal-plan-badge').innerText = this.paymentType === 'deposit' 
      ? `50% Retainer Deposit (Balance ${window.StudioStore.formatNaira(balanceRemaining)} due on shoot day)` 
      : '100% Full Payment (Zero Balance)';

    // Show appropriate payment tab/panel
    const panels = ['paystack', 'bank', 'pos', 'crypto'];
    panels.forEach(p => {
      const el = document.getElementById(`pay-panel-${p}`);
      if (el) el.style.display = p === this.paymentMethod ? 'block' : 'none';
    });

    modal.classList.add('active');
  },

  confirmPaymentSimulation() {
    if (!this.pendingOrder) return;
    
    // Update order status in store
    const methodKey = this.paymentMethod;
    let newStatusLabel = 'Confirmed & Scheduled (Paid in Full)';
    if (this.paymentType === 'deposit') {
      newStatusLabel = 'Confirmed & Scheduled (Deposit Paid)';
    } else if (methodKey === 'pos') {
      newStatusLabel = 'Slot Reserved (Payment at Studio Counter)';
    }

    window.StudioStore.updateOrderStatus(this.pendingOrder.id, 'booked', newStatusLabel);

    // Close checkout modal
    const payModal = document.getElementById('payment-checkout-modal');
    if (payModal) payModal.classList.remove('active');

    // Show Invoice / Receipt
    this.showReceiptModal(this.pendingOrder);
    AppModule.showToast(`Success! Payment verified for Order #${this.pendingOrder.id}.`);
  },

  showReceiptModal(order) {
    const modal = document.getElementById('receipt-modal');
    if (!modal) return;

    const { grandTotal, dueNow, balanceRemaining } = this.calculateAmounts();

    const orderIdEl = document.getElementById('receipt-order-id');
    const clientNameEl = document.getElementById('receipt-client-name');
    const serviceTitleEl = document.getElementById('receipt-service-title');
    const datetimeEl = document.getElementById('receipt-shoot-datetime');
    const totalAmountEl = document.getElementById('receipt-total-amount');
    const paymentMethodEl = document.getElementById('receipt-payment-method');
    const paidNowEl = document.getElementById('receipt-amount-paid');
    const balanceRemainingEl = document.getElementById('receipt-balance-remaining');
    const paymentBadgeEl = document.getElementById('receipt-payment-badge');

    if (orderIdEl) orderIdEl.innerText = order.id;
    if (clientNameEl) clientNameEl.innerText = order.userName;
    if (serviceTitleEl) serviceTitleEl.innerText = `${order.serviceName} (${order.packageName})`;
    if (datetimeEl) datetimeEl.innerText = `${order.scheduledDate} at ${order.scheduledTime}`;
    if (totalAmountEl) totalAmountEl.innerText = window.StudioStore.formatNaira(order.totalPrice || grandTotal);
    
    if (paymentMethodEl) paymentMethodEl.innerText = order.paymentMethod || 'Studio POS';
    if (paidNowEl) paidNowEl.innerText = window.StudioStore.formatNaira(order.dueNow || dueNow);
    if (balanceRemainingEl) balanceRemainingEl.innerText = window.StudioStore.formatNaira(order.balanceRemaining || balanceRemaining);
    
    if (paymentBadgeEl) {
      if (this.paymentType === 'deposit') {
        paymentBadgeEl.innerText = '50% VIP RETAINER PAID';
        paymentBadgeEl.className = 'status-badge status-booked';
      } else {
        paymentBadgeEl.innerText = 'PAID IN FULL';
        paymentBadgeEl.className = 'status-badge status-completed';
      }
    }

    modal.classList.add('active');
  },

  copyAccountDetails(text, feedbackId) {
    navigator.clipboard.writeText(text).then(() => {
      const fb = document.getElementById(feedbackId);
      if (fb) {
        const orig = fb.innerText;
        fb.innerText = 'Copied to Clipboard! ✓';
        fb.style.color = '#10B981';
        setTimeout(() => {
          fb.innerText = orig;
          fb.style.color = '';
        }, 2500);
      }
      AppModule.showToast('Copied to clipboard!');
    });
  }
};

window.OrderingModule = OrderingModule;
