<template>
  <div class="card upload-paper">
    <h3>上传文献</h3>
    <p class="description">手动上传文献PDF文件和相关信息，支持单个或批量上传</p>

    <div class="upload-modes">
      <div class="mode-tabs">
        <button class="tab-btn" :class="{ active: uploadMode === 'single' }" @click="uploadMode = 'single'">
          单个上传
        </button>
        <button class="tab-btn" :class="{ active: uploadMode === 'batch' }" @click="uploadMode = 'batch'">
          批量上传
        </button>
      </div>
    </div>

    <!-- 单个上传表单 -->
    <div v-if="uploadMode === 'single'" class="single-upload">
      <div class="form-section">
        <div class="pdf-upload-area" @click="triggerFileInput" @drop.prevent="handleFileDrop" @dragover.prevent>
          <input type="file" ref="fileInput" @change="handleFileChange" accept=".pdf" style="display: none" />
          <div v-if="!singleUpload.file" class="upload-placeholder">
            <el-icon>
              <Document />
            </el-icon>
            <p>点击选择PDF文件或拖放至此处</p>
          </div>
          <div v-else class="file-preview">
            <el-icon>
              <Document />
            </el-icon>
            <p>{{ singleUpload.file.name }}</p>
            <button class="remove-btn" @click.stop="removeSingleFile">
              <el-icon>
                <Close />
              </el-icon>
            </button>
          </div>
        </div>

        <div class="form-fields">
          <div class="form-group">
            <label for="paper-title" class="required">标题:</label>
            <input type="text" id="paper-title" v-model="singleUpload.title" class="form-input" placeholder="文献标题"
              required />
          </div>

          <div class="form-group">
            <label for="paper-authors" class="required">作者:</label>
            <input type="text" id="paper-authors" v-model="singleUpload.authors" class="form-input"
              placeholder="作者姓名，多个作者用逗号分隔" required />
          </div>

          <div class="form-row">
            <div class="form-group flex-1">
              <label for="paper-date" class="required">发表日期:</label>
              <input type="date" id="paper-date" v-model="singleUpload.publication_date" class="form-input" required />
            </div>

            <div class="form-group flex-1">
              <label for="paper-language">语言:</label>
              <select id="paper-language" v-model="singleUpload.language" class="form-input">
                <option value="en">英文</option>
                <option value="zh">中文</option>
                <option value="other">其他</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label for="paper-type">文献类型:</label>
            <select id="paper-type" v-model="singleUpload.publication_type" class="form-input">
              <option value="article">研究文章</option>
              <option value="review">综述</option>
              <option value="case_report">病例报告</option>
              <option value="clinical_trial">临床试验</option>
              <option value="meta_analysis">元分析</option>
              <option value="other">其他</option>
            </select>
          </div>

          <div class="form-group">
            <label for="paper-doi">DOI:</label>
            <input type="text" id="paper-doi" v-model="singleUpload.doi" class="form-input"
              placeholder="10.xxxx/xxxxx" />
          </div>

          <div class="form-group">
            <label for="paper-keywords">关键词:</label>
            <input type="text" id="paper-keywords" v-model="singleUpload.keywords" class="form-input"
              placeholder="关键词，多个关键词用逗号分隔" />
          </div>

          <div class="form-group">
            <label for="paper-abstract">摘要:</label>
            <textarea id="paper-abstract" v-model="singleUpload.abstract" class="form-textarea" placeholder="文献摘要"
              rows="4"></textarea>
          </div>

          <div class="form-group">
            <label for="paper-url">原文链接:</label>
            <input type="url" id="paper-url" v-model="singleUpload.url" class="form-input" placeholder="https://..." />
          </div>
        </div>
      </div>

      <div class="upload-actions">
        <PrimaryButton :fullWidth="false" @click="uploadSinglePaper" :disabled="uploading">
          {{ uploading ? "上传中..." : "上传文献" }}
          <template #icon>
            <el-icon v-if="!uploading">
              <Upload />
            </el-icon>
            <el-icon v-else class="spinner">
              <Loading />
            </el-icon>
          </template>
        </PrimaryButton>
      </div>
    </div>

    <!-- 批量上传表单 -->
    <div v-else class="batch-upload">
      <div class="batch-upload-area" @click="triggerBatchFileInput" @drop.prevent="handleBatchFileDrop"
        @dragover.prevent>
        <input type="file" ref="batchFileInput" @change="handleBatchFileChange" accept=".pdf" multiple
          style="display: none" />
        <div v-if="!batchFiles.length" class="upload-placeholder">
          <el-icon>
            <Document />
          </el-icon>
          <p>点击选择多个PDF文件或拖放至此处</p>
          <span class="hint">支持批量上传多个PDF文件</span>
        </div>
        <div v-else class="batch-files-preview">
          <div class="batch-files-header">
            <span>已选择 {{ batchFiles.length }} 个文件</span>
            <button class="text-btn" @click.stop="clearBatchFiles">清空</button>
          </div>
          <div class="batch-files-list">
            <div v-for="(file, index) in batchFiles" :key="index" class="batch-file-item">
              <el-icon>
                <Document />
              </el-icon>
              <span class="file-name">{{ file.name }}</span>
              <button class="remove-btn" @click.stop="removeBatchFile(index)">
                <el-icon>
                  <Close />
                </el-icon>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="batch-upload-options">
        <div class="form-group">
          <label for="batch-extraction">文件名信息提取:</label>
          <select id="batch-extraction" v-model="batchUpload.extractionMode" class="form-input">
            <option value="filename">从文件名提取标题</option>
            <option value="pdf">尝试从PDF自动提取元数据</option>
            <option value="none">不提取，仅上传文件</option>
          </select>
        </div>

        <div class="form-row">
          <div class="form-group flex-1">
            <label for="batch-type">默认文献类型:</label>
            <select id="batch-type" v-model="batchUpload.defaultType" class="form-input">
              <option value="article">研究文章</option>
              <option value="review">综述</option>
              <option value="other">其他</option>
            </select>
          </div>

          <div class="form-group flex-1">
            <label for="batch-language">默认语言:</label>
            <select id="batch-language" v-model="batchUpload.defaultLanguage" class="form-input">
              <option value="en">英文</option>
              <option value="zh">中文</option>
              <option value="other">其他</option>
            </select>
          </div>
        </div>
      </div>

      <div class="upload-actions">
        <PrimaryButton :fullWidth="false" @click="uploadBatchPapers" :disabled="batchUploading || !batchFiles.length">
          {{ batchUploading ? "上传中..." : "开始批量上传" }}
          <template #icon>
            <el-icon v-if="!batchUploading">
              <Upload />
            </el-icon>
            <el-icon v-else class="spinner">
              <Loading />
            </el-icon>
          </template>
        </PrimaryButton>
      </div>

      <!-- 批量上传进度 -->
      <div v-if="batchUploading" class="upload-progress">
        <div class="progress-bar">
          <div class="progress-value" :style="{ width: `${uploadProgress}%` }"></div>
        </div>
        <div class="progress-text">
          {{ uploadProgress }}% - 已上传 {{ uploadedCount }}/{{
            batchFiles.length
          }}
          个文件
        </div>
      </div>
    </div>

    <!-- 上传结果提示 -->
    <div v-if="uploadResult.show" class="upload-result" :class="uploadResult.success ? 'success' : 'error'">
      <div class="result-icon">
        <el-icon v-if="uploadResult.success">
          <CircleCheck />
        </el-icon>
        <el-icon v-else>
          <CircleClose />
        </el-icon>
      </div>
      <div class="result-message">
        {{ uploadResult.message }}
      </div>
      <button class="close-result" @click="closeUploadResult">
        <el-icon>
          <Close />
        </el-icon>
      </button>
    </div>
  </div>
