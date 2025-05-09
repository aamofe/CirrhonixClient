// src/api/Crawling.js
import service from "@/http";

const url = {
  sourceList: "/crawl/sources",
  crawlList: "/crawl/tasks",
  crawlDetail: "/crawl/tasks",
  createTask: "/crawl/tasks/create",
  uploadSinglePaper: "/api/papers/upload",
  uploadBatchPaper: "/api/papers/batch-upload",
  paperInfoByDOI: "/api/papers/info-by-doi",
  paperInfoByPMID: "/api/papers/info-by-pmid",
  extractMetadata: "/api/papers/extract-metadata",
  userPapers: "/api/papers/user-papers",
  deletePaper: "/api/papers",
};

export default class Crawling {
  // ====================== 爬虫相关 ======================

  /**
   * 获取数据源列表
   * @returns {Promise} - API response
   */
  static async getSourceList() {
    return service.get(url.sourceList);
  }

  /**
   * 获取爬虫任务列表
   * @param {string} [status] - Task status filter (optional)
   * @param {number} [sourceId] - Data source ID filter (optional)
   * @param {number} page - Page number (default: 1)
   * @param {number} size - Results per page (default: 20)
   * @returns {Promise} - API response
   */
  static async getCrawlList(
    status = null,
    sourceId = null,
    page = 1,
    size = 20
  ) {
    return service.get(url.crawlList, {
      params: {
        status,
        source_id: sourceId,
        page,
        size,
      },
    });
  }

  /**
   * 获取单个爬虫任务详情
   * @param {number} taskId - The ID of the task
   * @returns {Promise} - API response
   */
  static async getCrawlDetail(taskId) {
    return service.get(`${url.crawlDetail}/${taskId}`);
  }

  /**
   * 创建并启动新的爬虫任务
   * @param {number} dataSourceId - ID of the data source
   * @param {Object} queryParams - Query parameters for the task (optional)
   * @returns {Promise} - API response
   */
  static async createTask(
    dataSourceId,
    queryParams = { fields_of_study: "cirrhosis" }
  ) {
    return service.post(url.createTask, {
      data_source_id: dataSourceId,
      query_params: queryParams,
    });
  }

  // ====================== 文献相关 ======================

  /**
   * 上传单个文献PDF文件
   * @param {FormData} formData
   * @returns {Promise}
   */
  static async uploadPaper(formData) {
    return service.post(url.uploadSinglePaper, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  }

  /**
   * 批量上传文献PDF文件
   * @param {FormData} formData
   * @returns {Promise}
   */
  static async uploadBatchPaper(formData) {
    return service.post(url.uploadBatchPaper, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  }

  /**
   * 从DOI获取文献信息
   * @param {string} doi
   * @returns {Promise}
   */
  static async getPaperInfoByDOI(doi) {
    return service.get(url.paperInfoByDOI, {
      params: { doi },
    });
  }

  /**
   * 从PMID获取文献信息
   * @param {string} pmid
   * @returns {Promise}
   */
  static async getPaperInfoByPMID(pmid) {
    return service.get(url.paperInfoByPMID, {
      params: { pmid },
    });
  }

  /**
   * 从PDF提取元数据
   * @param {FormData} formData
   * @returns {Promise}
   */
  static async extractMetadataFromPDF(formData) {
    return service.post(url.extractMetadata, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  }

  /**
   * 获取用户上传的文献列表
   * @param {Object} params - page, limit, sort, keyword
   * @returns {Promise}
   */
  static async getUserPapers(params) {
    return service.get(url.userPapers, {
      params,
    });
  }

  /**
   * 删除上传的文献
   * @param {string} paperId
   * @returns {Promise}
   */
  static async deletePaper(paperId) {
    return service.delete(`${url.deletePaper}/${paperId}`);
  }
}
