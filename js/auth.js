/**
 * SMART STUDIO WEB APP - AUTHENTICATION MODULE
 */

const AuthModule = {
  init() {
    this.bindEvents();
  },

  bindEvents() {
    // Tab switching between Login and Register
    document.addEventListener('click', (e) => {
      if (e.target.matches('.auth-tab-btn')) {
        const targetTab = e.target.getAttribute('data-tab');
        document.querySelectorAll('.auth-tab-btn').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');

        if (targetTab === 'login') {
          document.getElementById('login-form-panel').style.display = 'block';
          document.getElementById('register-form-panel').style.display = 'none';
        } else {
          document.getElementById('login-form-panel').style.display = 'none';
          document.getElementById('register-form-panel').style.display = 'block';
        }
      }
    });

    // Handle Login Form
    const loginForm = document.getElementById('app-login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const pass = document.getElementById('login-password').value;

        const res = window.StudioStore.login(email, pass);
        if (res.success) {
          AppModule.showToast(`Welcome back, ${res.user.name}`);
          AppModule.refreshUserState();
          AppModule.navigate('dashboard');
        } else {
          AppModule.showToast(res.message, 'error');
        }
      });
    }

    // Handle Register Form
    const registerForm = document.getElementById('app-register-form');
    if (registerForm) {
      registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('reg-name').value;
        const email = document.getElementById('reg-email').value;
        const phone = document.getElementById('reg-phone').value;
        const password = document.getElementById('reg-password').value;

        const res = window.StudioStore.register({ name, email, phone, password });
        if (res.success) {
          AppModule.showToast(`Account created! Welcome, ${res.user.name}`);
          AppModule.refreshUserState();
          AppModule.navigate('dashboard');
        } else {
          AppModule.showToast(res.message, 'error');
        }
      });
    }

    // Handle 1-Click Demo Buttons
    document.addEventListener('click', (e) => {
      if (e.target.id === 'demo-client-btn' || e.target.closest('#demo-client-btn')) {
        const res = window.StudioStore.login('client@smartstudio.ng', 'password123');
        if (res.success) {
          AppModule.showToast('Logged in as Client: Samuel Adekunle');
          AppModule.refreshUserState();
          AppModule.navigate('dashboard');
        }
      }

      if (e.target.id === 'demo-admin-btn' || e.target.closest('#demo-admin-btn')) {
        const res = window.StudioStore.login('admin@smartstudio.ng', 'admin123');
        if (res.success) {
          AppModule.showToast('Logged in as Studio Director (Admin Mode)');
          AppModule.refreshUserState();
          AppModule.navigate('admin');
        }
      }

      // Logout buttons
      if (e.target.matches('.btn-logout') || e.target.closest('.btn-logout')) {
        window.StudioStore.logout();
        AppModule.showToast('You have been logged out.');
        AppModule.refreshUserState();
        AppModule.navigate('auth');
      }
    });
  }
};