</template>

<script>
import PrimaryButton from "@/components/buttons/PrimaryButton.vue"
import Literature from "@/api/Literature"

import {
  Document,
  Upload,
  Loading,
  Close,
  CircleCheck,
  CircleClose,
} from "@element-plus/icons-vue"

export default {
  name: "UploadPaper",
  components: {
    PrimaryButton,
    Document,
    Upload,
    Loading,
    Close,
    CircleCheck,
    CircleClose,
  },
  data() {
    return {
      uploadMode: "single",


      singleUpload: {
        file: null,
        title: "",
        authors: "",
        publication_date: "",
        publication_type: "article",
        doi: "",
        abstract: "",
        keywords: "",
        language: "en",
        url: "",
      },
      uploading: false,


      batchFiles: [],
      batchUpload: {
        extractionMode: "filename",
        defaultType: "article",
        defaultLanguage: "en",
      },
      batchUploading: false,
      uploadProgress: 0,
      uploadedCount: 0,


      uploadResult: {
        show: false,
        success: false,
        message: "",
      },
    }
  },
  methods: {

    triggerFileInput() {
      this.$refs.fileInput.click()
    },

    handleFileChange(event) {
      const file = event.target.files[0]
      if (file && file.type === "application/pdf") {
        this.singleUpload.file = file
      } else if (file) {
        this.$message.error("请上传PDF格式的文件")
        this.$refs.fileInput.value = ""
      }
    },

    handleFileDrop(event) {
      const file = event.dataTransfer.files[0]
      if (file && file.type === "application/pdf") {
        this.singleUpload.file = file
      } else if (file) {
        this.$message.error("请上传PDF格式的文件")
      }
    },

    removeSingleFile() {
      this.singleUpload.file = null
      this.$refs.fileInput.value = ""
    },

    async uploadSinglePaper() {

      if (!this.singleUpload.file) {
        this.$message.error("请选择PDF文件")
        return
      }

      if (!this.singleUpload.title) {
        this.$message.error("请输入文献标题")
        return
      }

      if (!this.singleUpload.authors) {
        this.$message.error("请输入作者信息")
        return
      }

      if (!this.singleUpload.publication_date) {
        this.$message.error("请选择发表日期")
        return
      }

      this.uploading = true

      try {

        const formData = new FormData()
        formData.append("pdf_file", this.singleUpload.file)
        formData.append("title", this.singleUpload.title)
        formData.append("authors", this.singleUpload.authors)
        formData.append("publication_date", this.singleUpload.publication_date)
        formData.append("publication_type", this.singleUpload.publication_type)
        formData.append("language", this.singleUpload.language)


        if (this.singleUpload.doi) {
          formData.append("doi", this.singleUpload.doi)
        }

        if (this.singleUpload.abstract) {
          formData.append("abstract", this.singleUpload.abstract)
        }

        if (this.singleUpload.keywords) {
          formData.append("keywords", this.singleUpload.keywords)
        }

        if (this.singleUpload.url) {
          formData.append("url", this.singleUpload.url)
        }


        const response = await Literature.uploadPaper(formData)

        if (response.data.data && response.data.data.success) {
          this.showUploadResult(true, "文献上传成功")
          this.resetSingleUploadForm()
        } else {
          throw new Error(response.data.data?.message || "上传失败")
        }
      } catch (error) {

        this.showUploadResult(
          false,
          `上传失败: ${error.message || "未知错误"}`
        )
      } finally {
        this.uploading = false
      }
    },

    resetSingleUploadForm() {
      this.singleUpload = {
        file: null,
        title: "",
        authors: "",
        publication_date: "",
        publication_type: "article",
        doi: "",
        abstract: "",
        keywords: "",
        language: "en",
        url: "",
      }
      this.$refs.fileInput.value = ""
    },


    triggerBatchFileInput() {
      this.$refs.batchFileInput.click()
    },

    handleBatchFileChange(event) {
      const files = event.target.files
      if (files.length > 0) {
        this.addBatchFiles(files)
      }
    },

    handleBatchFileDrop(event) {
      const files = event.dataTransfer.files
      if (files.length > 0) {
        this.addBatchFiles(files)
      }
    },

    addBatchFiles(files) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        if (file.type === "application/pdf") {
          this.batchFiles.push(file)
        } else {
          this.$message.warning(`跳过非PDF文件: ${file.name}`)
        }
      }
      this.$refs.batchFileInput.value = ""
    },

    removeBatchFile(index) {
      this.batchFiles.splice(index, 1)
    },

    clearBatchFiles() {
      this.batchFiles = []
      this.$refs.batchFileInput.value = ""
    },

    async uploadBatchPapers() {
      if (this.batchFiles.length === 0) {
        this.$message.error("请选择至少一个PDF文件")
        return
      }

      this.batchUploading = true
      this.uploadProgress = 0
      this.uploadedCount = 0

      try {

        const batchParams = {
          extraction_mode: this.batchUpload.extractionMode,
          default_type: this.batchUpload.defaultType,
          default_language: this.batchUpload.defaultLanguage,
        }

        const totalFiles = this.batchFiles.length
        const successUploads = []
        const failedUploads = []


        for (let i = 0; i < this.batchFiles.length; i++) {
          const file = this.batchFiles[i]
          const formData = new FormData()


          formData.append("pdf_file", file)
          formData.append("extraction_mode", batchParams.extraction_mode)
          formData.append("default_type", batchParams.default_type)
          formData.append("default_language", batchParams.default_language)

          try {
            const response = await Literature.uploadBatchPaper(formData)

            if (response.data.data && response.data.data.success) {
              successUploads.push(file.name)
            } else {
              failedUploads.push({
                name: file.name,
                error: response.data.data?.message || "未知错误",
              })
            }
          } catch (error) {
            failedUploads.push({
              name: file.name,
              error: error.message || "上传失败",
            })
          }


          this.uploadedCount = i + 1
          this.uploadProgress = Math.round(
            (this.uploadedCount / totalFiles) * 100
          )
        }


        if (failedUploads.length === 0) {
          this.showUploadResult(
            true,
            `成功上传 ${successUploads.length} 个文件`
          )
          this.clearBatchFiles()
        } else if (successUploads.length === 0) {
          this.showUploadResult(
            false,
            `所有 ${failedUploads.length} 个文件上传失败`
          )
        } else {
          this.showUploadResult(
            true,
            `成功上传 ${successUploads.length} 个文件，${failedUploads.length} 个文件失败`
          )

          this.batchFiles = this.batchFiles.filter((_, index) => {
            return failedUploads.some(
              (fail) => fail.name === this.batchFiles[index].name
            )
          })
        }
      } finally {
        this.batchUploading = false
      }
    },


    showUploadResult(success, message) {
      this.uploadResult = {
        show: true,
        success,
        message,
      }


      setTimeout(() => {
        this.closeUploadResult()
      }, 5000)
    },

    closeUploadResult() {
      this.uploadResult.show = false
    },
  },
}
</script>

