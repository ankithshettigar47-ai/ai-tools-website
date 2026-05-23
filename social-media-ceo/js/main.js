// Main Application Controller
document.addEventListener('DOMContentLoaded', () => {
    // Initialize all departments
    initializeTabs();
    initializeYouTubeToggle();
    initializeButtons();
    initializeSettings();
    
    // Load initial data
    loadInitialData();
});

// Tab Navigation
function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');

            // Remove active class from all buttons and contents
            tabButtons.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            // Add active class to selected
            btn.classList.add('active');
            document.getElementById(targetTab).classList.add('active');

            // Refresh content when switching tabs
            refreshTabContent(targetTab);
        });
    });
}

// Initialize YouTube Toggle
function initializeYouTubeToggle() {
    const useYouTubeCheckbox = document.getElementById('useYouTubeSource');
    const youtubeInput = document.getElementById('youtubeInput');
    
    if (useYouTubeCheckbox && youtubeInput) {
        useYouTubeCheckbox.addEventListener('change', (e) => {
            youtubeInput.style.display = e.target.checked ? 'block' : 'none';
        });
    }
}

// Initialize Action Buttons
function initializeButtons() {
    // Research Department Buttons
    const scanTrendsBtn = document.getElementById('scanTrends');
    if (scanTrendsBtn) {
        scanTrendsBtn.addEventListener('click', async () => {
            setLoading(scanTrendsBtn, true);
            try {
                const trends = await ResearchDepartment.scanTrends();
                ResearchDepartment.renderTrends(trends);
                ApprovalDepartment.showNotification('✅ Trends scanned successfully!', 'success');
            } catch (error) {
                ApprovalDepartment.showNotification('❌ Error scanning trends', 'error');
            }
            setLoading(scanTrendsBtn, false);
        });
    }

    const analyzeCompetitorsBtn = document.getElementById('analyzeCompetitors');
    if (analyzeCompetitorsBtn) {
        analyzeCompetitorsBtn.addEventListener('click', async () => {
            setLoading(analyzeCompetitorsBtn, true);
            try {
                const analysis = await ResearchDepartment.analyzeCompetitors();
                ResearchDepartment.renderCompetitorAnalysis(analysis);
                ApprovalDepartment.showNotification('✅ Competitor analysis complete!', 'success');
            } catch (error) {
                ApprovalDepartment.showNotification('❌ Error analyzing competitors', 'error');
            }
            setLoading(analyzeCompetitorsBtn, false);
        });
    }

    // Content Department Buttons
    const generateVideoBtn = document.getElementById('generateVideo');
    if (generateVideoBtn) {
        generateVideoBtn.addEventListener('click', async () => {
            setLoading(generateVideoBtn, true);
            
            // Get AI options from UI
            const useYouTube = document.getElementById('useYouTubeSource').checked;
            const youtubeUrl = document.getElementById('youtubeUrl').value.trim();
            const videoTopic = document.getElementById('videoTopic').value.trim();
            
            // Validate YouTube option
            if (useYouTube && !youtubeUrl) {
                alert('Please enter a YouTube URL');
                setLoading(generateVideoBtn, false);
                return;
            }
            
            try {
                const videoOptions = {
                    title: videoTopic || 'Trending Topic Video',
                    description: useYouTube ? 
                        'AI-processed YouTube clip (9:16 cropped with AI audio)' : 
                        'Auto-generated viral content based on latest trends',
                    useYouTube: useYouTube,
                    youtubeUrl: useYouTube ? youtubeUrl : null
                };
                
                // Call the async createVideo method
                await ContentDepartment.createVideo(videoOptions);
                
                ContentDepartment.renderContentQueue();
                ApprovalDepartment.renderApprovalQueue();
                
                const modeText = useYouTube ? 'YouTube Short' : 'AI Video';
                ApprovalDepartment.showNotification(`🎬 ${modeText} created and sent for approval!`, 'success');
            } catch (error) {
                console.error('Video creation error:', error);
                ApprovalDepartment.showNotification('❌ Error creating video: ' + error.message, 'error');
            }
            
            setLoading(generateVideoBtn, false);
        });
    }

    const generateStoryBtn = document.getElementById('generateStory');
    if (generateStoryBtn) {
        generateStoryBtn.addEventListener('click', () => {
            setLoading(generateStoryBtn, true);
            setTimeout(() => {
                ContentDepartment.createStory({
                    title: 'Quick Story',
                    description: 'Engaging story content'
                });
                ContentDepartment.renderContentQueue();
                ApprovalDepartment.renderApprovalQueue();
                setLoading(generateStoryBtn, false);
                ApprovalDepartment.showNotification('📱 Story created and sent for approval!', 'success');
            }, 1000);
        });
    }

    const autoCreateBtn = document.getElementById('autoCreate');
    if (autoCreateBtn) {
        autoCreateBtn.addEventListener('click', async () => {
            setLoading(autoCreateBtn, true);
            ApprovalDepartment.showNotification('⏳ Creating full campaign...', 'info');
            
            try {
                const campaign = await ContentDepartment.autoCreateCampaign();
                ContentDepartment.renderContentQueue();
                ApprovalDepartment.renderApprovalQueue();
                ApprovalDepartment.showNotification(`✅ Campaign created with ${campaign.contents.length} pieces of content!`, 'success');
            } catch (error) {
                ApprovalDepartment.showNotification('❌ Error creating campaign', 'error');
            }
            setLoading(autoCreateBtn, false);
        });
    }

    // Logout Button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to logout? All unsaved changes will be lost.')) {
                alert('Logout successful! (This is a demo - no actual authentication)');
            }
        });
    }
}

