import service from '@/http'

const url = {
    exportGraph: '/kgraph/export/',
    getEntities: '/kgraph/entities/',
    getEntityDetail: (id) => `/kgraph/entities/${id}/`,
    getRelations: '/kgraph/relations/',
    getRelationDetail: (id) => `/kgraph/relations/${id}/`,
    getGraph: '/kgraph/graph/',
    statistics: '/kgraph/stats/',
    createRelation: '/kgraph/relations/create/',
    deleteRelation: '/kgraph/relations/delete/',
    updateRelation: '/kgraph/relations/update/',
    getPendingReviews: '/kgraph/reviews/pending/',
    reviewRelation: '/kgraph/reviews/review/',
    approveAllReviews: '/kgraph/reviews/approve-all/',
    getMyReviews: '/kgraph/reviews/my/',
    withdrawReview: '/kgraph/reviews/withdraw/',
    updateReview: '/kgraph/reviews/update/',
    getRelationHistory: '/kgraph/history/',
    
    // ==================== 新增的4个接口 ====================
    graphOverview: '/kgraph/overview/',
    expandEntity: (entityId) => `/kgraph/entity/${entityId}/expand/`,
    edgeDetails: (sourceId, targetId) => `/kgraph/edge/${sourceId}/${targetId}/`,
    searchEntities: '/kgraph/search/',
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
    static async statistics(params = {}) {
        return service.get(url.statistics, { params })
    }
    static async createRelation(relationData) {
        const payload = {
            source_id: relationData.source_id,
            target_id: relationData.target_id,
            relation_type: relationData.relation_type ,
            description: relationData.description || '',
            source_mentions: relationData.source_mentions || [],
            target_mentions: relationData.target_mentions || [],
        }
        
        if (relationData.literature_id) {
            payload.literature_id = relationData.literature_id
        } else if (relationData.literature && typeof relationData.literature === 'object' && relationData.literature.id) {
            payload.literature_id = relationData.literature.id
        }
        
        return service.post(url.createRelation, payload)
    }
    static async deleteRelation(relationId) {
        return service.delete(url.deleteRelation, {
            params: {
                relation_id: relationId,
            },
        })
    }
    static async updateRelation(updateData) {
        const payload = {
            relation_id: updateData.relation_id,
            relation_type: updateData.relation_type ,
            description: updateData.description || undefined,
            source_mentions: updateData.source_mentions || undefined,
            target_mentions: updateData.target_mentions || undefined,
        }
        
        if (updateData.literature_id) {
            payload.literature_id = updateData.literature_id
        } else if (updateData.literature && typeof updateData.literature === 'object' && updateData.literature.id) {
            payload.literature_id = updateData.literature.id
        }
        
        // 移除 undefined 字段
        Object.keys(payload).forEach(key => {
            if (payload[key] === undefined) {
                delete payload[key]
            }
        })
        
        return service.put(url.updateRelation, payload)
    }
    static async getPendingReviews() {
        return service.get(url.getPendingReviews)
    }
    // 管理员审核 { review_id, action: 'approve'/'reject', review_message }
    static async reviewRelation(reviewData) {
        return service.post(url.reviewRelation, {
            review_id: reviewData.review_id,
            action: reviewData.action,
            review_message: reviewData.review_message || '',
        })
    }
    // 管理员一键通过所有待审核
    static async approveAllReviews() {
        return service.post(url.approveAllReviews)
    }
    // 用户查看自己的审核记录
    static async getMyReviews() {
        return service.get(url.getMyReviews)
    }
    // 用户撤回审核 { review_id }
    static async withdrawReview(reviewId) {
        return service.post(url.withdrawReview, {
            review_id: reviewId,
        })
    }
    static async updateReview(updateData) {
        // 新后端字段：review_id, relation_type, source_mentions, target_mentions, description, literature_id
        const payload = {
            review_id: updateData.review_id,
            relation_type: updateData.relation_type || updateData.effect || undefined,
            description: updateData.description || undefined,
            source_mentions: updateData.source_mentions || undefined,
            target_mentions: updateData.target_mentions || undefined,
        }
        
        // 如果有 literature_id，使用它；否则尝试从 literature_name 或 literature 对象获取
        if (updateData.literature_id) {
            payload.literature_id = updateData.literature_id
        } else if (updateData.literature && typeof updateData.literature === 'object' && updateData.literature.id) {
            payload.literature_id = updateData.literature.id
        }
        
        // 移除 undefined 字段
        Object.keys(payload).forEach(key => {
            if (payload[key] === undefined) {
                delete payload[key]
            }
        })
        
        return service.put(url.updateReview, payload)
    }
    static async getRelationHistory() {
        return service.get(url.getRelationHistory)
    }

    // ==================== 新增的4个分层加载接口 ====================
    
    /**
     * 初始概览 - 只返回 Level 1-2 的节点和聚合边信息
     * @param {Object} params - { type?: string, relation_type?: string }
     * @returns {Promise} { nodes: [], edges: [], statistics: {} }
     */
    static async graphOverview(params = {}) {
        return service.get(url.graphOverview, { params })
    }

    /**
     * 展开节点 - 加载指定节点关联的 Level 3 节点和边
     * @param {number} entityId - 要展开的节点ID
     * @returns {Promise} { center_entity: {}, new_nodes: [], edges: [] }
     */
    static async expandEntity(entityId) {
        return service.get(url.expandEntity(entityId))
    }

    /**
     * 边详情 - 获取指定边的所有关系
     * @param {number} sourceId - 源节点ID
     * @param {number} targetId - 目标节点ID
     * @returns {Promise} { source_entity: {}, target_entity: {}, factors: [] }
     */
    static async edgeDetails(sourceId, targetId) {
        return service.get(url.edgeDetails(sourceId, targetId))
    }

    /**
     * 搜索实体 - 按关键词搜索，返回匹配的子图
     * @param {string} keyword - 搜索关键词
     * @returns {Promise} { nodes: [], edges: [], matched_ids: [] }
     */
    static async searchEntities(keyword) {
        return service.get(url.searchEntities, { 
            params: { q: keyword } 
        })
    }
}