<style scoped>
.upload-paper {
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

h3 {
  margin-top: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
}

.description {
  color: #666;
  margin-bottom: 1.5rem;
}

.upload-modes {
  margin-bottom: 1.5rem;
}

.mode-tabs {
  display: flex;
  border-bottom: 1px solid #e0e0e0;
}

.tab-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 1rem;
  color: #666;
  position: relative;
}

.tab-btn.active {
  color: #1976d2;
  font-weight: 500;
}

.tab-btn.active::after {
  content: "";
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background-color: #1976d2;
}

.form-section {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.pdf-upload-area,
.batch-upload-area {
  flex: 1;
  border: 2px dashed #ccc;
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  background-color: #f9f9f9;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  max-height: 300px;
  /* 添加最大高度限制 */
  overflow: auto;
  /* 允许内容溢出时滚动 */
}

.pdf-upload-area:hover,
.batch-upload-area:hover {
  border-color: #1976d2;
  background-color: #f0f7ff;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  color: #666;
}

.upload-placeholder svg {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  color: #888;
}

.hint {
  font-size: 0.85rem;
  color: #888;
  margin-top: 0.5rem;
}

.file-preview {
  display: flex;
  align-items: flex-start;
  /* 改为flex-start以便于文本换行 */
  gap: 0.5rem;
  background-color: #f0f7ff;
  padding: 0.75rem 1rem;
  border-radius: 4px;
  width: 100%;
  position: relative;
  flex-wrap: wrap;
  /* 允许内容换行 */
}

.file-preview svg {
  color: #1976d2;
  font-size: 1.5rem;
  flex-shrink: 0;
  /* 防止图标缩小 */
}

.file-preview p {
  flex: 1;
  margin: 0;
  word-break: break-word;
  /* 允许长单词在任意位置断行 */
  overflow-wrap: break-word;
  /* 确保长单词能够断行 */
  white-space: normal;
  /* 允许文本正常换行 */
  text-align: left;
  min-width: 0;
  /* 确保flex子项可以缩小到比内容更小 */
  max-width: 100%;
  /* 限制最大宽度 */
}

.remove-btn {
  background: none;
  border: none;
  color: #888;
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  /* 防止按钮缩小 */
  align-self: flex-start;
  /* 将按钮定位在顶部 */
}

.remove-btn:hover {
  background-color: rgba(0, 0, 0, 0.05);
  color: #d32f2f;
}

.form-fields {
  flex: 2;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.form-row {
  display: flex;
  gap: 1rem;
}

.flex-1 {
  flex: 1;
}

label {
  font-size: 0.9rem;
  color: #555;
}

label.required::after {
  content: "*";
  color: #d32f2f;
  margin-left: 2px;
}

.form-input,
.form-textarea {
  padding: 0.625rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.95rem;
  width: 100%;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #1976d2;
  box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.2);
}

.upload-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 1.5rem;
}

