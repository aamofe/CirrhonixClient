import service from "@/http";
const url = {
  sourceList: "/crawl/sources",
  crawlList: "/crawl/sources",
  crawlDetail: "/crawl/sources",
  createTask: "/crawl/tasks/create",
};

export default class Crawling {
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
}
