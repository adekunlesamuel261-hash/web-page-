/**
 * SMART STUDIO WEB APP - STUDIO ADMIN & MANAGER MODULE
 */

const AdminModule = {
  currentFilter: 'all',

  init() {
    this.renderMetrics();
    this.renderOrdersTable();
    this.bindEvents();
  },

  renderMetrics() {
    const orders = window.StudioStore.getOrders();
    const totalRevenue = orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
    const activeShoots = orders.filter(o => o.status === 'shooting').length;
    const proofingPending = orders.filter(o => o.status === 'proofing').length;

    const elTotalOrders = document.getElementById('admin-stat-total-orders');
    const elRevenue = document.getElementById('admin-stat-revenue');
    const elActiveShoots = document.getElementById('admin-stat-active-shoots');
    const elProofing = document.getElementById('admin-stat-proofing');

    if (elTotalOrders) elTotalOrders.innerText = orders.length;
    if (elRevenue) elRevenue.innerText = window.StudioStore.formatNaira(totalRevenue);
    if (elActiveShoots) elActiveShoots.innerText = activeShoots;
    if (elProofing) elProofing.innerText = proofingPending;
  },

  renderOrdersTable() {
    const tbody = document.getElementById('admin-orders-table-body');
    if (!tbody) return;

    let orders = window.StudioStore.getOrders();
    if (this.currentFilter !== 'all') {
      orders = orders.filter(o => o.status === this.currentFilter);
    }

    if (orders.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--app-gray); padding: 2rem;">No bookings found.</td></tr>';
      return;
    }

    tbody.innerHTML = orders.map(order => `
      <tr>
        <td>
          <strong>#${order.id}</strong><br>
          <span style="font-size: 0.72rem; color: var(--app-gray);">${new Date(order.createdAt).toLocaleDateString()}</span>
        </td>
        <td>
          <div style="font-weight: 600;">${order.userName}</div>
          <div style="font-size: 0.75rem; color: var(--app-gray);">${order.userPhone}</div>
        </td>
        <td>
          <div>${order.serviceName}</div>
          <div style="font-size: 0.75rem; color: var(--app-gold);">${order.packageName}</div>
        </td>
        <td>
          <div>${order.scheduledDate}</div>
          <div style="font-size: 0.75rem; color: var(--app-gray);">${order.scheduledTime}</div>
        </td>
        <td style="font-weight: 700; color: var(--app-gold);">
          ${window.StudioStore.formatNaira(order.totalPrice)}
        </td>
        <td>
          <select class="admin-action-select" data-order-id="${order.id}">
            <option value="booked" ${order.status === 'booked' ? 'selected' : ''}>1. Booked &amp; Scheduled</option>
            <option value="shooting" ${order.status === 'shooting' ? 'selected' : ''}>2. Studio Shooting</option>
            <option value="proofing" ${order.status === 'proofing' ? 'selected' : ''}>3. Client Proofing</option>
            <option value="retouching" ${order.status === 'retouching' ? 'selected' : ''}>4. In Retouching</option>
            <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>5. Delivered / Done</option>
          </select>
        </td>
        <td>
          <button class="btn-dark" style="padding: 0.4rem 0.8rem; font-size: 0.75rem;" data-action="view-invoice" data-order-id="${order.id}">
            Receipt
          </button>
        </td>
      </tr>
    `).join('');
  },

  bindEvents() {
    document.addEventListener('change', (e) => {
      if (e.target.matches('.admin-action-select')) {
        const orderId = e.target.getAttribute('data-order-id');
        const newStatus = e.target.value;
        const statusMap = {
          'booked': 'Confirmed & Scheduled',
          'shooting': 'Studio Shoot In Progress',
          'proofing': 'Client Proofing Ready',
          'retouching': 'In Master Retouching',
          'completed': 'Delivered & Complete'
        };

        window.StudioStore.updateOrderStatus(orderId, newStatus, statusMap[newStatus]);
        this.renderMetrics();
        this.renderOrdersTable();
        AppModule.showToast(`Order #${orderId} milestone updated to: ${statusMap[newStatus]}`);
      }
    });

    document.addEventListener('click', (e) => {
      const invoiceBtn = e.target.closest('[data-action="view-invoice"]');
      if (invoiceBtn) {
        const orderId = invoiceBtn.getAttribute('data-order-id');
        const order = window.StudioStore.getOrderById(orderId);
        if (order) {
          OrderingModule.showReceiptModal(order);
        }
      }
    });
  }
};
