// Approval Department - CEO Review and Instagram Upload Simulation
const ApprovalDepartment = {
    currentReviewItem: null,

    // Add content to approval queue
    addToQueue(contentItem) {
        const approvalItem = {
            id: StorageManager.generateId(),
            contentId: contentItem.id,
            title: contentItem.title,
            description: contentItem.description,
            type: contentItem.type,
            thumbnail: contentItem.thumbnail || '🎬 Video Preview',
            script: contentItem.script || contentItem.slides || [],
            hashtags: contentItem.hashtags || [],
            estimatedReach: contentItem.estimatedReach,
            createdAt: new Date().toISOString(),
            status: 'pending',
            reviewedAt: null
        };

        StorageManager.addApproval(approvalItem);
        this.renderApprovalQueue();
        
        // Show notification
        this.showNotification(`New ${contentItem.type} ready for review!`);
    },

    // Show preview modal
    showPreview(approvalItem) {
        this.currentReviewItem = approvalItem;
        
        const modal = document.getElementById('videoModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalVideo = document.getElementById('modalVideo');
        const modalDescription = document.getElementById('modalDescription');

        if (!modal || !modalTitle || !modalVideo || !modalDescription) return;

        modalTitle.textContent = `${approvalItem.type === 'video' ? '🎬' : '📱'} ${approvalItem.title}`;
        
        // Create video preview content
        if (approvalItem.type === 'video') {
            modalVideo.innerHTML = `
                <div style="text-align: center;">
                    <div style="font-size: 64px; margin-bottom: 20px;">🎬</div>
                    <h3 style="color: white; margin-bottom: 15px;">${approvalItem.title}</h3>
                    <p style="color: #aaa; margin-bottom: 20px;">Duration: ${approvalItem.script?.length || 5} scenes</p>
                    <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px;">
                        <h4 style="color: white; margin-bottom: 10px;">📝 Script Preview:</h4>
                        ${Array.isArray(approvalItem.script) ? approvalItem.script.map(line => 
                            `<p style="color: #ddd; margin: 5px 0; font-size: 14px;">${line}</p>`
                        ).join('') : '<p style="color: #aaa;">Story slides available</p>'}
                    </div>
                </div>
            `;
        } else {
            modalVideo.innerHTML = `
                <div style="text-align: center;">
                    <div style="font-size: 64px; margin-bottom: 20px;">📱</div>
                    <h3 style="color: white; margin-bottom: 15px;">${approvalItem.title}</h3>
                    <p style="color: #aaa; margin-bottom: 20px;">${approvalItem.script?.length || 5} slides</p>
                    <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px; max-height: 300px; overflow-y: auto;">
                        ${Array.isArray(approvalItem.script) ? approvalItem.script.map(slide => 
                            `<div style="background: rgba(255,255,255,0.1); padding: 10px; margin: 10px 0; border-radius: 5px;">
                                <p style="color: #ddd; font-size: 14px;">Slide ${slide.slide}: ${slide.content}</p>
                            </div>`
                        ).join('') : '<p style="color: #aaa;">Content preview</p>'}
                    </div>
                </div>
            `;
        }

        modalDescription.innerHTML = `
            <p><strong>Description:</strong> ${approvalItem.description}</p>
            <p><strong>Estimated Reach:</strong> ${(approvalItem.estimatedReach / 1000).toFixed(1)}K users</p>
            <p><strong>Hashtags:</strong> ${approvalItem.hashtags.slice(0, 5).join(' ')}${approvalItem.hashtags.length > 5 ? '...' : ''}</p>
        `;

        modal.style.display = 'block';
    },

    // Approve and upload to Instagram
    approveAndUpload() {
        if (!this.currentReviewItem) return;

        const btn = document.getElementById('approveVideo');
        const originalText = btn.textContent;
        btn.textContent = '⏳ Uploading to Instagram...';
        btn.disabled = true;

        // Simulate Instagram API upload
        setTimeout(() => {
            const settings = StorageManager.getSettings();
            
            // Update approval status
            StorageManager.updateApproval(this.currentReviewItem.id, 'approved');
            
            // Update content status
            StorageManager.updateContent(this.currentReviewItem.contentId, { 
                status: 'uploaded',
                uploadedAt: new Date().toISOString(),
                instagramPostId: 'IG_' + Date.now()
            });

            // Show success message
            this.showNotification(
                `✅ Successfully uploaded to @${settings.instagramUsername || 'your_instagram'}!`,
                'success'
            );

            // Close modal
            this.closeModal();
            
            // Refresh queues
            this.renderApprovalQueue();
            ContentDepartment.renderContentQueue();
            AnalyticsDepartment.updateStats();

            btn.textContent = originalText;
            btn.disabled = false;
        }, 2000);
    },

    // Reject content
    rejectContent() {
        if (!this.currentReviewItem) return;

        if (confirm('Are you sure you want to reject this content? It will be deleted from the queue.')) {
            StorageManager.updateApproval(this.currentReviewItem.id, 'rejected');
            StorageManager.updateContent(this.currentReviewItem.contentId, { status: 'rejected' });
            
            this.showNotification('❌ Content rejected', 'error');
            this.closeModal();
            this.renderApprovalQueue();
            ContentDepartment.renderContentQueue();
        }
    },

    // Request changes
    requestChanges() {
        if (!this.currentReviewItem) return;

        const reason = prompt('Please specify what changes you\'d like the team to make:');
        
        if (reason) {
            StorageManager.updateApproval(this.currentReviewItem.id, 'changes_requested');
            StorageManager.updateContent(this.currentReviewItem.contentId, { 
                status: 'revision_needed',
                revisionNotes: reason
            });
            
            this.showNotification(`📝 Changes requested: ${reason.substring(0, 50)}...`);
            this.closeModal();
            this.renderApprovalQueue();
            ContentDepartment.renderContentQueue();
        }
    },

    // Render approval queue
    renderApprovalQueue() {
        const container = document.getElementById('approvalQueue');
        if (!container) return;

        const approvals = StorageManager.getApprovals();
        const pendingApprovals = approvals.filter(a => a.status === 'pending');

        if (pendingApprovals.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 60px 20px; color: #666;">
                    <div style="font-size: 64px; margin-bottom: 20px;">🎉</div>
                    <h3>All Caught Up!</h3>
                    <p>No pending content for review. Your team is still working on new content.</p>
                    <p style="margin-top: 10px; font-size: 14px;">Or try creating new content from the Research or Content tabs.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = pendingApprovals.map(item => `
            <div class="approval-item">
                <div class="content-info">
                    <h4>${item.type === 'video' ? '🎬' : '📱'} ${item.title}</h4>
                    <p>${item.description}</p>
                    <p style="font-size: 12px; color: #888; margin-top: 5px;">
                        Est. Reach: ${(item.estimatedReach / 1000).toFixed(1)}K | 
                        Created: ${new Date(item.createdAt).toLocaleString()}
                    </p>
                </div>
                <button class="btn-primary" onclick="ApprovalDepartment.showPreview(ApprovalDepartment.getApprovalById('${item.id}'))">
                    👁️ Review
                </button>
            </div>
        `).join('');
    },

    // Get approval by ID
    getApprovalById(id) {
        const approvals = StorageManager.getApprovals();
        return approvals.find(a => a.id === id);
    },

    // Close modal
    closeModal() {
        const modal = document.getElementById('videoModal');
        if (modal) {
            modal.style.display = 'none';
        }
        this.currentReviewItem = null;
    },

    // Show notification
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#667eea'};
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.3);
            z-index: 10000;
            animation: slideIn 0.3s ease;
            font-weight: 600;
        `;
        notification.textContent = message;

        // Add animation style if not exists
        if (!document.getElementById('notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(400px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(400px); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(notification);

        // Remove after 4 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }
};

// Setup modal event listeners
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('videoModal');
    const closeBtn = document.querySelector('.close');

    if (closeBtn && modal) {
        closeBtn.addEventListener('click', () => ApprovalDepartment.closeModal());
        
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                ApprovalDepartment.closeModal();
            }
        });
    }

    // Setup approval button
    const approveBtn = document.getElementById('approveVideo');
    if (approveBtn) {
        approveBtn.addEventListener('click', () => ApprovalDepartment.approveAndUpload());
    }

    const rejectBtn = document.getElementById('rejectVideo');
    if (rejectBtn) {
        rejectBtn.addEventListener('click', () => ApprovalDepartment.rejectContent());
    }

    const changesBtn = document.getElementById('requestChanges');
    if (changesBtn) {
        changesBtn.addEventListener('click', () => ApprovalDepartment.requestChanges());
    }
});
