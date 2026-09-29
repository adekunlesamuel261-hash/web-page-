/**
 * SMART STUDIO WEB APP - CLIENT REVIEWS & TESTIMONIALS MODULE
 */

const ReviewsModule = {
  activeCategory: 'all',
  currentRatingInput: 5,
  selectedTags: new Set(['Master Lighting', 'VIP Concierge']),

  init() {
    this.renderReviews();
    this.bindEvents();
    this.initRatingPicker();
  },

  renderReviews() {
    const reviewsContainer = document.getElementById('reviews-list-container');
    if (!reviewsContainer) return;

    const allReviews = window.StudioStore.getReviews();
    const currentUser = window.StudioStore.getCurrentUser();
    const isAdmin = currentUser && currentUser.role === 'admin';

    // Filter by active category
    let filteredReviews = allReviews;
    if (this.activeCategory !== 'all') {
      filteredReviews = allReviews.filter(r => 
        r.serviceCategory.toLowerCase().includes(this.activeCategory.toLowerCase())
      );
    }

    // Update aggregate stats
    const avgScore = allReviews.length > 0
      ? (allReviews.reduce((sum, r) => sum + (r.rating || 5), 0) / allReviews.length).toFixed(1)
      : '5.0';
    
    const countEl = document.getElementById('reviews-total-count');
    const avgEl = document.getElementById('reviews-avg-rating');
    const satisfactionEl = document.getElementById('reviews-satisfaction-rate');

    if (countEl) countEl.innerText = `${allReviews.length} Verified Reviews`;
    if (avgEl) avgEl.innerText = avgScore;
    if (satisfactionEl) satisfactionEl.innerText = '100% Five-Star Satisfaction';

    if (filteredReviews.length === 0) {
      reviewsContainer.innerHTML = `
        <div style="grid-column: 1/-1; padding: 4rem 2rem; text-align: center; background: var(--app-card); border: 1px solid var(--app-border); border-radius: 4px;">
          <div style="font-size: 2.5rem; margin-bottom: 0.8rem;">✍️</div>
          <h3 style="font-size: 1.2rem; color: var(--app-ivory); margin-bottom: 0.5rem;">No reviews in this category yet</h3>
          <p style="color: var(--app-gray); font-size: 0.88rem; max-width: 400px; margin: 0 auto 1.5rem;">
            Be the first client to review their experience in this photography category!
          </p>
          <button class="btn-gold" onclick="ReviewsModule.openReviewModal()" style="padding: 0.6rem 1.4rem;">
            + Write the First Review
          </button>
        </div>
      `;
      return;
    }

    // Render cards
    reviewsContainer.innerHTML = filteredReviews.map(review => {
      const starsHtml = '★'.repeat(review.rating) + '☆'.repeat(Math.max(0, 5 - review.rating));
      const tagsHtml = (review.tags || []).map(tag => `
        <span class="review-tag-badge">${tag}</span>
      `).join('');

      const adminReplyBox = isAdmin ? `
        <div class="review-reply-admin-box" style="margin-top: 1rem; padding-top: 1rem; border-top: 1px dashed rgba(212, 175, 55, 0.3);">
          <div style="font-size: 0.72rem; color: var(--app-gold); font-weight: 700; text-transform: uppercase; margin-bottom: 0.4rem;">
            Studio Manager Quick Reply
          </div>
          <div style="display: flex; gap: 0.6rem;">
            <input type="text" id="admin-reply-input-${review.id}" placeholder="Type studio response to client..." style="flex: 1; padding: 0.5rem 0.8rem; font-size: 0.8rem; background: var(--app-surface); border: 1px solid var(--app-border); color: #fff;">
            <button class="btn-gold" style="padding: 0.5rem 1rem; font-size: 0.72rem;" onclick="ReviewsModule.submitStudioReply('${review.id}')">
              Post Reply
            </button>
          </div>
        </div>
      ` : '';

      const studioReplyHtml = review.studioReply ? `
        <div class="review-studio-reply">
          <div class="studio-reply-header">
            <span class="reply-badge">Studio Concierge Abuja</span>
            <span class="reply-official-tag">Official Response</span>
          </div>
          <p class="studio-reply-text">“${review.studioReply}”</p>
        </div>
      ` : '';

      return `
        <article class="review-card" data-review-id="${review.id}">
          <div class="review-card-top">
            <div class="review-author-meta">
              <img src="${review.clientAvatar}" alt="${review.clientName}" class="review-avatar">
              <div>
                <div class="review-client-name">
                  ${review.clientName}
                  ${review.verified ? '<span class="review-verified-pill" title="Verified Studio Client">✓ Verified</span>' : ''}
                </div>
                <div class="review-client-role">${review.clientRole || 'Client'}</div>
              </div>
            </div>

            <div class="review-rating-block">
              <div class="review-stars-gold">${starsHtml}</div>
              <span class="review-date">${review.date}</span>
            </div>
          </div>

          <div class="review-package-pill">
            <span class="pill-category">${review.serviceCategory}</span>
            <span class="pill-divider">•</span>
            <span class="pill-pkg">${review.packageName}</span>
          </div>

          <h4 class="review-headline">“${review.reviewTitle}”</h4>
          <p class="review-body">${review.comment}</p>

          <div class="review-tags-wrapper">
            ${tagsHtml}
          </div>

          ${studioReplyHtml}
          ${adminReplyBox}
        </article>
      `;
    }).join('');
  },

  initRatingPicker() {
    const starContainer = document.getElementById('review-star-picker');
    if (!starContainer) return;

    const stars = starContainer.querySelectorAll('.star-picker-item');
    stars.forEach(star => {
      star.addEventListener('click', (e) => {
        const rating = parseInt(e.currentTarget.getAttribute('data-star'), 10);
        this.currentRatingInput = rating;
        this.updateStarPickerUI(rating);
      });

      star.addEventListener('mouseenter', (e) => {
        const rating = parseInt(e.currentTarget.getAttribute('data-star'), 10);
        this.updateStarPickerUI(rating);
      });
    });

    starContainer.addEventListener('mouseleave', () => {
      this.updateStarPickerUI(this.currentRatingInput);
    });

    // Tag chip clicks in modal
    document.querySelectorAll('.modal-tag-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const tag = chip.getAttribute('data-tag');
        if (this.selectedTags.has(tag)) {
          this.selectedTags.delete(tag);
          chip.classList.remove('selected');
        } else {
          this.selectedTags.add(tag);
          chip.classList.add('selected');
        }
      });
    });
  },

  updateStarPickerUI(score) {
    const stars = document.querySelectorAll('#review-star-picker .star-picker-item');
    stars.forEach(star => {
      const starVal = parseInt(star.getAttribute('data-star'), 10);
      star.classList.toggle('active', starVal <= score);
    });
    const label = document.getElementById('star-picker-score-label');
    if (label) {
      const labels = {
        5: '5.0 - Masterpiece & Flawless Experience',
        4: '4.0 - Exceptional Quality & Service',
        3: '3.0 - Good Session',
        2: '2.0 - Fair, Room for Improvement',
        1: '1.0 - Unsatisfactory'
      };
      label.innerText = labels[score] || `${score}.0 Stars`;
    }
  },

  bindEvents() {
    // Category tabs
    document.addEventListener('click', (e) => {
      const catBtn = e.target.closest('.review-cat-pill');
      if (catBtn) {
        document.querySelectorAll('.review-cat-pill').forEach(b => b.classList.remove('active'));
        catBtn.classList.add('active');
        this.activeCategory = catBtn.getAttribute('data-category');
        this.renderReviews();
      }
    });

    // Write review form submit
    const reviewForm = document.getElementById('studio-review-form');
    if (reviewForm) {
      reviewForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.submitReviewForm();
      });
    }
  },

  openReviewModal() {
    const modal = document.getElementById('leave-review-modal');
    if (!modal) return;

    const user = window.StudioStore.getCurrentUser();
    const nameInput = document.getElementById('review-form-name');
    const roleInput = document.getElementById('review-form-role');

    if (nameInput && user) nameInput.value = user.name;
    if (roleInput && user) {
      roleInput.value = user.role === 'admin' ? 'Studio Director' : 'VIP Studio Client';
    }

    this.currentRatingInput = 5;
    this.updateStarPickerUI(5);
    modal.classList.add('active');
  },

  submitReviewForm() {
    const nameInput = document.getElementById('review-form-name');
    const roleInput = document.getElementById('review-form-role');
    const categorySelect = document.getElementById('review-form-category');
    const packageInput = document.getElementById('review-form-package');
    const titleInput = document.getElementById('review-form-title');
    const commentInput = document.getElementById('review-form-comment');

    const currentUser = window.StudioStore.getCurrentUser();

    const reviewData = {
      clientName: nameInput?.value.trim() || currentUser?.name || 'VIP Client',
      clientAvatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      clientRole: roleInput?.value.trim() || 'VIP Studio Client',
      serviceCategory: categorySelect?.value || 'Portrait Photography',
      packageName: packageInput?.value.trim() || 'Signature Studio Session',
      rating: this.currentRatingInput,
      reviewTitle: titleInput?.value.trim() || 'Exemplary Experience',
      comment: commentInput?.value.trim() || '',
      tags: Array.from(this.selectedTags),
      verified: true
    };

    if (!reviewData.comment) {
      AppModule.showToast('Please enter your review feedback.');
      return;
    }

    window.StudioStore.addReview(reviewData);

    // Close modal & reset form
    const modal = document.getElementById('leave-review-modal');
    if (modal) modal.classList.remove('active');
    document.getElementById('studio-review-form')?.reset();

    // Re-render
    this.renderReviews();
    AppModule.showToast('Thank you! Your verified review has been published.');
  },

  submitStudioReply(reviewId) {
    const input = document.getElementById(`admin-reply-input-${reviewId}`);
    if (!input || !input.value.trim()) return;

    window.StudioStore.replyReview(reviewId, input.value.trim());
    this.renderReviews();
    AppModule.showToast('Studio Concierge response posted!');
  }
};

window.ReviewsModule = ReviewsModule;
