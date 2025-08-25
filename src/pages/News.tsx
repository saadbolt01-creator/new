import React, { useState, useEffect } from 'react';
import { Calendar, ArrowRight, Tag, Award, Users, TrendingUp, Building, X, ChevronLeft, ChevronRight, Clock, Eye, Share2, AlertCircle } from 'lucide-react';
import { loadAllNews, getNewsCategories, getNewsByCategory, NewsArticle } from '../utils/newsLoader';
import SEOHead from '../components/SEOHead';
import NewsletterSubscription from '../components/NewsletterSubscription';
import { AutoNotificationService } from '../utils/autoNotificationService';

// SEO Component for structured data
const NewsStructuredData: React.FC<{ articles: NewsArticle[] }> = ({ articles }) => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": "Saher Flow Solutions News",
    "description": "Latest news and updates from Saher Flow Solutions",
    "url": `${window.location.origin}/news`,
    "blogPost": articles.slice(0, 10).map(article => ({
      "@type": "BlogPosting",
      "headline": article.title,
      "description": article.excerpt,
      "image": article.image,
      "author": {
        "@type": "Organization",
        "name": "Saher Flow Solutions"
      },
      "publisher": {
        "@type": "Organization",
        "name": "Saher Flow Solutions"
      },
      "datePublished": article.date,
      "url": `${window.location.origin}/news/${article.slug}`
    }))
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
};

