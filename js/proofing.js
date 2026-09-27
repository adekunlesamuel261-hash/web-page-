/**
 * SMART STUDIO WEB APP - DIGITAL PHOTO PROOFING & SELECTIONS MODULE
 */

const ProofingModule = {
  currentGalleryId: 'gal-8724',
  activeFilter: 'all', // 'all', 'favorites', 'notes'
  activePhotoForComment: null,

  init() {
    this.renderGallery();
    this.initBeforeAfterSlider();
    this.bindEvents();
  },

  renderGallery() {
    const gallery = window.StudioStore.getProofById(this.currentGalleryId);
    if (!gallery) return;

    // Header info
    const titleEl = document.getElementById('proofing-shoot-title');
    const dateEl = document.getElementById('proofing-shoot-date');
    const statusEl = document.getElementById('proofing-status-badge');
    const selectedCountEl = document.getElementById('proofing-selected-count');
    const quotaEl = document.getElementById('proofing-quota-total');

    if (titleEl) titleEl.innerHTML = gallery.title;
    if (dateEl) dateEl.innerText = gallery.shootDate;
    if (statusEl) statusEl.innerText = gallery.status;
    if (quotaEl) quotaEl.innerText = gallery.quota;

    const favorites = gallery.photos.filter(p => p.isFavorite);
    if (selectedCountEl) selectedCountEl.innerText = favorites.length;

    // Filter photos
    let filteredPhotos = gallery.photos;
    if (this.activeFilter === 'favorites') {
      filteredPhotos = gallery.photos.filter(p => p.isFavorite);
    } else if (this.activeFilter === 'notes') {
      filteredPhotos = gallery.photos.filter(p => p.clientComment && p.clientComment.trim().length > 0);
    }

    const grid = document.getElementById('proofing-photos-grid');
    if (!grid) return;

    if (filteredPhotos.length === 0) {
      grid.innerHTML = '<div style="grid-column: 1/-1; padding: 3rem; text-align: center; color: var(--app-gray);">No photos match the selected filter.</div>';
      return;
    }

    grid.innerHTML = filteredPhotos.map(photo => `
      <div class="proof-card ${photo.isFavorite ? 'favorited' : ''}" data-photo-id="${photo.id}">
        <div class="proof-thumb-wrapper" data-photo-url="${photo.url}" data-photo-title="${photo.title}">
          <img src="${photo.url}" alt="${photo.title}" loading="lazy">
          <button class="proof-favorite-toggle ${photo.isFavorite ? 'active' : ''}" data-action="toggle-fav" title="${photo.isFavorite ? 'Remove Favorite' : 'Mark as Favorite'}">
            ★
          </button>
        </div>
        <div class="proof-details-bar">
          <div>
            <div class="proof-title">${photo.title}</div>
            ${photo.clientComment ? `<div style="font-size: 0.75rem; color: #D1CEC7; margin-top: 3px; font-style: italic;">“${photo.clientComment}”</div>` : ''}
          </div>
          <button class="proof-comment-badge" data-action="open-comment" data-photo-id="${photo.id}">
            💬 ${photo.clientComment ? 'Edit Note' : 'Add Note'}
          </button>
        </div>
      </div>
    `).join('');
  },

  bindEvents() {
    // Filter tabs
    document.addEventListener('click', (e) => {
      if (e.target.matches('.proofing-filter-btn')) {
        document.querySelectorAll('.proofing-filter-btn').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        this.activeFilter = e.target.getAttribute('data-filter');
        this.renderGallery();
      }

      // Toggle Favorite
      const favBtn = e.target.closest('[data-action="toggle-fav"]');
      if (favBtn) {
        e.stopPropagation();
        const card = favBtn.closest('.proof-card');
        const photoId = card.getAttribute('data-photo-id');
        const res = window.StudioStore.toggleProofFavorite(this.currentGalleryId, photoId);
        if (res.success) {
          this.renderGallery();
          AppModule.showToast(res.isFavorite ? 'Added to favorites!' : 'Removed from favorites.');
        }
      }

      // Open Photo Note / Comment Modal
      const commentBtn = e.target.closest('[data-action="open-comment"]');
      if (commentBtn) {
        e.stopPropagation();
        const photoId = commentBtn.getAttribute('data-photo-id');
        this.openCommentModal(photoId);
      }

      // Thumbnail Click -> Open Lightbox
      const thumbWrapper = e.target.closest('.proof-thumb-wrapper');
      if (thumbWrapper && !e.target.closest('.proof-favorite-toggle')) {
        const url = thumbWrapper.getAttribute('data-photo-url');
        const title = thumbWrapper.getAttribute('data-photo-title');
        this.openLightbox(url, title);
      }
    });

    // Save Comment Form
    const commentForm = document.getElementById('photo-comment-form');
    if (commentForm) {
      commentForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const commentText = document.getElementById('photo-comment-text').value;
        if (this.activePhotoForComment) {
          window.StudioStore.addProofComment(this.currentGalleryId, this.activePhotoForComment, commentText);
          this.renderGallery();
          this.closeCommentModal();
          AppModule.showToast('Retouching note saved for studio team.');
        }
      });
    }

    // Submit Selections for Retouching
    const submitSelectionsBtn = document.getElementById('submit-proof-selections-btn');
    if (submitSelectionsBtn) {
      submitSelectionsBtn.addEventListener('click', () => {
        const gallery = window.StudioStore.getProofById(this.currentGalleryId);
        const favCount = gallery.photos.filter(p => p.isFavorite).length;

        if (favCount === 0) {
          AppModule.showToast('Please star at least 1 favorite photo before submitting.', 'error');
          return;
        }

        window.StudioStore.submitProofSelections(this.currentGalleryId);
        this.renderGallery();
        AppModule.showToast(`Success! ${favCount} favorite frames submitted to the studio retouching team.`);
      });
    }
  },

  openCommentModal(photoId) {
    this.activePhotoForComment = photoId;
    const gallery = window.StudioStore.getProofById(this.currentGalleryId);
    const photo = gallery.photos.find(p => p.id === photoId);

    const modal = document.getElementById('proof-comment-modal');
    if (modal && photo) {
      document.getElementById('comment-photo-title').innerText = photo.title;
      document.getElementById('photo-comment-text').value = photo.clientComment || '';
      modal.classList.add('active');
    }
  },

  closeCommentModal() {
    const modal = document.getElementById('proof-comment-modal');
    if (modal) modal.classList.remove('active');
    this.activePhotoForComment = null;
  },

  openLightbox(url, title) {
    const modal = document.getElementById('proof-lightbox-modal');
    if (modal) {
      document.getElementById('lightbox-full-img').src = url;
      document.getElementById('lightbox-photo-caption').innerText = title;
      modal.classList.add('active');
    }
  },

  initBeforeAfterSlider() {
    const slider = document.getElementById('ba-slider');
    const afterWrapper = document.getElementById('ba-after-wrapper');
    const afterImg = document.getElementById('ba-after-img');
    const beforeImg = document.getElementById('ba-before-img');
    const divider = document.getElementById('ba-divider');

    if (!slider || !afterWrapper || !afterImg || !divider) return;

    let isDragging = false;

    const syncImgWidth = () => {
      const rect = slider.getBoundingClientRect();
      if (rect.width > 0) {
        afterImg.style.width = rect.width + 'px';
        afterImg.style.maxWidth = 'none';
      }
    };

    const updateSlider = (clientX) => {
      const rect = slider.getBoundingClientRect();
      let pos = ((clientX - rect.left) / rect.width) * 100;
      pos = Math.max(2, Math.min(98, pos));
      afterWrapper.style.width = pos + '%';
      divider.style.left = pos + '%';
      syncImgWidth();
    };

    // Initial sync
    syncImgWidth();
    window.addEventListener('resize', syncImgWidth);

    slider.addEventListener('mousedown', (e) => {
      isDragging = true;
      updateSlider(e.clientX);
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      updateSlider(e.clientX);
    });

    window.addEventListener('mouseup', () => {
      isDragging = false;
    });

    // Touch support for mobile devices
    slider.addEventListener('touchstart', (e) => {
      isDragging = true;
      if (e.touches.length > 0) {
        updateSlider(e.touches[0].clientX);
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (!isDragging || e.touches.length === 0) return;
      updateSlider(e.touches[0].clientX);
    }, { passive: true });

    window.addEventListener('touchend', () => {
      isDragging = false;
    });

    // Preset Pills
    const presetPresets = {
      portrait: {
        url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1400&q=80',
        beforeFilter: 'saturate(0.68) contrast(0.85) brightness(0.92)',
        afterFilter: 'saturate(1.2) contrast(1.12) brightness(1.04)'
      },
      cinematic: {
        url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1400&q=80',
        beforeFilter: 'saturate(0.7) contrast(0.9) brightness(0.9)',
        afterFilter: 'saturate(1.25) contrast(1.18) hue-rotate(-5deg) brightness(1.05)'
      },
      editorial: {
        url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=1400&q=80',
        beforeFilter: 'saturate(0.65) contrast(0.85) brightness(0.92)',
        afterFilter: 'saturate(1.25) contrast(1.15) brightness(1.06)'
      }
    };

    document.querySelectorAll('.retouch-preset-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.retouch-preset-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const presetKey = btn.getAttribute('data-preset');
        const config = presetPresets[presetKey] || presetPresets.portrait;

        beforeImg.src = config.url;
        afterImg.src = config.url;
        beforeImg.style.filter = config.beforeFilter;
        afterImg.style.filter = config.afterFilter;

        // Reset divider to middle
        afterWrapper.style.width = '50%';
        divider.style.left = '50%';
        syncImgWidth();
      });
    });
  }
};

