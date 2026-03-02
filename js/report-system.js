/**
 * Report Broken Video / Feedback System
 * Allows users to report issues with videos
 */

class ReportSystem {
    constructor(options = {}) {
        this.options = {
            apiEndpoint: (window.API_CONFIG && window.API_CONFIG.BASE_URL) || 'https://luganda-translated-movies-production.up.railway.app',
            movieId: null,
            movieTitle: '',
            ...options
        };
        
        this.init();
    }
    
    init() {
        this.createReportButton();
        this.createReportModal();
        this.addStyles();
    }
    
    createReportButton() {
        this.reportBtn = document.createElement('button');
        this.reportBtn.className = 'report-btn';
        this.reportBtn.innerHTML = `
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            <span>Report Issue</span>
        `;
        this.reportBtn.addEventListener('click', () => this.showModal());
        
        // Find a good place to add the button
        const playerControls = document.querySelector('.video-info') ||
                              document.querySelector('.movie-actions') ||
                              document.querySelector('.player-container');
        
        if (playerControls) {
            playerControls.appendChild(this.reportBtn);
        }
    }
    
    createReportModal() {
        this.modal = document.createElement('div');
        this.modal.className = 'report-modal hidden';
        this.modal.innerHTML = `
            <div class="report-modal-overlay"></div>
            <div class="report-modal-content">
                <button class="report-modal-close">&times;</button>
                <h2>🚨 Report an Issue</h2>
                <p class="report-subtitle">Help us improve by reporting problems with this video</p>
                
                <form id="reportForm">
                    <div class="report-issue-types">
                        <label class="report-type">
                            <input type="radio" name="issueType" value="video_not_playing" required>
                            <span class="report-type-box">
                                <span class="report-icon">📺</span>
                                <span class="report-label">Video Not Playing</span>
                            </span>
                        </label>
                        <label class="report-type">
                            <input type="radio" name="issueType" value="audio_issue">
                            <span class="report-type-box">
                                <span class="report-icon">🔇</span>
                                <span class="report-label">Audio Problem</span>
                            </span>
                        </label>
                        <label class="report-type">
                            <input type="radio" name="issueType" value="wrong_translation">
                            <span class="report-type-box">
                                <span class="report-icon">🗣️</span>
                                <span class="report-label">Wrong Translation</span>
                            </span>
                        </label>
                        <label class="report-type">
                            <input type="radio" name="issueType" value="buffering">
                            <span class="report-type-box">
                                <span class="report-icon">⏳</span>
                                <span class="report-label">Constant Buffering</span>
                            </span>
                        </label>
                        <label class="report-type">
                            <input type="radio" name="issueType" value="wrong_movie">
                            <span class="report-type-box">
                                <span class="report-icon">🎬</span>
                                <span class="report-label">Wrong Movie</span>
                            </span>
                        </label>
                        <label class="report-type">
                            <input type="radio" name="issueType" value="other">
                            <span class="report-type-box">
                                <span class="report-icon">❓</span>
                                <span class="report-label">Other Issue</span>
                            </span>
                        </label>
                    </div>
                    
                    <div class="report-field">
                        <label for="reportDetails">Additional Details (optional)</label>
                        <textarea id="reportDetails" name="details" placeholder="Please describe the issue in more detail..." rows="3"></textarea>
                    </div>
                    
                    <div class="report-field">
                        <label for="reportEmail">Your Email (optional - for follow-up)</label>
                        <input type="email" id="reportEmail" name="email" placeholder="your@email.com">
                    </div>
                    
                    <button type="submit" class="report-submit-btn">
                        <span class="btn-text">Submit Report</span>
                        <span class="btn-loading hidden">⏳ Sending...</span>
                    </button>
                </form>
                
                <div class="report-success hidden">
                    <div class="success-icon">✅</div>
                    <h3>Thank You!</h3>
                    <p>Your report has been submitted. We'll look into it soon.</p>
                    <button class="report-close-btn">Close</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.modal);
        
        // Event listeners
        this.modal.querySelector('.report-modal-overlay').addEventListener('click', () => this.hideModal());
        this.modal.querySelector('.report-modal-close').addEventListener('click', () => this.hideModal());
        this.modal.querySelector('.report-close-btn').addEventListener('click', () => this.hideModal());
        this.modal.querySelector('#reportForm').addEventListener('submit', (e) => this.submitReport(e));
    }
    
    showModal() {
        this.modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        
        // Reset form
        this.modal.querySelector('#reportForm').reset();
        this.modal.querySelector('#reportForm').classList.remove('hidden');
        this.modal.querySelector('.report-success').classList.add('hidden');
        
        // Track
        if (typeof gtag === 'function') {
            gtag('event', 'report_modal_open', {
                'movie_id': this.options.movieId
            });
        }
    }
    
    hideModal() {
        this.modal.classList.add('hidden');
        document.body.style.overflow = '';
    }
    
    async submitReport(e) {
        e.preventDefault();
        
        const form = e.target;
        const submitBtn = form.querySelector('.report-submit-btn');
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoading = submitBtn.querySelector('.btn-loading');
        
        // Get form data
        const formData = new FormData(form);
        const reportData = {
            movieId: this.options.movieId || new URLSearchParams(window.location.search).get('id'),
            movieTitle: this.options.movieTitle || document.querySelector('h1')?.textContent || 'Unknown',
            issueType: formData.get('issueType'),
            details: formData.get('details'),
            email: formData.get('email'),
            url: window.location.href,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
        };
        
        // Show loading
        btnText.classList.add('hidden');
        btnLoading.classList.remove('hidden');
        submitBtn.disabled = true;
        
        try {
            // Try to send to API
            const response = await fetch(`${this.options.apiEndpoint}/api/requests`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    type: 'report',
                    title: `Issue Report: ${reportData.issueType}`,
                    description: `Movie: ${reportData.movieTitle}\nIssue: ${reportData.issueType}\nDetails: ${reportData.details || 'No details provided'}\nURL: ${reportData.url}`,
                    email: reportData.email,
                    metadata: reportData
                })
            });
            
            if (!response.ok) throw new Error('API error');
            
        } catch (error) {
            // Fallback - save to localStorage for later
            const reports = JSON.parse(localStorage.getItem('pendingReports') || '[]');
            reports.push(reportData);
            localStorage.setItem('pendingReports', JSON.stringify(reports));
        }
        
        // Show success
        form.classList.add('hidden');
        this.modal.querySelector('.report-success').classList.remove('hidden');
        
        // Track
        if (typeof gtag === 'function') {
            gtag('event', 'report_submitted', {
                'movie_id': reportData.movieId,
                'issue_type': reportData.issueType
            });
        }
        
        // Reset button
        btnText.classList.remove('hidden');
        btnLoading.classList.add('hidden');
        submitBtn.disabled = false;
    }
    
    addStyles() {
        if (document.getElementById('report-system-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'report-system-styles';
        style.textContent = `
            .report-btn {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                padding: 8px 16px;
                background: rgba(255, 107, 107, 0.1);
                border: 1px solid rgba(255, 107, 107, 0.3);
                color: #ff6b6b;
                border-radius: 8px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                transition: all 0.2s;
                margin: 10px 0;
            }
            .report-btn:hover {
                background: rgba(255, 107, 107, 0.2);
                transform: translateY(-2px);
            }
            .report-modal {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
            }
            .report-modal.hidden {
                display: none;
            }
            .report-modal-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.8);
            }
            .report-modal-content {
                position: relative;
                background: #1a1a2e;
                border-radius: 16px;
                padding: 30px;
                max-width: 500px;
                width: 100%;
                max-height: 90vh;
                overflow-y: auto;
                animation: modalSlide 0.3s ease;
            }
            @keyframes modalSlide {
                from {
                    opacity: 0;
                    transform: translateY(-20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            .report-modal-close {
                position: absolute;
                top: 15px;
                right: 15px;
                background: none;
                border: none;
                color: #888;
                font-size: 28px;
                cursor: pointer;
                transition: color 0.2s;
            }
            .report-modal-close:hover {
                color: #fff;
            }
            .report-modal h2 {
                color: #fff;
                margin-bottom: 5px;
            }
            .report-subtitle {
                color: #888;
                margin-bottom: 20px;
            }
            .report-issue-types {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 10px;
                margin-bottom: 20px;
            }
            .report-type {
                cursor: pointer;
            }
            .report-type input {
                display: none;
            }
            .report-type-box {
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: 15px 10px;
                background: rgba(255, 255, 255, 0.05);
                border: 2px solid transparent;
                border-radius: 10px;
                transition: all 0.2s;
            }
            .report-type-box:hover {
                background: rgba(255, 255, 255, 0.1);
            }
            .report-type input:checked + .report-type-box {
                border-color: #66BB6A;
                background: rgba(102, 187, 106, 0.1);
            }
            .report-icon {
                font-size: 24px;
                margin-bottom: 5px;
            }
            .report-label {
                color: #ccc;
                font-size: 12px;
                text-align: center;
            }
            .report-field {
                margin-bottom: 15px;
            }
            .report-field label {
                display: block;
                color: #888;
                font-size: 13px;
                margin-bottom: 5px;
            }
            .report-field textarea,
            .report-field input {
                width: 100%;
                padding: 12px;
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 8px;
                color: #fff;
                font-size: 14px;
                resize: vertical;
            }
            .report-field textarea:focus,
            .report-field input:focus {
                outline: none;
                border-color: #66BB6A;
            }
            .report-submit-btn {
                width: 100%;
                padding: 14px;
                background: linear-gradient(135deg, #66BB6A, #4CAF50);
                border: none;
                border-radius: 10px;
                color: #fff;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: transform 0.2s, box-shadow 0.2s;
            }
            .report-submit-btn:hover:not(:disabled) {
                transform: translateY(-2px);
                box-shadow: 0 5px 20px rgba(102, 187, 106, 0.4);
            }
            .report-submit-btn:disabled {
                opacity: 0.7;
                cursor: not-allowed;
            }
            .report-success {
                text-align: center;
                padding: 20px 0;
            }
            .success-icon {
                font-size: 48px;
                margin-bottom: 15px;
            }
            .report-success h3 {
                color: #66BB6A;
                margin-bottom: 10px;
            }
            .report-success p {
                color: #888;
                margin-bottom: 20px;
            }
            .report-close-btn {
                padding: 12px 30px;
                background: rgba(255, 255, 255, 0.1);
                border: none;
                border-radius: 8px;
                color: #fff;
                font-size: 14px;
                cursor: pointer;
                transition: background 0.2s;
            }
            .report-close-btn:hover {
                background: rgba(255, 255, 255, 0.2);
            }
            .hidden {
                display: none !important;
            }
            
            @media (max-width: 480px) {
                .report-issue-types {
                    grid-template-columns: repeat(2, 1fr);
                }
                .report-modal-content {
                    padding: 20px;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// Auto-initialize on player pages
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('player')) {
        setTimeout(() => {
            window.reportSystem = new ReportSystem();
        }, 2000);
    }
});

// Export
window.ReportSystem = ReportSystem;
