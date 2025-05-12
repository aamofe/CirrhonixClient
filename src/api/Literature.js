import service from '@/http'

const url = {
  list: '/literature/list',
  detail: (id) => `/literature/detail/${id}`,
  interaction: '/literature/interaction',
  interactionDetail: (id) => `/literature/interaction/${id}`, // 新增：获取特定文献的交互
  collections: '/literature/collections',
  collection: (id) => `/literature/collection/${id}`,
  updateCollections: (id) => `/literature/collections/update/${id}`, // 新增：更新文献与收藏夹关系
  search: '/literature/search',
  uploadSinglePaper: '/literature/upload',
  uploadBatchPaper: '/literature/batch',
  translate: '/literature/translate',
}
export default class Literature {
  static async search(query, page = 1, size = 20, sortBy = 'relevance') {
    return service.get(url.search, {
      params: {
        q: query,
        page,
        size,
        sort_by: sortBy,
      },
    })
  }

  static async list(params = {}) {
    return service.get(url.list, { params })
  }

  /**
   * 翻译文本
   * @param {Object} data - 包含待翻译文本
   * @param {string} data.text - 待翻译文本
   * @returns {Promise} API响应
   */
  static async translate(data) {
    return service.post(url.translate, data)
  }

  /**
   * 获取文献详情
   * @param {number} id - 文献ID
   * @returns {Promise} API响应
   */
  static async detail(id) {
    return service.get(url.detail(id))
  }

  /**
   * 更新文献信息（仅管理员）
   * @param {number} id - 文献ID
   * @param {Object} data - 更新数据
   * @returns {Promise} API响应
   */
  static async updateDetail(id, data) {
    return service.put(url.detail(id), data)
  }

  /**
   * 删除文献（仅管理员）
   * @param {number} id - 文献ID
   * @returns {Promise} API响应
   */
  static async deleteDetail(id) {
    return service.delete(url.detail(id))
  }

  /**
   * @param {Object} data - 交互数据
   * @param {number} data.literature_id - 文献ID
   * @param {boolean} [data.is_read] - 是否已读
   * @param {string} [data.personal_notes] - 个人笔记
   * @returns {Promise} API响应
   */
  static async createInteraction(data) {
    return service.post(url.interaction, data)
  }

  /**
   * 获取特定文献的交互记录
   * @param {number} literatureId - 文献ID
   * @returns {Promise} API响应
   */
  static async getInteraction(literatureId) {
    return service.get(url.interactionDetail + literatureId)
  }
  static async getInteractions() {
    return service.get(url.interaction)
  }

  /**
   * 获取用户的所有收藏夹, 如果提供了文献ID，会返回该文献是否在每个收藏夹中
   * @param {number} [literatureId] - 文献ID (可选)
   * @returns {Promise} API响应
   */
  static async getCollections(literatureId = null) {
    if (literatureId) {
      return service.get(`${url.collections}/${literatureId}`)
    }
    return service.get(url.collections)
  }

  /**
   * 创建新的收藏夹
   * @param {Object} data - 收藏夹数据
   * @param {string} data.name - 收藏夹名称
   * @param {string} [data.description] - 收藏夹描述
   * @returns {Promise} API响应
   */
  static async createCollection(data) {
    return service.post(url.collections, data)
  }

  /**
   * 获取特定收藏夹详情
   * @param {number} id - 收藏夹ID
   * @returns {Promise} API响应
   */
  static async getCollection(id) {
    return service.get(url.collection(id))
  }

  /**
   * 更新收藏夹信息
   * @param {number} id - 收藏夹ID
   * @param {Object} data - 更新数据
   * @param {string} [data.name] - 收藏夹名称
   * @param {string} [data.description] - 收藏夹描述
   * @param {Array<number>} [data.add_literature_ids] - 要添加的文献ID列表
   * @param {Array<number>} [data.remove_literature_ids] - 要移除的文献ID列表
   * @returns {Promise} API响应
   */
  static async updateCollection(id, data) {
    return service.put(url.collection(id), data)
  }

  /**
   * 删除收藏夹
   * @param {number} id - 收藏夹ID
   * @returns {Promise} API响应
   */
  static async deleteCollection(id) {
    return service.delete(url.collection(id))
  }

  /**
   * 更新文献与收藏夹的关系
   * @param {number} literatureId - 文献ID
   * @param {Object} data - 更新数据
   * @param {Array<number>} data.collection_ids - 选中的收藏夹ID数组
   * @returns {Promise} API响应
   */
  static async updateLiteratureCollections(literatureId, data) {
    return service.post(`/literature/collections/update/${literatureId}`, data)
  }

  /**
   * 上传单个文献PDF文件
   * @param {FormData} formData
   * @returns {Promise}
   */
  static async uploadPaper(formData) {
    return service.post(url.uploadSinglePaper, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  }

  /**
   * 批量上传文献PDF文件
   * @param {FormData} formData
   * @returns {Promise}
   */
  static async uploadBatchPaper(formData) {
    return service.post(url.uploadBatchPaper, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  }
}
