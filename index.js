const axios = require('axios');

const NEWS_API_KEY = 'YOUR_NEWS_API_KEY';
const GUARDIAN_API_KEY = 'YOUR_GUARDIAN_API_KEY';

class NewsAggregator {
    constructor() {
        this.sources = {
            newsApi: 'https://newsapi.org/v2/top-headlines',
            guardian: 'https://content.guardianapis.com/search'
        };
        this.categories = ['business', 'technology', 'sports', 'entertainment', 'health', 'science', 'politics'];
    }

    async fetchFromNewsAPI(category) {
        try {
            const response = await axios.get(this.sources.newsApi, {
                params: {
                    category,
                    apiKey: NEWS_API_KEY,
                    language: 'en'
                }
            });
            
            return response.data.articles.map(article => ({
                title: article.title,
                author: article.author,
                description: article.description,
                url: article.url,
                category,
                source: 'NewsAPI',
                publishedAt: article.publishedAt
            }));
        } catch (error) {
            console.error(`Error fetching from NewsAPI: ${error.message}`);
            return [];
        }
    }

    async fetchFromGuardian(category) {
        try {
            const response = await axios.get(this.sources.guardian, {
                params: {
                    section: category,
                    'api-key': GUARDIAN_API_KEY,
                    'show-fields': 'headline,byline,trailText'
                }
            });

            return response.data.response.results.map(article => ({
                title: article.fields.headline,
                author: article.fields.byline,
                description: article.fields.trailText,
                url: article.webUrl,
                category,
                source: 'The Guardian',
                publishedAt: article.webPublicationDate
            }));
        } catch (error) {
            console.error(`Error fetching from Guardian: ${error.message}`);
            return [];
        }
    }

    async fetchAllNews() {
        const allNews = {};

        // Initialize categories
        this.categories.forEach(category => {
            allNews[category] = [];
        });

        // Fetch news for each category from all sources
        for (const category of this.categories) {
            const [newsApiArticles, guardianArticles] = await Promise.all([
                this.fetchFromNewsAPI(category),
                this.fetchFromGuardian(category)
            ]);

            allNews[category] = [...newsApiArticles, ...guardianArticles];
        }

        return this.organizeNews(allNews);
    }

    organizeNews(newsData) {
        const organized = {};

        // Sort articles in each category by publication date
        for (const category in newsData) {
            organized[category] = newsData[category].sort((a, b) => 
                new Date(b.publishedAt) - new Date(a.publishedAt)
            );
        }

        return organized;
    }

    async getTopNewsByCategory(category, limit = 10) {
        if (!this.categories.includes(category)) {
            throw new Error('Invalid category');
        }

        const [newsApiArticles, guardianArticles] = await Promise.all([
            this.fetchFromNewsAPI(category),
            this.fetchFromGuardian(category)
        ]);

        const combinedNews = [...newsApiArticles, ...guardianArticles]
            .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
            .slice(0, limit);

        return combinedNews;
    }
}

// Example usage
async function main() {
    const aggregator = new NewsAggregator();
    
    try {
        // Get all news across categories
        const allNews = await aggregator.fetchAllNews();
        console.log('All news fetched and organized:', allNews);

        // Get top 5 technology news
        const topTechNews = await aggregator.getTopNewsByCategory('technology', 5);
        console.log('Top 5 Technology News:', topTechNews);
    } catch (error) {
        console.error('Error in main:', error);
    }
}

// Export the NewsAggregator class for use in other files
module.exports = NewsAggregator;

// Run the main function if this file is run directly
if (require.main === module) {
    main();
} 