// Content Creation Department - Video and Story Generation with AI Integration
const ContentDepartment = {
    // API Configuration
    apiBaseUrl: 'http://localhost:8000/api',
    
    // Video templates for different content types
    videoTemplates: {
        tutorial: {
            duration: '60s',
            format: '9:16',
            elements: ['Hook (0-3s)', 'Problem Statement (3-10s)', 'Solution Demo (10-50s)', 'CTA (50-60s)']
        },
        transformation: {
            duration: '30s',
            format: '9:16',
            elements: ['Before State (0-5s)', 'Transition Effect (5-10s)', 'After State (10-25s)', 'CTA (25-30s)']
        },
        listicle: {
            duration: '90s',
            format: '9:16',
            elements: ['Intro Hook (0-5s)', 'Item 1 (5-20s)', 'Item 2 (20-35s)', 'Item 3 (35-50s)', 'Item 4 (50-65s)', 'Item 5 (65-85s)', 'Outro CTA (85-90s)']
        },
        storytelling: {
            duration: '120s',
            format: '9:16',
            elements: ['Setup (0-20s)', 'Conflict (20-50s)', 'Journey (50-90s)', 'Resolution (90-110s)', 'Lesson/CTA (110-120s)']
        }
    },

    // Generate video content with REAL AI backend
    async createVideo(options = {}) {
        const settings = StorageManager.getSettings();
        
        // Check if user wants to use YouTube source or AI generation
        if (options.useYouTube && options.youtubeUrl) {
            return await this.createVideoFromYouTube(options);
        } else {
            return await this.createAIVideo(options);
        }
    },

    // Create video from YouTube URL (Backend processing)
    async createVideoFromYouTube(options) {
        const loadingBtn = document.querySelector('.btn-generate');
        if (loadingBtn) {
            loadingBtn.textContent = '🎬 Downloading & Cropping YouTube...';
            loadingBtn.disabled = true;
        }

        try {
            // Call backend API
            const response = await fetch(`${this.apiBaseUrl}/create-content`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    topic: options.title || 'Trending Topic',
                    style: 'viral_shorts',
                    source_url: options.youtubeUrl,
                    use_ai_video: false
                })
            });

            const jobData = await response.json();
            
            // Poll for completion
            const videoContent = await this.pollJobStatus(jobData.job_id, options);
            
            StorageManager.addContent(videoContent);
            ApprovalDepartment.addToQueue(videoContent);
            
            if (loadingBtn) {
                loadingBtn.textContent = '✅ YouTube Short Created!';
                setTimeout(() => {
                    loadingBtn.textContent = '🎬 Generate Video';
                    loadingBtn.disabled = false;
                }, 2000);
            }
            
            return videoContent;
            
        } catch (error) {
            console.error('YouTube processing error:', error);
            // Fallback to simulated mode if backend is not running
            alert('Backend server not running. Using simulation mode.\n\nTo enable real AI features:\n1. Install Python dependencies\n2. Run: python server.py\n3. Refresh page');
            return this.createVideoSimulation(options);
        }
    },

    // Create fully AI-generated video
    async createAIVideo(options) {
        const loadingBtn = document.querySelector('.btn-generate');
        if (loadingBtn) {
            loadingBtn.textContent = '🤖 AI Generating Video & Audio...';
            loadingBtn.disabled = true;
        }

        try {
            // Call backend API for AI generation
            const response = await fetch(`${this.apiBaseUrl}/create-content`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    topic: options.title || 'Trending Topic',
                    style: 'viral_shorts',
                    source_url: null,
                    use_ai_video: true
                })
            });

            const jobData = await response.json();
            
            // Poll for completion
            const videoContent = await this.pollJobStatus(jobData.job_id, options);
            
            StorageManager.addContent(videoContent);
            ApprovalDepartment.addToQueue(videoContent);
            
            if (loadingBtn) {
                loadingBtn.textContent = '✅ AI Video Created!';
                setTimeout(() => {
                    loadingBtn.textContent = '🎬 Generate Video';
                    loadingBtn.disabled = false;
                }, 2000);
            }
            
            return videoContent;
            
        } catch (error) {
            console.error('AI generation error:', error);
            // Fallback to simulated mode
            alert('Backend server not running. Using simulation mode.\n\nTo enable real AI features:\n1. Install Python dependencies\n2. Run: python server.py\n3. Refresh page');
            return this.createVideoSimulation(options);
        }
    },

    // Poll backend job status
    async pollJobStatus(jobId, options, maxAttempts = 30) {
        for (let i = 0; i < maxAttempts; i++) {
            try {
                const response = await fetch(`${this.apiBaseUrl}/status/${jobId}`);
                const statusData = await response.json();
                
                if (statusData.status === 'completed') {
                    // Build content object from backend result
                    return {
                        id: StorageManager.generateId(),
                        type: 'video',
                        title: options.title || 'AI Generated Content',
                        description: 'Real-time AI generated video with audio',
                        template: 'ai_generated',
                        duration: '60s',
                        format: '9:16',
                        script: [
                            `🎯 AI Generated Script for: ${options.title || 'Topic'}`,
                            `🎙️ AI Voiceover: Microsoft Edge TTS (Jenny Neural)`,
                            `🎬 Video: ${options.youtubeUrl ? 'YouTube Clip (9:16 cropped)' : 'Stable Video Diffusion AI'}`,
                            `📊 Estimated Reach: High viral potential`
                        ],
                        elements: ['AI Hook', 'AI Content', 'AI CTA'],
                        hashtags: this.generateHashtags(['trending']),
                        estimatedReach: Math.floor(Math.random() * 100000) + 50000,
                        createdAt: new Date().toISOString(),
                        status: 'draft',
                        thumbnail: '🎬 AI Generated Preview',
                        videoUrl: statusData.video_url // Real video URL from backend
                    };
                } else if (statusData.status === 'failed') {
                    throw new Error(statusData.message);
                }
                
                // Still processing, wait and retry
                await new Promise(resolve => setTimeout(resolve, 2000));
                
            } catch (error) {
                if (i === maxAttempts - 1) throw error;
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
        throw new Error('Job timeout');
    },

    // Fallback simulation mode (when backend is offline)
    createVideoSimulation(options) {
        const settings = StorageManager.getSettings();
        const categories = options.trendData ? [options.trendData.category] : settings.contentCategories;
        
        const templateTypes = Object.keys(this.videoTemplates);
        const selectedTemplate = templateTypes[Math.floor(Math.random() * templateTypes.length)];
        const template = this.videoTemplates[selectedTemplate];

        const videoContent = {
            id: StorageManager.generateId(),
            type: 'video',
            title: options.title || `Trending ${categories[0]} Content`,
            description: options.description || 'Auto-generated viral content (Simulation Mode)',
            template: selectedTemplate,
            duration: template.duration,
            format: template.format,
            script: this.generateScript(options),
            elements: template.elements,
            hashtags: this.generateHashtags(categories),
            estimatedReach: Math.floor(Math.random() * 50000) + 10000,
            createdAt: new Date().toISOString(),
            status: 'draft',
            thumbnail: this.generateThumbnailPreview(options.title || 'Trending Topic')
        };

        StorageManager.addContent(videoContent);
        ApprovalDepartment.addToQueue(videoContent);
        
        const loadingBtn = document.querySelector('.btn-generate');
        if (loadingBtn) {
            loadingBtn.textContent = '🎬 Generate Video';
            loadingBtn.disabled = false;
        }
        
        return videoContent;
    },

    // Generate story content
    createStory(options = {}) {
        const settings = StorageManager.getSettings();
        const categories = options.trendData ? [options.trendData.category] : settings.contentCategories;

        const storyContent = {
            id: StorageManager.generateId(),
            type: 'story',
            title: options.title || `Quick Story: ${categories[0]}`,
            description: options.description || 'Engaging story content',
            slides: this.generateStorySlides(options),
            hashtags: this.generateHashtags(categories),
            estimatedReach: Math.floor(Math.random() * 30000) + 5000,
            createdAt: new Date().toISOString(),
            status: 'draft'
        };

        StorageManager.addContent(storyContent);
        
        // Automatically send to approval queue
        ApprovalDepartment.addToQueue(storyContent);
        
        return storyContent;
    },

    // Auto-create full campaign
    autoCreateCampaign() {
        return new Promise((resolve) => {
            const campaign = {
                id: StorageManager.generateId(),
                name: `Campaign ${new Date().toLocaleDateString()}`,
                contents: [],
                createdAt: new Date().toISOString()
            };

            // Create 3 videos and 2 stories
            for (let i = 0; i < 3; i++) {
                const video = this.createVideo({
                    title: `Campaign Video ${i + 1}`,
                    description: 'Part of automated campaign'
                });
                campaign.contents.push(video.id);
            }

            for (let i = 0; i < 2; i++) {
                const story = this.createStory({
                    title: `Campaign Story ${i + 1}`,
                    description: 'Supporting story content'
                });
                campaign.contents.push(story.id);
            }

            setTimeout(() => {
                resolve(campaign);
            }, 2000);
        });
    },

    // Generate video script based on template and topic
    generateScript(options) {
        const topic = options.title || 'Trending Topic';
        const template = options.template || 'tutorial';
        
        const scripts = {
            tutorial: [
                `🎯 HOOK: "Stop scrolling! Here's how to master ${topic} in 60 seconds"`,
                `❌ PROBLEM: "Most people struggle with ${topic} because they don't know this secret..."`,
                `✅ SOLUTION: [Step-by-step demonstration of ${topic}]`,
                `💡 TIP: "Pro tip: ${this.generateRandomTip(topic)}"`,
                `📢 CTA: "Follow for more ${topic} tips! Save this for later!"`
            ],
            transformation: [
                `📸 BEFORE: "This was me before discovering ${topic}..."`,
                `✨ TRANSITION: [Smooth transition effect]`,
                `🚀 AFTER: "And this is after implementing ${topic} strategies!"`,
                `💬 CTA: "Comment 'YES' if you want a tutorial!"`
            ],
            listicle: [
                `🔥 HOOK: "Top 5 secrets about ${topic} that will change your life!"`,
                `#5: "${this.generateRandomFact(topic)}"`,
                `#4: "${this.generateRandomFact(topic)}"`,
                `#3: "${this.generateRandomFact(topic)}"`,
                `#2: "${this.generateRandomFact(topic)}"`,
                `#1: "${this.generateRandomFact(topic)}"`,
                `📢 CTA: "Which one surprised you? Comment below!"`
            ],
            storytelling: [
                `📖 SETUP: "Let me tell you how ${topic} changed everything for me..."`,
                `😰 CONFLICT: "I was struggling with... [relatable problem]"`,
                `🛤️ JOURNEY: "Then I discovered ${topic} and here's what happened..."`,
                `🎉 RESOLUTION: "Now my life is completely different because..."`,
                `💡 LESSON: "${this.generateRandomTip(topic)}"`,
                `📢 CTA: "Share this with someone who needs to hear it!"`
            ]
        };

        return scripts[template] || scripts.tutorial;
    },

    // Generate story slides
    generateStorySlides(options) {
        const topic = options.title || 'Trending Topic';
        
        return [
            { slide: 1, type: 'text', content: `🔥 ${topic}`, background: 'gradient' },
            { slide: 2, type: 'question', content: `Did you know this about ${topic}?`, background: 'solid' },
            { slide: 3, type: 'fact', content: this.generateRandomFact(topic), background: 'image' },
            { slide: 4, type: 'poll', content: `Want more ${topic} content?`, options: ['YES!', 'Tell me more'], background: 'gradient' },
            { slide: 5, type: 'cta', content: 'Follow for daily tips! 📲', background: 'solid' }
        ];
    },

    // Generate relevant hashtags
    generateHashtags(categories) {
        const baseHashtags = {
            tech: ['#technology', '#tech', '#innovation', '#AI', '#future', '#digital', '#startup'],
            lifestyle: ['#lifestyle', '#wellness', '#motivation', '#selfcare', '#mindset', '#goals', '#inspiration'],
            business: ['#business', '#entrepreneur', '#success', '#leadership', '#growth', '#investing', '#finance'],
            entertainment: ['#entertainment', '#viral', '#trending', '#fun', '#creative', '#content', '#socialmedia'],
            education: ['#education', '#learning', '#knowledge', '#tips', '#howto', '#tutorial', '#skills']
        };

        let hashtags = [];
        categories.forEach(cat => {
            if (baseHashtags[cat]) {
                hashtags = hashtags.concat(baseHashtags[cat]);
            }
        });

        // Add generic viral hashtags
        hashtags = hashtags.concat(['#fyp', '#explore', '#viral', '#trending']);

        // Return 10-15 random hashtags from the pool
        return hashtags.sort(() => Math.random() - 0.5).slice(0, Math.floor(Math.random() * 5) + 10);
    },

    // Generate random tips
    generateRandomTip(topic) {
        const tips = [
            `Consistency is key when mastering ${topic}`,
            `Start small and scale up with ${topic}`,
            `The best time to start ${topic} was yesterday, second best is now`,
            `Focus on progress, not perfection in ${topic}`,
            `Surround yourself with people who understand ${topic}`,
            `Document your ${topic} journey, not just the highlights`
        ];
        return tips[Math.floor(Math.random() * tips.length)];
    },

    // Generate random facts
    generateRandomFact(topic) {
        const facts = [
            `90% of successful people use ${topic} strategies daily`,
            `${topic} can increase productivity by up to 300%`,
            `The average person spends 2 hours daily that could be optimized with ${topic}`,
            `Studies show ${topic} improves long-term outcomes by 75%`,
            `Top performers attribute 80% of their success to understanding ${topic}`
        ];
        return facts[Math.floor(Math.random() * facts.length)];
    },

    // Generate thumbnail preview
    generateThumbnailPreview(title) {
        return `🎬 ${title.substring(0, 30)}${title.length > 30 ? '...' : ''}`;
    },

    // Render content queue
    renderContentQueue() {
        const container = document.getElementById('contentQueue');
        if (!container) return;

        const content = StorageManager.getContent();
        
        if (content.length === 0) {
            container.innerHTML = '<p style="color: #666; text-align: center; padding: 40px;">No content created yet. Click "Generate Video" or "Auto-Create Full Campaign" to start.</p>';
            return;
        }

        container.innerHTML = content.map(item => `
            <div class="content-item">
                <div class="content-info">
                    <h4>${item.type === 'video' ? '🎬' : '📱'} ${item.title}</h4>
                    <p>${item.description}</p>
                    <p style="font-size: 12px; color: #888; margin-top: 5px;">
                        Created: ${new Date(item.createdAt).toLocaleString()} | 
                        Est. Reach: ${(item.estimatedReach / 1000).toFixed(1)}K
                    </p>
                </div>
                <span class="status-badge status-${item.status}">${item.status.toUpperCase()}</span>
            </div>
        `).join('');
    }
};
