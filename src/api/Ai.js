import service from '@/http'

const url = {
  aiQuery: '/ai/query',
  summarize: (id) => `/ai/summarize/${id}`,
  translate: '/ai/translate',
  recommend: (id) => `/ai/recommendations/${id}`,
  feedback: (id) => `/ai/feedback/${id}`,
  // batchSummarize: "/ai/batch_summarize", // 注意：API中未定义此端点
  // semanticSearch: "/ai/semantic_search", // 注意：API中未定义此端点
}

export default class AI {
  /**
   * 向AI发送查询请求
   * @param {Object} data - 查询相关数据
   * @param {string} data.query - 发送给AI的文本查询
   * @param {Array<number>} [data.context_literature_ids] - 可选的文献ID列表作为上下文
   * @param {string} [data.system_message] - 可选的系统消息，用于指导AI响应
   * @param {number} [data.temperature] - 可选的温度参数 (0.0-1.0)
   * @returns {Promise} API响应
   */
  static async query(data) {
    return service.post(url.aiQuery, data)
  }

  /**
   * 获取或生成文献摘要
   * @param {number} literatureId - 要摘要的文献ID
   * @param {Object} params - 查询参数
   * @param {boolean} [params.regenerate=false] - 是否重新生成摘要
   * @param {string} [params.language='zh-cn'] - 摘要的目标语言
   * @param {number} [params.max_length=300] - 摘要的最大长度
   * @returns {Promise} API响应
   */
  static async summarize(literatureId, params = {}) {
    return service.get(url.summarize(literatureId), {
      params: {
        ...params,
        regenerate: true,
      },
    })
  }

  /**
   * 翻译文本
   * @param {Object} data - 翻译相关数据
   * @param {string} data.text - 要翻译的文本
   * @param {string} [data.source_language='en'] - 源语言代码
   * @param {string} [data.target_language='zh-cn'] - 目标语言代码
   * @param {number} [data.literature_id] - 可选的关联文献ID
   * @returns {Promise} API响应
   */
  static async translate(data) {
    return service.post(url.translate, data)
  }

  /**
   * 获取文献推荐
   * @param {number} literatureId - 基础文献ID
   * @param {Object} params - 查询参数
   * @param {number} [params.count=5] - 返回的推荐数量
   * @returns {Promise} API响应
   */
  static async recommend(literatureId, params = {}) {
    return service.get(url.recommend(literatureId), { params })
  }

  /**
   * 提供AI查询反馈
   * @param {number} queryId - AI查询的ID
   * @param {Object} data - 反馈数据
   * @param {number} data.rating - 评分 (1-5)
   * @param {string} [data.feedback_text] - 可选的反馈文本
   * @returns {Promise} API响应
   */
  static async feedback(queryId, data) {
    return service.post(url.feedback(queryId), data)
  }

  /**
   * 批量生成文献摘要
   * @param {Object} data - 批量摘要相关数据
   * @param {Array<number>} data.literature_ids - 要摘要的文献ID列表
   * @param {string} [data.language='zh-cn'] - 摘要的目标语言
   * @returns {Promise} API响应
   */
  static async batchSummarize(data) {
    return service.post(url.batchSummarize, data)
  }

  /**
   * 执行语义搜索
   * @param {Object} data - 搜索相关数据
   * @param {string} data.query - 搜索查询文本
   * @param {Object} [data.filter_params={}] - 搜索的可选过滤器（标签、日期范围等）
   * @param {number} [data.limit=10] - 返回的最大结果数
   * @returns {Promise} API响应
   */
  static async semanticSearch(data) {
    return service.post(url.semanticSearch, data)
  }
}
