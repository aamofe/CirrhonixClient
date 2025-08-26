<template>
  <div class="card upload-paper">
    <h3>上传文献</h3>
    <p class="description">手动上传文献PDF文件和相关信息</p>

    <div class="upload-container">
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
          <p class="file-name">{{ singleUpload.file.name }}</p>
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
          <el-input id="paper-title" v-model="singleUpload.title" placeholder="文献标题" required clearable />
        </div>
        <div class="form-group">
          <label for="paper-authors" class="required">作者:</label>
          <el-input id="paper-authors" v-model="singleUpload.authors" placeholder="作者姓名，多个作者用逗号分隔" required clearable />
        </div>
        <div class="form-group">
          <label for="paper-abstract" class="required">摘要:</label>
          <el-input type="textarea" id="paper-abstract" v-model="singleUpload.abstract" placeholder="文献摘要" rows="4"
            required />
        </div>
        <div class="form-row">
          <div class="form-group flex-1">
            <label for="paper-date" class="required">发表日期:</label>
            <el-date-picker v-model="singleUpload.publication_date" type="date" placeholder="选择日期" class="full-width" />
          </div>
          <div class="form-group flex-1">
            <label for="paper-language">语言:</label>
            <el-select v-model="singleUpload.language" placeholder="选择语言" class="full-width">
              <el-option label="英文" value="en" />
              <el-option label="中文" value="zh" />
              <el-option label="其他" value="other" />
            </el-select>
          </div>
        </div>

        <div class="optional-fields">
          <div class="form-group">
            <label for="paper-type">文献类型:</label>
            <el-select id="paper-type" v-model="singleUpload.publication_type" placeholder="选择类型" class="full-width">
              <el-option label="研究文章" value="article" />
              <el-option label="综述" value="review" />
              <el-option label="病例报告" value="case_report" />
              <el-option label="临床试验" value="clinical_trial" />
              <el-option label="元分析" value="meta_analysis" />
              <el-option label="其他" value="other" />
            </el-select>
          </div>
          <div class="form-group">
            <label for="paper-doi">DOI:</label>
            <el-input id="paper-doi" v-model="singleUpload.doi" placeholder="10.xxxx/xxxxx" clearable />
          </div>
          <div class="form-group">
            <label for="paper-keywords">关键词:</label>
            <el-input id="paper-keywords" v-model="singleUpload.keywords" placeholder="关键词，多个关键词用逗号分隔" clearable />
          </div>
          <div class="form-group">
            <label for="paper-url">原文链接:</label>
            <el-input id="paper-url" v-model="singleUpload.url" placeholder="https://..." clearable />
          </div>
        </div>
      </div>
    </div>

    <div class="upload-actions">
      <PrimaryButton :fullWidth="true" @click="uploadSinglePaper" :disabled="!isFormValid || uploading">
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

    <el-alert v-if="uploadResult.show" :title="uploadResult.message" :type="uploadResult.success ? 'success' : 'error'"
      show-icon @close="closeUploadResult" />

    <div v-if="uploadedLiteratures.length > 0" class="uploaded-literature">
      <h4>已上传的文献</h4>
      <div class="literature-list">
        <LiteratureItem v-for="literature in uploadedLiteratures" :key="literature.id" :article="literature"
          @view-detail="viewArticleDetail" />
      </div>
    </div>
  </div>
</template>

<script>
import PrimaryButton from "@/components/buttons/PrimaryButton.vue"
import LiteratureItem from "../layout/LiteratureItem.vue"
import Literature from "@/api/Literature"
import { ElMessage, ElInput, ElDatePicker, ElSelect, ElOption, ElAlert } from "element-plus"
import "element-plus/es/components/message/style/css"
import "element-plus/es/components/input/style/css"
import "element-plus/es/components/date-picker/style/css"
import "element-plus/es/components/select/style/css"
import "element-plus/es/components/alert/style/css"
import { Document, Upload, Loading, Close } from "@element-plus/icons-vue"

