import service from '@/http'

const url = {
  exportGraph: '/kgraph/export/',
  getEntities: '/kgraph/entities/',
  getEntityDetail: (id) => `/kgraph/entities/${id}/`,
  getRelations: '/kgraph/relations/',
  getRelationDetail: (id) => `/kgraph/relations/${id}/`,
  getGraph: '/kgraph/graph/',
  getSubgraph: (id) => `/kgraph/graph/${id}/`,
  statistics: '/kgraph/stats/',
  createRelation: '/kgraph/relations/create/',
  deleteRelation: '/kgraph/relations/delete/',
}

export default class KnowledgeGraph {
  static async exportGraph(params = {}) {
    return service.get(url.exportGraph, { params })
  }
  static async getEntities(params = {}) {
    return service.get(url.getEntities, { params })
  }

  static async getEntityDetail(entityId) {
    return service.get(url.getEntityDetail(entityId))
  }
  static async getRelations(params = {}) {
    return service.get(url.getRelations, { params })
  }
  static async getRelationDetail(relationId) {
    return service.get(url.getRelationDetail(relationId))
  }
  static async getGraph(params = {}) {
    return service.get(url.getGraph, { params })
  }
  static async getSubgraph(entityId, params = {}) {
    return service.get(url.getSubgraph(entityId), { params })
  }
  static async statistics(params = {}) {
    return service.get(url.statistics, { params })
  }

  static async createRelation(relationData) {
    return service.post(url.createRelation, {
      source_id: relationData.source_id,
      target_id: relationData.target_id,
      factor_name: relationData.factor_name,
      factor_type: relationData.factor_type,
      effect: relationData.effect,
      literature_name: relationData.literature,
      description: relationData.description,
    })
  }

  // 删除关系
  static async deleteRelation(relationId) {
    return service.delete(url.deleteRelation, {
      params: {
        relation_id: relationId,
      },
    })
  }
}
