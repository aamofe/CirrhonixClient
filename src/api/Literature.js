import service from '@/http'

const url = {
  list: '/literature/list',
  detail: (id) => `/literature/detail/${id}`,
  interaction: '/literature/interaction',
  interactionDetail: (id) => `/literature/interaction/${id}`,
  collections: '/literature/collections',
  collection: (id) => `/literature/collection/${id}`,
  updateCollections: (id) => `/literature/collections/update/${id}`,
  search: '/literature/search',
  uploadSinglePaper: '/literature/upload',
  uploadBatchPaper: '/literature/batch',
  translate: '/literature/translate',
  analyze: '/literature/analyze',
  analyzeDetail: (atask_id) => `/literature/analyze/${atask_id}`,
  analyzeList: '/literature/analyze/list',
  analyzeRecent: '/literature/analyze/recent',
}
export default class Literature {
  static async getAnalyzeRecent() {
    return service.get(url.analyzeRecent())
  }

  static async analyzeLiterature(literature_id) {
    return service.post(url.analyze, {
      literature_id,
    })
  }
  static async getAnalyzeList(
    status = null,
    literature_id = null,
    recent = nul
  ) {
    const params = {}
    if (status) params.status = status
    if (literature_id) params.literature_id = literature_id
    if (recent === true) params.recent = 'true'
    return service.get(url.analyzeList, { params })
  }

  static async getAnalyzeDetail(atask_id) {
    return service.get(url.analyzeDetail(atask_id))
  }

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
  static async translate(data) {
    return service.post(url.translate, data)
  }
  static async detail(id) {
    return service.get(url.detail(id))
  }
  static async updateDetail(id, data) {
    return service.put(url.detail(id), data)
  }
  static async deleteDetail(id) {
    return service.delete(url.detail(id))
  }
  static async createInteraction(data) {
    return service.post(url.interaction, data)
  }
  static async getInteraction(literatureId) {
    return service.get(url.interactionDetail(literatureId))
  }

  static async getInteractions() {
    return service.get(url.interaction)
  }
  static async getCollections(literatureId = null) {
    if (literatureId) {
      return service.get(`${url.collections}/${literatureId}`)
    }
    return service.get(url.collections)
  }

  static async createCollection(data) {
    return service.post(url.collections, data)
  }
  static async getCollection(id) {
    return service.get(url.collection(id))
  }
  static async updateCollection(id, data) {
    return service.put(url.collection(id), data)
  }
  static async deleteCollection(id) {
    return service.delete(url.collection(id))
  }
  static async updateLiteratureCollections(literatureId, data) {
    return service.post(`/literature/collections/update/${literatureId}`, data)
  }
  static async uploadPaper(formData) {
    return service.post(url.uploadSinglePaper, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  }
  static async uploadBatchPaper(formData) {
    return service.post(url.uploadBatchPaper, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  }
}