const News: React.FC = () => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [filteredArticles, setFilteredArticles] = useState<NewsArticle[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const articlesPerSlide = 3;

  // Load news data
  useEffect(() => {
    const loadNewsData = async () => {
      try {
        setLoading(true);
        const [newsArticles, newsCategories] = await Promise.all([
          loadAllNews(),
          getNewsCategories()
        ]);
        
        setArticles(newsArticles);
        setCategories(newsCategories);
        setFilteredArticles(newsArticles);
        
        // Check for article hash in URL
        const hash = window.location.hash.substring(1);
        if (hash) {
          const article = newsArticles.find(a => a.slug === hash || a.id === hash);
          if (article) {
            setSelectedArticle(article);
          }
        }
        
        // Trigger auto-notification check
        AutoNotificationService.checkForNewContent();
        
      } catch (err) {
        console.error('Error loading news:', err);
        setError(`Failed to load news articles: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    loadNewsData();
  }, []);


  // Auto-refresh news every 5 minutes to pick up new articles
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const [newsArticles, newsCategories] = await Promise.all([
          loadAllNews(),
          getNewsCategories()
        ]);
        
        // Only update if there are changes
        if (newsArticles.length !== articles.length) {
          setArticles(newsArticles);
          setCategories(newsCategories);
          if (selectedCategory === 'All') {
            setFilteredArticles(newsArticles);
          }
          
          // Trigger auto-notification check
          AutoNotificationService.checkForNewContent();
        }
      } catch (err) {
        console.error('Error refreshing news:', err);
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [articles.length, selectedCategory]);

  // Filter articles by category
  useEffect(() => {
    const filterArticles = async () => {
      try {
        const filtered = await getNewsByCategory(selectedCategory);
        setFilteredArticles(filtered);
        setCurrentSlide(0);
      } catch (err) {
        console.error('Error filtering articles:', err);
      }
    };

    if (categories.length > 0) {
      filterArticles();
    }
  }, [selectedCategory, categories]);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    target.src = 'https://images.pexels.com/photos/3862132/pexels-photo-3862132.jpeg?auto=compress&cs=tinysrgb&w=800';
  };

  const nextSlide = () => {
    const maxSlides = Math.ceil(filteredArticles.length / articlesPerSlide);
    setCurrentSlide((prev) => (prev + 1) % maxSlides);
  };

  const prevSlide = () => {
    const maxSlides = Math.ceil(filteredArticles.length / articlesPerSlide);
    setCurrentSlide((prev) => (prev - 1 + maxSlides) % maxSlides);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Customer Validation':
        return <Award className="w-5 h-5" />;
      case 'Technology':
        return <TrendingUp className="w-5 h-5" />;
      case 'Company News':
        return <Building className="w-5 h-5" />;
      default:
        return <Tag className="w-5 h-5" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const shareArticle = async (article: NewsArticle) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: article.excerpt,
          url: `${window.location.origin}/news/${article.slug}`
        });
      } catch (err) {
        console.log('Share was cancelled');
      }
    } else {
      // Fallback to copying URL
      navigator.clipboard.writeText(`${window.location.origin}/news/${article.slug}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-pulse">
            <div className="w-16 h-16 bg-navy-600 rounded-full mx-auto mb-4"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-48 mx-auto mb-2"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32 mx-auto"></div>
          </div>
          <p className="text-navy-600 dark:text-white font-medium mt-4">Loading latest news...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Error Loading News</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            <p>Debug info:</p>
            <p>Articles loaded: {articles.length}</p>
            <p>Categories: {categories.join(', ')}</p>
          </div>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-navy-600 text-white px-6 py-2 rounded-lg hover:bg-navy-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const totalSlides = Math.ceil(filteredArticles.length / articlesPerSlide);
  const currentArticles = filteredArticles.slice(
    currentSlide * articlesPerSlide,
    (currentSlide + 1) * articlesPerSlide
  );

  return (
    <>
      <SEOHead
        title="Latest News & Updates | Saher Flow Solutions"
        description="Stay updated with latest news from Saher Flow Solutions. Saudi Aramco pre-qualification, field trials, awards, partnerships, and breakthrough developments in multiphase flow measurement."
        keywords="Saher Flow news, Saudi Aramco pre-qualified, multiphase flow meter news, oil gas technology news, DMOR technology updates, flow measurement industry news"
        url="/news"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "Blog",
          "name": "Saher Flow Solutions News",
          "description": "Latest news and updates from Saher Flow Solutions",
          "url": "https://saherflow.com/news",
          "publisher": {
            "@type": "Organization",
            "name": "Saher Flow Solutions"
          },
          "blogPost": articles.slice(0, 5).map(article => ({
            "@type": "BlogPosting",
            "headline": article.title,
            "description": article.excerpt,
            "image": article.image,
            "datePublished": article.date,
            "url": `https://saherflow.com/news#${article.slug}`,
            "author": {
              "@type": "Organization",
              "name": "Saher Flow Solutions"
            }
          }))
        }}
      />
      <NewsStructuredData articles={articles} />
      
      {/* SEO Meta Tags */}
      <div className="sr-only">
        <h1>Saher Flow Solutions News - Latest Updates and Industry Insights</h1>
        <meta name="description" content="Stay updated with the latest news from Saher Flow Solutions. Read about our multiphase flow measurement technology, partnerships, and industry achievements." />
        <meta name="keywords" content="Saher Flow Solutions, multiphase flow measurement, Saudi Aramco, oil and gas technology, flow meters, DMOR technology" />
      </div>

      <section id="news" className="pt-20 bg-gray-50 dark:bg-gray-900 min-h-screen">
        {/* Hero Header */}
        <div className="relative bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700 text-white py-16 sm:py-20 lg:py-24 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent"></div>
          <div className="container mx-auto px-6 relative z-10">
            <div className="max-w-4xl">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 sm:mb-6 leading-tight">
                Latest News & 
                <span className="block text-yellow-400">Industry Insights</span>
              </h1>
              <p className="text-lg sm:text-xl lg:text-2xl text-gray-300 leading-relaxed mb-6 sm:mb-8">
                Stay updated with breakthrough developments, partnerships, and innovations from Saher Flow Solutions
              </p>
              <div className="flex items-center gap-4 sm:gap-6">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-yellow-400" />
                  <span className="text-gray-300 text-sm sm:text-base">Updated Daily</span>
                </div>
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-yellow-400" />
                  <span className="text-gray-300 text-sm sm:text-base">{articles.length} Articles</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="bg-white dark:bg-gray-800 shadow-md sticky top-16 z-40 border-t border-gray-200 dark:border-gray-700">
          <div className="container mx-auto px-6 py-4">
            <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all duration-200 ${
                    selectedCategory === category
                      ? 'bg-navy-600 text-white shadow-lg scale-105'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {category !== 'All' && getCategoryIcon(category)}
                  {category}
                  <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                    {category === 'All' ? articles.length : articles.filter(a => a.category === category).length}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* News Grid */}
        <div className="py-16">
          <div className="container mx-auto px-6">
            {filteredArticles.length === 0 ? (
              <div className="text-center py-16">
                <Tag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No articles found</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {selectedCategory === 'All' 
                    ? 'No news articles are available at the moment.'
                    : `No articles found in "${selectedCategory}" category.`
                  }
                </p>
              </div>
            ) : (
              <div className="relative">
                {/* Articles Grid */}
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">
                  {currentArticles.map((article, index) => (
                    <article
                      key={article.id || article.slug}
                      className="group bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:transform hover:scale-[1.02] cursor-pointer"
                      onClick={() => setSelectedArticle(article)}
                    >
                      {/* Image */}
                      <div className="aspect-video overflow-hidden relative">
                        <img
                          src={article.image}
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          onError={handleImageError}
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        
                        {/* Category Badge */}
                        <div className="absolute top-4 left-4">
                          <div className="flex items-center gap-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm text-navy-900 dark:text-white px-3 py-1.5 rounded-full text-sm font-medium">
                            {getCategoryIcon(article.category)}
                            {article.category}
                          </div>
                        </div>

                        {/* Featured Badge */}
                        {article.featured && (
                          <div className="absolute top-4 right-4">
                            <div className="bg-yellow-500 text-navy-900 px-2 py-1 rounded-full text-xs font-bold">
                              FEATURED
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-6">
                        {/* Meta */}
                        <div className="flex items-center gap-4 mb-4">
                          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                            <Calendar className="w-4 h-4" />
                            <time dateTime={article.date} className="text-sm">
                              {formatDate(article.date)}
                            </time>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              shareArticle(article);
                            }}
                            className="text-gray-400 hover:text-navy-600 dark:hover:text-yellow-400 transition-colors"
                            title="Share article"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Title */}
                        <h2 className="text-xl font-bold text-navy-900 dark:text-white mb-3 group-hover:text-navy-700 dark:group-hover:text-yellow-400 transition-colors duration-200 line-clamp-2">
                          {article.title}
                        </h2>

                        {/* Excerpt */}
                        <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-6 line-clamp-3">
                          {article.excerpt}
                        </p>

                        {/* Read More */}
                        <div className="flex items-center justify-between">
                          <button className="flex items-center gap-2 text-navy-600 dark:text-yellow-400 font-semibold hover:text-yellow-500 transition-colors duration-200 text-sm group-hover:gap-3">
                            Read Full Article <ArrowRight className="w-4 h-4" />
                          </button>
                          
                          <div className="text-xs text-gray-400 dark:text-gray-500">
                            {Math.ceil(article.content.length / 1000)} min read
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>

                {/* Navigation */}
                {totalSlides > 1 && (
                  <div className="flex justify-center items-center gap-4 mt-12">
                    <button
                      onClick={prevSlide}
                      className="bg-white dark:bg-gray-800 p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
                      disabled={currentSlide === 0}
                    >
                      <ChevronLeft className="w-6 h-6 text-navy-900 dark:text-white" />
                    </button>

                    {/* Slide Indicators */}
                    <div className="flex gap-2">
                      {Array.from({ length: totalSlides }).map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentSlide(index)}
                          className={`w-3 h-3 rounded-full transition-all duration-300 ${
                            currentSlide === index
                              ? 'bg-navy-600 w-8'
                              : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400'
                          }`}
                        />
                      ))}
                    </div>

                    <button
                      onClick={nextSlide}
                      className="bg-white dark:bg-gray-800 p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
                      disabled={currentSlide === totalSlides - 1}
                    >
                      <ChevronRight className="w-6 h-6 text-navy-900 dark:text-white" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* CTA Section */}
        <div className="py-16 bg-gradient-to-r from-navy-900 to-navy-800 dark:from-gray-900 dark:to-gray-800">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-4xl font-bold text-white mb-4">Ready to Transform Your Production?</h2>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Join industry leaders who trust Saher Flow Solutions for their critical flow measurement needs
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a
                href="/contact"
                className="inline-flex items-center gap-3 bg-yellow-500 text-navy-900 px-8 py-4 rounded-lg font-bold text-lg hover:bg-yellow-400 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Schedule Demo
                <ArrowRight className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Admin Panel */}
        
        {selectedArticle && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="relative">
                <img
                  src={selectedArticle.image}
                  alt={selectedArticle.title}
                  className="w-full h-64 lg:h-80 object-cover rounded-t-2xl"
                  onError={handleImageError}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent rounded-t-2xl"></div>
                
                <button
                  onClick={() => setSelectedArticle(null)}
                  className="absolute top-4 right-4 bg-white/90 dark:bg-gray-800/90 text-gray-800 dark:text-white p-2 rounded-full hover:bg-white dark:hover:bg-gray-800 transition-colors backdrop-blur-sm"
                >
                  <X size={24} />
                </button>

                {/* Article Meta on Image */}
                <div className="absolute bottom-4 left-6 right-6">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full">
                      {getCategoryIcon(selectedArticle.category)}
                      {selectedArticle.category}
                    </div>
                    <div className="flex items-center gap-2 text-white/90">
                      <Calendar className="w-4 h-4" />
                      <time dateTime={selectedArticle.date}>
                        {formatDate(selectedArticle.date)}
                      </time>
                    </div>
                  </div>
                  
                  <h1 className="text-2xl lg:text-4xl font-bold text-white leading-tight">
                    {selectedArticle.title}
                  </h1>
                </div>
              </div>

              <div className="p-6 lg:p-8">
                {/* Article Content */}
                <div 
                  className="prose prose-lg dark:prose-invert max-w-none prose-headings:text-navy-900 dark:prose-headings:text-white prose-a:text-navy-600 dark:prose-a:text-yellow-400 prose-strong:text-navy-900 dark:prose-strong:text-white prose-p:text-gray-700 dark:prose-p:text-gray-300"
                  dangerouslySetInnerHTML={{ __html: selectedArticle.content }}
                />
                <style jsx>{`
                  .prose {
                    line-height: 1.8;
                  }
                  .prose h1 {
                    font-size: 2.5rem;
                    font-weight: 800;
                    margin-top: 2rem;
                    margin-bottom: 1.5rem;
                    color: #1a3a5c;
                  }
                  .prose h2 {
                    font-size: 2rem;
                    font-weight: 700;
                    margin-top: 2rem;
                    margin-bottom: 1rem;
                    color: #1a3a5c;
                    border-bottom: 2px solid #ffd500;
                    padding-bottom: 0.5rem;
                  }
                  .prose h3 {
                    font-size: 1.5rem;
                    font-weight: 600;
                    margin-top: 1.5rem;
                    margin-bottom: 0.75rem;
                    color: #1a3a5c;
                  }
                  .prose p {
                    margin-bottom: 1.5rem;
                    font-size: 1.1rem;
                    line-height: 1.8;
                    color: #374151 !important;
                  }
                  .dark .prose p {
                    color: #d1d5db !important;
                  }
                  .prose ul, .prose ol {
                    margin: 1.5rem 0;
                    padding-left: 2rem;
                  }
                  .prose li {
                    margin-bottom: 0.75rem;
                    font-size: 1.1rem;
                    line-height: 1.7;
                    color: #374151 !important;
                  }
                  .dark .prose li {
                    color: #d1d5db !important;
                  }
                  .prose blockquote {
                    border-left: 4px solid #ffd500;
                    background: #f9fafb;
                    padding: 1.5rem 2rem;
                    margin: 2rem 0;
                    font-style: italic;
                    font-size: 1.2rem;
                    color: #1a3a5c;
                  }
                  .prose table {
                    width: 100%;
                    margin: 2rem 0;
                    border-collapse: collapse;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                    border-radius: 0.5rem;
                    overflow: hidden;
                  }
                  .prose th {
                    background: #1a3a5c;
                    color: white;
                    padding: 1rem;
                    text-align: left;
                    font-weight: 600;
                  }
                  .prose td {
                    padding: 1rem;
                    border-bottom: 1px solid #e5e7eb;
                  }
                  .prose tr:nth-child(even) {
                    background: #f9fafb;
                  }
                  .prose code {
                    background: #f3f4f6;
                    padding: 0.25rem 0.5rem;
                    border-radius: 0.25rem;
                    font-family: 'Monaco', 'Menlo', monospace;
                    font-size: 0.9rem;
                    color: #1a3a5c;
                  }
                  .prose pre {
                    background: #1f2937;
                    color: #f9fafb;
                    padding: 1.5rem;
                    border-radius: 0.5rem;
                    overflow-x: auto;
                    margin: 2rem 0;
                  }
                  .prose img {
                    border-radius: 0.5rem;
                    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
                    margin: 2rem 0;
                  }
                  .prose a {
                    color: #1a3a5c;
                    text-decoration: underline;
                    text-decoration-color: #ffd500;
                    text-underline-offset: 3px;
                    font-weight: 500;
                  }
                  .prose a:hover {
                    color: #ffd500;
                  }
                  .dark .prose h1,
                  .dark .prose h2,
                  .dark .prose h3 {
                    color: white !important;
                  }
                  .dark .prose blockquote {
                    background: #374151;
                    color: #f9fafb !important;
                  }
                  .dark .prose th {
                    background: #374151;
                  }
                  .dark .prose tr:nth-child(even) {
                    background: #374151;
                  }
                  .dark .prose td {
                    color: #d1d5db !important;
                  }
                  .dark .prose code {
                    background: #374151;
                    color: #ffd500;
                  }
                `}</style>

                {/* Share Actions */}
                <div className="flex items-center justify-between pt-8 mt-8 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-4">
                    <span className="text-gray-600 dark:text-gray-400">Share this article:</span>
                    <button
                      onClick={() => shareArticle(selectedArticle)}
                      className="flex items-center gap-2 text-navy-600 dark:text-yellow-400 hover:text-navy-700 dark:hover:text-yellow-300 transition-colors"
                    >
                      <Share2 className="w-4 h-4" />
                      Share
                    </button>
                  </div>
                  
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {Math.ceil(selectedArticle.content.length / 1000)} minute read
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </>
  );
};

export default News;