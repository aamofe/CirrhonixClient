import service from '@/http'

const url = {
  sourceList: '/crawl/sources',
  crawlList: '/crawl/tasks',
  crawlDetail: '/crawl/tasks',
  createTask: '/crawl/tasks/create',
  scheduleList: '/crawl/schedules/',
  scheduleDetail: (scheduleId) => `/crawl/schedules/${scheduleId}/`,
  toggleSchedule: (scheduleId) => `/crawl/schedules/${scheduleId}/toggle/`,
  triggerSchedule: (scheduleId) => `/crawl/schedules/${scheduleId}/trigger/`,
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
  static async getScheduleList() {
    return service.get(url.scheduleList);
  }
  static async createSchedule(requestData) {
    return service.post(url.scheduleList, {
      name: requestData.name,
      description: requestData.description,
      data_source_ids: requestData.data_source_ids,
      interval: requestData.interval,
      query_params: requestData.query_params,
    });
  }
  static async getScheduleDetail(scheduleId) {
    return service.get(url.scheduleDetail(scheduleId))
  }
  static async updateSchedule(scheduleId, requestData) {
    return service.put(url.scheduleDetail(scheduleId), {
      name: requestData.name,
      description: requestData.description,
      data_source_ids: requestData.data_source_ids,
      interval: requestData.interval,
      is_active: requestData.is_active,
      query_params: requestData.query_params,
    });
  }
  static async deleteSchedule(scheduleId) {
    return service.delete(url.scheduleDetail(scheduleId));
  }
  static async toggleSchedule(scheduleId, isActive) {
    return service.post(url.toggleSchedule(scheduleId), {
      is_active: isActive,
    });
  }
  static async triggerSchedule(scheduleId) {
    return service.post(url.triggerSchedule(scheduleId));
  }
}
