// Storage Manager - Handles all data persistence
const StorageManager = {
    // Initialize storage with default values
    init() {
        if (!localStorage.getItem('smc_settings')) {
            localStorage.setItem('smc_settings', JSON.stringify({
                instagramUsername: '',
                autoUploadThreshold: 1000,
                contentCategories: ['tech', 'lifestyle', 'business']
            }));
        }
        
        if (!localStorage.getItem('smc_trends')) {
            localStorage.setItem('smc_trends', JSON.stringify([]));
        }
        
        if (!localStorage.getItem('smc_content')) {
            localStorage.setItem('smc_content', JSON.stringify([]));
        }
        
        if (!localStorage.getItem('smc_approvals')) {
            localStorage.setItem('smc_approvals', JSON.stringify([]));
        }
        
        if (!localStorage.getItem('smc_analytics')) {
            localStorage.setItem('smc_analytics', JSON.stringify({
                totalPosts: 0,
                totalLikes: 0,
                totalFollowers: 12500,
                engagementRate: 4.5,
                postsHistory: []
            }));
        }
    },

    // Settings
    getSettings() {
        return JSON.parse(localStorage.getItem('smc_settings'));
    },

    saveSettings(settings) {
        localStorage.setItem('smc_settings', JSON.stringify(settings));
    },

    // Trends
    getTrends() {
        return JSON.parse(localStorage.getItem('smc_trends'));
    },

    saveTrends(trends) {
        localStorage.setItem('smc_trends', JSON.stringify(trends));
    },

    addTrend(trend) {
        const trends = this.getTrends();
        trends.unshift(trend);
        this.saveTrends(trends);
    },

    // Content
    getContent() {
        return JSON.parse(localStorage.getItem('smc_content'));
    },

    saveContent(content) {
        localStorage.setItem('smc_content', JSON.stringify(content));
    },

    addContent(contentItem) {
        const content = this.getContent();
        content.unshift(contentItem);
        this.saveContent(content);
    },

    updateContent(id, updates) {
        const content = this.getContent();
        const index = content.findIndex(item => item.id === id);
        if (index !== -1) {
            content[index] = { ...content[index], ...updates };
            this.saveContent(content);
        }
    },

    deleteContent(id) {
        const content = this.getContent();
        const filtered = content.filter(item => item.id !== id);
        this.saveContent(filtered);
    },

    // Approvals
    getApprovals() {
        return JSON.parse(localStorage.getItem('smc_approvals'));
    },

    saveApprovals(approvals) {
        localStorage.setItem('smc_approvals', JSON.stringify(approvals));
    },

    addApproval(approvalItem) {
        const approvals = this.getApprovals();
        approvals.unshift(approvalItem);
        this.saveApprovals(approvals);
    },

    updateApproval(id, status) {
        const approvals = this.getApprovals();
        const index = approvals.findIndex(item => item.id === id);
        if (index !== -1) {
            approvals[index].status = status;
            approvals[index].reviewedAt = new Date().toISOString();
            
            // If approved, move to analytics
            if (status === 'approved') {
                this.incrementAnalytics();
            }
            
            this.saveApprovals(approvals);
        }
    },

    // Analytics
    getAnalytics() {
        return JSON.parse(localStorage.getItem('smc_analytics'));
    },

    saveAnalytics(analytics) {
        localStorage.setItem('smc_analytics', JSON.stringify(analytics));
    },

    incrementAnalytics() {
        const analytics = this.getAnalytics();
        analytics.totalPosts++;
        analytics.totalLikes += Math.floor(Math.random() * 5000) + 500;
        analytics.totalFollowers += Math.floor(Math.random() * 100) + 10;
        analytics.engagementRate = ((analytics.totalLikes / analytics.totalFollowers) * 100).toFixed(2);
        analytics.postsHistory.push({
            date: new Date().toISOString(),
            likes: Math.floor(Math.random() * 5000) + 500
        });
        this.saveAnalytics(analytics);
    },

    // Utility
    generateId() {
        return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    // Clear all data
    clearAll() {
        localStorage.removeItem('smc_settings');
        localStorage.removeItem('smc_trends');
        localStorage.removeItem('smc_content');
        localStorage.removeItem('smc_approvals');
        localStorage.removeItem('smc_analytics');
        this.init();
    }
};

// Initialize storage on load
StorageManager.init();
