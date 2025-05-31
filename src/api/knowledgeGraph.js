import service from '@/http'

const url = {
  importGraph: '/kgraph/import/',
  exportGraph: '/kgraph/export/',
  getEntities: '/kgraph/entities/',
  getEntityDetail: (id) => `/kgraph/entities/${id}/`,
  getRelations: '/kgraph/relations/',
  getRelationDetail: (id) => `/kgraph/relations/${id}/`,
  batchCreateRelations: '/kgraph/relations/batch/',
  getGraph: '/kgraph/graph/',
  getSubgraph: (id) => `/kgraph/graph/${id}/`,
  statistics: '/kgraph/stats/',
}

export default class KnowledgeGraph {
  /**
   * 导入知识图谱数据（支持批量导入、单个实体、单个关系）
   * @param {Object} data - 导入数据结构
   * @returns {Promise}
   */
  static async importGraph(data) {
    return service.post(url.importGraph, data)
  }

  /**
   * 导出知识图谱数据
   * @param {Object} params - 查询参数
   * @param {string} [params.format='json'] - 导出格式
   * @returns {Promise}
   */
  static async exportGraph(params = {}) {
    return service.get(url.exportGraph, { params })
  }

  /**
   * 获取实体列表
   * @param {Object} params - 查询参数
   * @returns {Promise}
   */
  static async getEntities(params = {}) {
    return service.get(url.getEntities, { params })
  }

  /**
   * 获取实体详情
   * @param {number} entityId - 实体ID
   * @returns {Promise}
   */
  static async getEntityDetail(entityId) {
    return service.get(url.getEntityDetail(entityId))
  }

  /**
   * 获取关系列表
   * @param {Object} params - 查询参数
   * @returns {Promise}
   */
  static async getRelations(params = {}) {
    return service.get(url.getRelations, { params })
  }

  /**
   * 获取关系详情
   * @param {number} relationId - 关系ID
   * @returns {Promise}
   */
  static async getRelationDetail(relationId) {
    return service.get(url.getRelationDetail(relationId))
  }

  /**
   * 批量创建关系
   * @param {Object} data - 请求体，包含 relations 数组
   * @returns {Promise}
   */
  static async batchCreateRelations(data) {
    return service.post(url.batchCreateRelations, data)
  }

  /**
   * 获取完整图谱
   * @param {Object} params - 查询参数
   * @returns {Promise}
   */
  static async getGraph(params = {}) {
    return service.get(url.getGraph, { params })
  }

  /**
   * 获取子图（以某个实体为中心）
   * @param {number} entityId - 实体ID
   * @param {Object} params - 查询参数
   * @returns {Promise}
   */
  static async getSubgraph(entityId, params = {}) {
    return service.get(url.getSubgraph(entityId), { params })
  }

  /**
   * 获取统计信息
   * @param {Object} params - 查询参数
   * @returns {Promise}
   */
  static async statistics(params = {}) {
    return service.get(url.statistics, { params })
  }
}
