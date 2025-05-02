import service from "@/http";

const url = {
  basic: "/search/basic",
  advanced: "/search/advanced",
  semantic: "/search/semantic",
  history: "/search/history",
  keywords: "/search/keywords",
};

export default class Search {
  /**
   * Basic search functionality
   * @param {string} query - Search query text
   * @param {number} page - Page number (default: 1)
   * @param {number} size - Results per page (default: 20)
   * @returns {Promise} - API response
   */
  static async basicSearch(query, page = 1, size = 20) {
    return service.get(url.basic, {
      params: {
        q: query,
        page,
        size,
      },
    });
  }

  /**
   * Advanced search functionality
   * @param {Object} filters - Search filters
   * @param {string} filters.title - Title filter
   * @param {string} filters.abstract - Abstract filter
   * @param {string} filters.author - Author name filter
   * @param {string} filters.journal - Journal name filter
   * @param {string} filters.type - Publication type filter
   * @param {string} filters.start_date - Start date (YYYY-MM-DD)
   * @param {string} filters.end_date - End date (YYYY-MM-DD)
   * @param {string} filters.language - Language filter
   * @param {number} page - Page number (default: 1)
   * @param {number} size - Results per page (default: 20)
   * @returns {Promise} - API response
   */
  static async advancedSearch(filters = {}, page = 1, size = 20) {
    const params = {
      page,
      size,
      ...filters,
    };

    return service.get(url.advanced, {
      params,
    });
  }

  /**
   * Semantic search functionality
   * @param {string} query - Semantic search query text
   * @param {number} page - Page number (default: 1)
   * @param {number} size - Results per page (default: 20)
   * @returns {Promise} - API response
   */
  static async semanticSearch(query, page = 1, size = 20) {
    return service.get(url.semantic, {
      params: {
        q: query,
        page,
        size,
      },
    });
  }

  /**
   * Get user search history
   * @param {number} page - Page number (default: 1)
   * @param {number} size - Results per page (default: 20)
   * @returns {Promise} - API response
   */
  static async getSearchHistory(page = 1, size = 20) {
    return service.get(url.history, {
      params: {
        page,
        size,
      },
    });
  }

  /**
   * Get keywords list with optional filtering
   * @param {Object} options - Filter options
   * @param {string} options.keyword - Filter keywords by text
   * @param {string} options.category - Filter by category
   * @param {string} options.sort - Sort order (default: '-weight')
   * @param {number} page - Page number (default: 1)
   * @param {number} size - Results per page (default: 20)
   * @returns {Promise} - API response
   */
  static async getKeywords(options = {}, page = 1, size = 20) {
    const params = {
      page,
      size,
      sort: options.sort || "-weight",
      ...options,
    };

    return service.get(url.keywords, {
      params,
    });
  }
}