/* 批量上传相关样式 */
.batch-files-preview {
  width: 100%;
  text-align: left;
}

.batch-files-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.text-btn {
  background: none;
  border: none;
  color: #1976d2;
  cursor: pointer;
  font-size: 0.9rem;
  padding: 4px 8px;
}

.text-btn:hover {
  text-decoration: underline;
}

.batch-files-list {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #eee;
  border-radius: 4px;
  background-color: white;
}

.batch-file-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border-bottom: 1px solid #f0f0f0;
}

.batch-file-item:last-child {
  border-bottom: none;
}

.batch-file-item svg {
  color: #1976d2;
  font-size: 1.25rem;
  flex-shrink: 0;
  /* 防止图标缩小 */
}

.file-name {
  flex: 1;
  word-break: break-word;
  /* 允许长单词在任意位置断行 */
  overflow-wrap: break-word;
  /* 确保长单词能够断行 */
  white-space: normal;
  /* 允许文本正常换行 */
}

.batch-upload-options {
  margin-top: 1.5rem;
  padding: 1rem;
  background-color: #f9f9f9;
  border-radius: 8px;
}

/* 上传进度 */
.upload-progress {
  margin-top: 1.5rem;
}

.progress-bar {
  height: 8px;
  background-color: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-value {
  height: 100%;
  background-color: #1976d2;
  transition: width 0.3s ease;
}

.progress-text {
  text-align: center;
  font-size: 0.9rem;
  color: #666;
  margin-top: 0.5rem;
}

/* 上传结果提示 */
.upload-result {
  margin-top: 1.5rem;
  padding: 1rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.upload-result.success {
  background-color: #e8f5e9;
  border: 1px solid #c8e6c9;
}

.upload-result.error {
  background-color: #ffebee;
  border: 1px solid #ffcdd2;
}

.result-icon {
  display: flex;
}

.upload-result.success .result-icon {
  color: #43a047;
}

.upload-result.error .result-icon {
  color: #e53935;
}

.result-message {
  flex: 1;
}

.close-result {
  background: none;
  border: none;
  color: #888;
  cursor: pointer;
  padding: 4px;
  display: flex;
}

/* 动画 */
.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}
</style>