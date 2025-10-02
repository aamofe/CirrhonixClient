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
    updateRelation: '/kgraph/relations/update/',
    getPendingReviews: '/kgraph/reviews/pending/',
    reviewRelation: '/kgraph/reviews/review/',
    approveAllReviews: '/kgraph/reviews/approve-all/',
    getMyReviews: '/kgraph/reviews/my/',
    withdrawReview: '/kgraph/reviews/withdraw/',
    updateReview: '/kgraph/reviews/update/',
    getRelationHistory: '/kgraph/history/',
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
            factor_abbreviation: relationData.factor_abbreviation,
            effect: relationData.effect,
            literature_name: relationData.literature_name || relationData.literature,
            description: relationData.description,
        })
    }
    static async deleteRelation(relationId) {
        return service.delete(url.deleteRelation, {
            params: {
                relation_id: relationId,
            },
        })
    }
    static async updateRelation(updateData) {
        return service.put(url.updateRelation, {
            relation_id: updateData.relation_id,
            source_id: updateData.source_id,
            target_id: updateData.target_id,
            factor_name: updateData.factor_name,
            factor_type: updateData.factor_type,
            factor_abbreviation: updateData.factor_abbreviation,
            effect: updateData.effect,
            literature_name: updateData.literature_name || updateData.literature,
            description: updateData.description,
        })
    }
    // 管理员获取待审核列表
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
    // 用户修改审核记录 { review_id, ...updateData }
    static async updateReview(updateData) {
        return service.put(url.updateReview, {
            review_id: updateData.review_id,
            source_id: updateData.source_id,
            target_id: updateData.target_id,
            factor_name: updateData.factor_name,
            factor_type: updateData.factor_type,
            factor_abbreviation: updateData.factor_abbreviation,
            effect: updateData.effect,
            literature_name: updateData.literature_name || updateData.literature,
            description: updateData.description,
        })
    }
    static async getRelationHistory() {
        return service.get(url.getRelationHistory)
    }
}