// Initialize Settings
function initializeSettings() {
    const saveSettingsBtn = document.getElementById('saveSettings');
    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', () => {
            const instagramUsername = document.getElementById('instagramUsername').value;
            const autoUploadThreshold = document.getElementById('autoUploadThreshold').value;
            const contentCategoriesSelect = document.getElementById('contentCategories');
            const contentCategories = Array.from(contentCategoriesSelect.selectedOptions).map(opt => opt.value);

            const settings = {
                instagramUsername: instagramUsername || '@yourusername',
                autoUploadThreshold: parseInt(autoUploadThreshold) || 1000,
                contentCategories: contentCategories.length > 0 ? contentCategories : ['tech', 'lifestyle', 'business']
            };

            StorageManager.saveSettings(settings);
            ApprovalDepartment.showNotification('✅ Settings saved successfully!', 'success');
        });
    }

    // Load existing settings
    const settings = StorageManager.getSettings();
    if (settings) {
        const instagramUsernameInput = document.getElementById('instagramUsername');
        if (instagramUsernameInput && settings.instagramUsername) {
            instagramUsernameInput.value = settings.instagramUsername;
        }
        
        const autoUploadThresholdInput = document.getElementById('autoUploadThreshold');
        if (autoUploadThresholdInput && settings.autoUploadThreshold) {
            autoUploadThresholdInput.value = settings.autoUploadThreshold;
        }
        
        const contentCategoriesSelect = document.getElementById('contentCategories');
        if (contentCategoriesSelect && settings.contentCategories) {
            Array.from(contentCategoriesSelect.options).forEach(opt => {
                opt.selected = settings.contentCategories.includes(opt.value);
            });
        }
    }
}

// Load Initial Data
function loadInitialData() {
    // Update analytics
    AnalyticsDepartment.updateStats();
    
    // Render existing content
    ContentDepartment.renderContentQueue();
    
    // Render approval queue
    ApprovalDepartment.renderApprovalQueue();
    
    // Show welcome message if first time
    const hasVisited = sessionStorage.getItem('smc_visited');
    if (!hasVisited) {
        ApprovalDepartment.showNotification('👋 Welcome, CEO! Start by scanning trends or creating content.', 'info');
        sessionStorage.setItem('smc_visited', 'true');
    }
}

// Refresh Tab Content
function refreshTabContent(tabName) {
    switch(tabName) {
        case 'research':
            const trends = StorageManager.getTrends();
            if (trends.length > 0) {
                ResearchDepartment.renderTrends(trends);
            }
            break;
        case 'content':
            ContentDepartment.renderContentQueue();
            break;
        case 'approval':
            ApprovalDepartment.renderApprovalQueue();
            break;
        case 'analytics':
            AnalyticsDepartment.updateStats();
            break;
        case 'settings':
            // Settings are loaded automatically
            break;
    }
}

// Utility: Set Loading State
function setLoading(button, isLoading) {
    if (isLoading) {
        button.disabled = true;
        button.dataset.originalText = button.textContent;
        button.innerHTML = '<span class="loading"></span> Processing...';
    } else {
        button.disabled = false;
        button.textContent = button.dataset.originalText || button.textContent;
    }
}

// Auto-refresh approval queue every 30 seconds
setInterval(() => {
    ApprovalDepartment.renderApprovalQueue();
}, 30000);

// Auto-save settings before page unload
window.addEventListener('beforeunload', () => {
    const instagramUsername = document.getElementById('instagramUsername')?.value;
    const autoUploadThreshold = document.getElementById('autoUploadThreshold')?.value;
    const contentCategoriesSelect = document.getElementById('contentCategories');
    
    if (instagramUsername || autoUploadThreshold || contentCategoriesSelect) {
        const settings = {
            instagramUsername: instagramUsername || '@yourusername',
            autoUploadThreshold: parseInt(autoUploadThreshold) || 1000,
            contentCategories: contentCategoriesSelect ? 
                Array.from(contentCategoriesSelect.selectedOptions).map(opt => opt.value) : 
                ['tech', 'lifestyle', 'business']
        };
        StorageManager.saveSettings(settings);
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + 1-5 for quick tab navigation
    if ((e.ctrlKey || e.metaKey) && e.key >= '1' && e.key <= '5') {
        e.preventDefault();
        const tabs = ['research', 'content', 'approval', 'analytics', 'settings'];
        const tabIndex = parseInt(e.key) - 1;
        document.querySelector(`[data-tab="${tabs[tabIndex]}"]`)?.click();
    }
    
    // Escape to close modal
    if (e.key === 'Escape') {
        ApprovalDepartment.closeModal();
    }
});

console.log('🚀 CEO Social Media Command Center initialized!');
console.log('💡 Tip: Use Ctrl/Cmd + 1-5 to quickly switch between tabs');
