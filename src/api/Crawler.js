import service from '@/http'

const url = {
  sourceList: '/crawl/sources',
  crawlList: '/crawl/tasks',
  crawlDetail: '/crawl/tasks',
  createTask: '/crawl/tasks/create',
}

export default class Crawling {
  static async getSourceList() {
    return service.get(url.sourceList)
  }

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
    })
  }

  static async getCrawlDetail(taskId) {
    return service.get(`${url.crawlDetail}/${taskId}`)
  }

  static async createTask(requestData) {
    return service.post(url.createTask, {
      data_source_ids: requestData.data_source_ids,
      end_date: requestData.end_date,
      start_date: requestData.start_date,
      keywords: requestData.keywords,
      max_results: requestData.max_results,
    })
  }
}
