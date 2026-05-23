// Research Department - Trend Analysis and Competitor Research
const ResearchDepartment = {
    // Simulated trending topics database
    trendTemplates: [
        { topic: 'AI Revolution', category: 'tech', engagement: 95, description: 'Artificial Intelligence transforming industries' },
        { topic: 'Sustainable Living', category: 'lifestyle', engagement: 88, description: 'Eco-friendly lifestyle trends gaining momentum' },
        { topic: 'Remote Work Tips', category: 'business', engagement: 82, description: 'Productivity hacks for remote workers' },
        { topic: 'Mental Health Awareness', category: 'lifestyle', engagement: 91, description: 'Breaking stigma around mental health' },
        { topic: 'Crypto Updates', category: 'tech', engagement: 78, description: 'Latest developments in cryptocurrency' },
        { topic: 'Startup Success Stories', category: 'business', engagement: 85, description: 'Inspiring entrepreneur journeys' },
        { topic: 'Fitness Challenges', category: 'lifestyle', engagement: 89, description: '30-day transformation challenges' },
        { topic: 'Tech Gadgets 2024', category: 'tech', engagement: 93, description: 'Must-have technology this year' },
        { topic: 'Financial Freedom', category: 'business', engagement: 87, description: 'Investment strategies for beginners' },
        { topic: 'Creative Content Ideas', category: 'entertainment', engagement: 90, description: 'Viral content creation tips' }
    ],

    // Simulated competitors
    competitors: [
        { name: '@techinfluencer', followers: 250000, avgLikes: 15000, niche: 'Technology' },
        { name: '@lifestyleguru', followers: 180000, avgLikes: 12000, niche: 'Lifestyle' },
        { name: '@businessmindset', followers: 320000, avgLikes: 22000, niche: 'Business' },
        { name: '@contentcreator', followers: 450000, avgLikes: 35000, niche: 'Entertainment' }
    ],

    // Scan for latest trends
    scanTrends() {
        return new Promise((resolve) => {
            setTimeout(() => {
                const settings = StorageManager.getSettings();
                const selectedCategories = settings.contentCategories || ['tech', 'lifestyle', 'business'];
                
                // Filter trends based on selected categories
                const relevantTrends = this.trendTemplates
                    .filter(t => selectedCategories.includes(t.category))
                    .map(t => ({
                        ...t,
                        id: StorageManager.generateId(),
                        scannedAt: new Date().toISOString(),
                        potentialReach: Math.floor(Math.random() * 100000) + 10000,
                        competitionLevel: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)]
                    }));
                
                StorageManager.saveTrends(relevantTrends);
                resolve(relevantTrends);
            }, 1500);
        });
    },

    // Analyze competitors
    analyzeCompetitors() {
        return new Promise((resolve) => {
            setTimeout(() => {
                const analysis = this.competitors.map(comp => ({
                    ...comp,
                    id: StorageManager.generateId(),
                    growthRate: (Math.random() * 15 + 5).toFixed(1),
                    bestPostingTime: ['9:00 AM', '12:00 PM', '6:00 PM', '8:00 PM'][Math.floor(Math.random() * 4)],
                    topContentTypes: ['Reels', 'Stories', 'Carousel', 'Single Image'].slice(0, Math.floor(Math.random() * 2) + 1),
                    engagementRate: ((comp.avgLikes / comp.followers) * 100).toFixed(2)
                }));
                resolve(analysis);
            }, 1200);
        });
    },

    // Get content ideas based on trends
    generateContentIdeas(trend) {
        const ideas = [
            `Create a quick tutorial about ${trend.topic}`,
            `Share before/after transformation related to ${trend.topic}`,
            `Make a controversial take on ${trend.topic}`,
            `Interview an expert about ${trend.topic}`,
            `Create a day-in-life featuring ${trend.topic}`,
            `Make a listicle: Top 5 things about ${trend.topic}`
        ];
        
        return ideas.sort(() => Math.random() - 0.5).slice(0, 3);
    },

    // Render trends UI
    renderTrends(trends) {
        const container = document.getElementById('trendingTopics');
        if (!container) return;

        if (trends.length === 0) {
            container.innerHTML = '<p style="color: #666; text-align: center; padding: 40px;">No trends found. Click "Scan Latest Trends" to discover trending topics.</p>';
            return;
        }

        container.innerHTML = trends.map(trend => `
            <div class="card">
                <h3>🔥 ${trend.topic}</h3>
                <p>${trend.description}</p>
                <div class="metrics">
                    <span>📊 Engagement: ${trend.engagement}%</span>
                    <span>👥 Reach: ${(trend.potentialReach / 1000).toFixed(1)}K</span>
                    <span>⚡ Competition: ${trend.competitionLevel}</span>
                </div>
                <button class="btn-primary" style="margin-top: 15px; width: 100%;" onclick="ResearchDepartment.createFromTrend('${trend.id}')">
                    Create Content from This Trend
                </button>
            </div>
        `).join('');
    },

    // Render competitor analysis UI
    renderCompetitorAnalysis(analysis) {
        const container = document.getElementById('competitorAnalysis');
        if (!container) return;

        container.innerHTML = '<h3 style="margin-bottom: 15px; color: #667eea;">Competitor Insights</h3>' + 
            analysis.map(comp => `
            <div class="card">
                <h3>📈 ${comp.name}</h3>
                <p><strong>Niche:</strong> ${comp.niche}</p>
                <div class="metrics">
                    <span>👥 Followers: ${(comp.followers / 1000).toFixed(0)}K</span>
                    <span>❤️ Avg Likes: ${(comp.avgLikes / 1000).toFixed(1)}K</span>
                    <span>📊 Growth: ${comp.growthRate}%</span>
                </div>
                <div class="metrics" style="margin-top: 10px;">
                    <span>⏰ Best Time: ${comp.bestPostingTime}</span>
                    <span>📱 Engagement: ${comp.engagementRate}%</span>
                </div>
            </div>
        `).join('');
    },

    // Create content from trend
    createFromTrend(trendId) {
        const trends = StorageManager.getTrends();
        const trend = trends.find(t => t.id === trendId);
        
        if (trend) {
            const ideas = this.generateContentIdeas(trend);
            
            // Switch to content tab
            document.querySelector('[data-tab="content"]').click();
            
            // Auto-generate video content
            ContentDepartment.createVideo({
                title: trend.topic,
                description: trend.description,
                ideas: ideas,
                trendData: trend
            });
        }
    }
};