export default {
  name: "UploadPaper",
  components: {
    PrimaryButton,
    LiteratureItem,
    Document,
    Upload,
    Loading,
    Close,
    ElInput,
    ElDatePicker,
    ElSelect,
    ElOption,
    ElAlert,
  },
  data() {
    return {
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
      uploadResult: {
        show: false,
        success: false,
        message: "",
      },
      uploadedLiteratures: [],
    }
  },
  computed: {
    isFormValid() {
      // 检查必填项：文件、标题、作者、发表日期、摘要
      return this.singleUpload.file && this.singleUpload.title && this.singleUpload.authors && this.singleUpload.publication_date && this.singleUpload.abstract
    },
  },
  methods: {
    // ... (其他方法保持不变)
    triggerFileInput() {
      this.$refs.fileInput.click()
    },
    handleFileChange(event) {
      const file = event.target.files[0]
      if (file && file.type === "application/pdf") {
        this.singleUpload.file = file
      } else if (file) {
        ElMessage.error("请上传PDF格式的文件")
        this.$refs.fileInput.value = ""
      }
    },
    handleFileDrop(event) {
      const file = event.dataTransfer.files[0]
      if (file && file.type === "application/pdf") {
        this.singleUpload.file = file
      } else if (file) {
        ElMessage.error("请上传PDF格式的文件")
      }
    },
    removeSingleFile() {
      this.singleUpload.file = null
      this.$refs.fileInput.value = ""
    },
    closeUploadResult() {
      this.uploadResult.show = false
    },
    viewArticleDetail(id) {
      // Your existing logic
    },
    saveTaskToMemory(taskId) {
      // Your existing logic
    },
    async uploadSinglePaper() {
      if (!this.isFormValid) {
        ElMessage.error("请填写所有必填项")
        return
      }
      this.uploading = true
      this.closeUploadResult()

      try {
        const formData = new FormData()
        formData.append("pdf_file", this.singleUpload.file)
        formData.append("title", this.singleUpload.title)
        formData.append("authors", this.singleUpload.authors)
        formData.append("publication_date", this.singleUpload.publication_date)
        formData.append("abstract", this.singleUpload.abstract) // 摘要作为必填项

        // Append optional fields only if they have values
        if (this.singleUpload.publication_type) formData.append("publication_type", this.singleUpload.publication_type)
        if (this.singleUpload.language) formData.append("language", this.singleUpload.language)
        if (this.singleUpload.doi) formData.append("doi", this.singleUpload.doi)
        if (this.singleUpload.keywords) formData.append("keywords", this.singleUpload.keywords)
        if (this.singleUpload.url) formData.append("url", this.singleUpload.url)

        const response = await Literature.uploadPaper(formData)
        if (response.status === 200 && response.data.data) {
          this.showUploadResult(true, response.data.message || "文献上传成功")
          this.uploadedLiteratures.unshift(response.data.data)
          this.resetSingleUploadForm()
        } else {
          throw new Error(response.data?.message || "上传失败")
        }
      } catch (error) {
        let errorMessage = "上传失败: 未知错误"
        if (error.response?.data?.message) {
          errorMessage = `上传失败: ${error.response.data.message}`
        } else if (error.message) {
          errorMessage = `上传失败: ${error.message}`
        }
        console.error("Upload error:", error)
        this.showUploadResult(false, errorMessage)
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
      if (this.$refs.fileInput) {
        this.$refs.fileInput.value = ""
      }
    },
    showUploadResult(success, message) {
      this.uploadResult = { show: true, success, message }
      setTimeout(() => {
        this.closeUploadResult()
      }, 5000)
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

.upload-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.pdf-upload-area {
  border: 2px dashed #ddd;
  border-radius: 8px;
  padding: 1.5rem;
  text-align: center;
  cursor: pointer;
  background-color: #f9f9f9;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 120px;
  max-height: 200px;
  overflow: hidden;
}

.pdf-upload-area:hover {
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
  font-size: 2rem;
  margin-bottom: 0.25rem;
  color: #888;
}

.file-preview {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background-color: #e8f5e9;
  padding: 0.75rem 1rem;
  border-radius: 4px;
  width: 100%;
}

.file-preview svg {
  color: #43a047;
  font-size: 1.5rem;
  flex-shrink: 0;
}

.file-preview p.file-name {
  flex: 1;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: left;
}

.remove-btn {
  background: none;
  border: none;
  color: #888;
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
}

.remove-btn:hover {
  background-color: rgba(0, 0, 0, 0.05);
  color: #d32f2f;
}

.form-fields {
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
  font-weight: 500;
}

label.required::after {
  content: "*";
  color: #d32f2f;
  margin-left: 2px;
}

.full-width {
  width: 100%;
}

.upload-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 1.5rem;
}

.uploaded-literature {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e0e0e0;
}
</style>