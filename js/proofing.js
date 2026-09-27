/**
 * SMART STUDIO WEB APP - DIGITAL PHOTO PROOFING & SELECTIONS MODULE
 */

const ProofingModule = {
  currentGalleryId: 'gal-8724',
  activeFilter: 'all', // 'all', 'favorites', 'notes'
  activePhotoForComment: null,

  init() {
    this.renderGallery();
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
  }
};
