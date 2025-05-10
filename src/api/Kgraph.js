import service from "@/http";

const url = {
  getGraph: "/kgraph/",
  statistics: "/kgraph/statistics/",
  processPdf: "/kgraph/process-pdf/",
  initialize: "/kgraph/initialize/",
};

export default class KnowledgeGraph {
  /**
   * 获取知识图谱数据
   * @param {Object} params - 过滤参数
   * @param {string} [params.infection] - 感染部位
   * @param {string} [params.pathogen_type] - 病原体类型
   * @param {number} [params.min_frequency] - 最低频率
   * @returns {Promise}
   */
  static async getGraph(params = {}) {
    return service.get(url.getGraph, { params });
  }

  /**
   * 获取统计数据
   * @returns {Promise}
   */
  static async statistics() {
    return service.get(url.statistics);
  }

  /**
   * 处理 PDF 文献
   * @param {string} pdfId - 文献ID
   * @returns {Promise}
   */
  static async processPdf(pdfId) {
    return service.post(url.processPdf, { pdf_id: pdfId });
  }

  /**
   * 初始化知识图谱基础数据
   * @returns {Promise}
   */
  static async initialize() {
    return service.post(url.initialize);
  }
}
