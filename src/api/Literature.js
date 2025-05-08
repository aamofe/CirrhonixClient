import service from "@/http";

const url = {
  list: "/literature/list",
  detail: (id) => `/literature/detail/${id}`,
  interaction: "/literature/interaction",
  collections: "/literature/collection",
  collection: (id) => `/literature/collection/${id}`,
  authors: "/literature/authors",
  journals: "/literature/journals",
  search: "/search",
  graphData: "/literature/graph/data",
  litTree: (id) => `/literature/graph/literature-tree/${id}`,
  conceptNet: "/literature/graph/concept-network",
};

export default class Literature {
  static async search(query, page = 1, size = 20) {
    return service.get(url.basic, {
      params: {
        q: query,
        page,
        size,
      },
    });
  }
  /**
   * 获取文献列表，支持分页和筛选
   * @param {Object} params - 查询参数
   * @param {string} [params.type] - 按文献类型筛选
   * @param {string} [params.language] - 按语言筛选
   * @param {number} [params.journal_id] - 按期刊ID筛选
   * @param {number} [params.author_id] - 按作者ID筛选
   * @param {string} [params.keyword] - 按关键词筛选(标题或摘要)
   * @param {string} [params.sort='-publication_date'] - 排序方式
   * @param {number} [params.page=1] - 页码
   * @param {number} [params.size=20] - 每页数量
   * @returns {Promise} API响应
   */
  static async list(params = {}) {
    return service.get(url.list, { params });
  }

  /**
   * 获取文献详情
   * @param {number} id - 文献ID
   * @returns {Promise} API响应
   */
  static async detail(id) {
    return service.get(url.detail(id));
  }

  /**
   * 更新文献信息（仅管理员）
   * @param {number} id - 文献ID
   * @param {Object} data - 更新数据
   * @returns {Promise} API响应
   */
  static async updateDetail(id, data) {
    return service.put(url.detail(id), data);
  }

  /**
   * 删除文献（仅管理员）
   * @param {number} id - 文献ID
   * @returns {Promise} API响应
   */
  static async deleteDetail(id) {
    return service.delete(url.detail(id));
  }

  /**
   * 创建或更新用户与文献的交互信息
   * @param {Object} data - 交互数据
   * @param {number} data.literature_id - 文献ID
   * @param {boolean} [data.is_read] - 是否已读
   * @param {boolean} [data.is_favorite] - 是否收藏
   * @param {string} [data.personal_notes] - 个人笔记
   * @returns {Promise} API响应
   */
  static async createInteraction(data) {
    return service.post(url.interaction, data);
  }

  /**
   * 获取用户的所有文献交互记录
   * @param {Object} params - 查询参数
   * @param {number} [params.page=1] - 页码
   * @param {number} [params.size=20] - 每页数量
   * @returns {Promise} API响应
   */
  static async getInteractions(params = {}) {
    return service.get(url.interaction, { params });
  }

  /**
   * 获取用户的所有收藏夹
   * @param {Object} params - 查询参数
   * @param {number} [params.page=1] - 页码
   * @param {number} [params.size=20] - 每页数量
   * @returns {Promise} API响应
   */
  static async getCollections(params = {}) {
    return service.get(url.collections, { params });
  }

  /**
   * 创建新的收藏夹
   * @param {Object} data - 收藏夹数据
   * @param {string} data.name - 收藏夹名称
   * @param {string} [data.description] - 收藏夹描述
   * @param {Array<number>} [data.literature_ids] - 要添加的文献ID列表
   * @returns {Promise} API响应
   */
  static async createCollection(data) {
    return service.post(url.collections, data);
  }

  /**
   * 获取特定收藏夹详情
   * @param {number} id - 收藏夹ID
   * @returns {Promise} API响应
   */
  static async getCollection(id) {
    return service.get(url.collection(id));
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
    return service.put(url.collection(id), data);
  }

  /**
   * 删除收藏夹
   * @param {number} id - 收藏夹ID
   * @returns {Promise} API响应
   */
  static async deleteCollection(id) {
    return service.delete(url.collection(id));
  }

  /**
   * 获取作者列表
   * @param {Object} params - 查询参数
   * @param {string} [params.name] - 按作者姓名搜索
   * @param {string} [params.affiliation] - 按机构搜索
   * @param {string} [params.sort='name'] - 排序方式（'publications'或'name'）
   * @param {number} [params.page=1] - 页码
   * @param {number} [params.size=20] - 每页数量
   * @returns {Promise} API响应
   */
  static async getAuthors(params = {}) {
    return service.get(url.authors, { params });
  }

  /**
   * 获取期刊列表
   * @param {Object} params - 查询参数
   * @param {string} [params.name] - 按期刊名称搜索
   * @param {string} [params.sort='name'] - 排序方式（'impact_factor'或'name'）
   * @param {number} [params.page=1] - 页码
   * @param {number} [params.size=20] - 每页数量
   * @returns {Promise} API响应
   */
  static async getJournals(params = {}) {
    return service.get(url.journals, { params });
  }

  /**
   * 获取知识图谱数据
   * @param {Object} params - 查询参数
   * @param {string} [params.node_type] - 按节点类型筛选
   * @param {number} [params.limit=100] - 节点数量限制
   * @returns {Promise} API响应
   */
  static async getGraphData(params = {}) {
    return service.get(url.graphData, { params });
  }

  /**
   * 获取特定文献的关系树
   * @param {number} id - 文献ID
   * @returns {Promise} API响应
   */
  static async getLitTree(id) {
    return service.get(url.litTree(id));
  }

  /**
   * 获取概念网络数据
   * @param {Object} params - 查询参数
   * @param {string} [params.keyword] - 按关键词筛选概念
   * @param {number} [params.limit=50] - 节点数量限制
   * @returns {Promise} API响应
   */
  static async getConceptNet(params = {}) {
    return service.get(url.conceptNet, { params });
  }
}
