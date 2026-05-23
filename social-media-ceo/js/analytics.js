// Analytics Department - Performance Tracking and Statistics
const AnalyticsDepartment = {
    // Update statistics display
    updateStats() {
        const analytics = StorageManager.getAnalytics();
        
        const totalPostsEl = document.getElementById('totalPosts');
        const totalLikesEl = document.getElementById('totalLikes');
        const totalFollowersEl = document.getElementById('totalFollowers');
        const engagementRateEl = document.getElementById('engagementRate');

        if (totalPostsEl) totalPostsEl.textContent = analytics.totalPosts;
        if (totalLikesEl) totalLikesEl.textContent = this.formatNumber(analytics.totalLikes);
        if (totalFollowersEl) totalFollowersEl.textContent = this.formatNumber(analytics.totalFollowers);
        if (engagementRateEl) engagementRateEl.textContent = `${analytics.engagementRate}%`;

        this.renderChart();
    },

    // Format large numbers
    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    },

    // Render performance chart
    renderChart() {
        const container = document.getElementById('performanceChart');
        if (!container) return;

        const analytics = StorageManager.getAnalytics();
        const history = analytics.postsHistory;

        if (history.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 60px 20px; color: #666;">
                    <div style="font-size: 64px; margin-bottom: 20px;">📊</div>
                    <h3>No Data Yet</h3>
                    <p>Approve and upload content to see performance analytics here.</p>
                </div>
            `;
            return;
        }

        // Get last 7 posts for chart
        const recentPosts = history.slice(-7);
        const maxLikes = Math.max(...recentPosts.map(p => p.likes));

        container.innerHTML = `
            <h3 style="margin-bottom: 20px; color: #667eea;">Recent Post Performance</h3>
            <div style="display: flex; align-items: flex-end; gap: 15px; height: 250px; padding: 20px; background: white; border-radius: 10px;">
                ${recentPosts.map((post, index) => {
                    const height = (post.likes / maxLikes) * 100;
                    const date = new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    return `
                        <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end;">
                            <div style="width: 100%; background: linear-gradient(to top, #667eea, #764ba2); border-radius: 5px 5px 0 0; height: ${height}%; min-height: 30px; transition: height 0.5s ease; position: relative;">
                                <div style="position: absolute; top: -25px; left: 50%; transform: translateX(-50%); font-size: 12px; font-weight: 600; color: #667eea; white-space: nowrap;">
                                    ${this.formatNumber(post.likes)}
                                </div>
                            </div>
                            <div style="margin-top: 10px; font-size: 11px; color: #888; text-align: center;">
                                ${date}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
            <div style="margin-top: 20px; display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px;">
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
                    <p style="font-size: 12px; color: #888;">Avg. Likes per Post</p>
                    <p style="font-size: 20px; font-weight: 700; color: #667eea;">${this.formatNumber(Math.round(recentPosts.reduce((sum, p) => sum + p.likes, 0) / recentPosts.length))}</p>
                </div>
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
                    <p style="font-size: 12px; color: #888;">Best Performing Post</p>
                    <p style="font-size: 20px; font-weight: 700; color: #28a745;">${this.formatNumber(maxLikes)}</p>
                </div>
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
                    <p style="font-size: 12px; color: #888;">Total Posts Analyzed</p>
                    <p style="font-size: 20px; font-weight: 700; color: #764ba2;">${recentPosts.length}</p>
                </div>
            </div>
        `;
    },

    // Generate insights
    generateInsights() {
        const analytics = StorageManager.getAnalytics();
        const insights = [];

        if (analytics.totalPosts > 0) {
            insights.push({
                type: 'success',
                title: 'Consistent Posting',
                message: `You've posted ${analytics.totalPosts} times. Keep up the momentum!`
            });
        }

        if (analytics.engagementRate > 5) {
            insights.push({
                type: 'success',
                title: 'High Engagement',
                message: `Your engagement rate of ${analytics.engagementRate}% is above average!`
            });
        } else if (analytics.engagementRate > 0) {
            insights.push({
                type: 'info',
                title: 'Growing Engagement',
                message: 'Keep creating quality content to boost engagement.'
            });
        }

        if (analytics.totalFollowers > 10000) {
            insights.push({
                type: 'success',
                title: 'Milestone Reached',
                message: `You have over ${this.formatNumber(analytics.totalFollowers)} followers!`
            });
        }

        return insights;
    },

    // Render insights
    renderInsights() {
        const insights = this.generateInsights();
        // Could be displayed in a dedicated section
        return insights;
    }
};
