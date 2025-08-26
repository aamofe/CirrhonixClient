<template>
  <div class="profile-form">
    <!-- 头像上传 input，只有一份 -->
    <input type="file" ref="fileInput" accept="image/*" style="display: none" @change="handleFileChange" />

    <div v-if="!isEditing" class="profile-info">
      <div class="profile-layout">
        <!-- 左侧头像 -->
        <div class="avatar-section">
          <div class="avatar-container" @click="triggerFileInput">
            <img :src="avatarUrl || defaultAvatar" alt="用户头像" class="avatar-image" />
            <div class="avatar-overlay">
              <span>更换头像</span>
            </div>
          </div>
        </div>

        <!-- 右侧信息 -->
        <div class="info-content">
          <div class="info-item">
            <div class="info-label">用户名</div>
            <div class="info-value">{{ user.username || "未设置" }}</div>
          </div>

          <div class="info-item">
            <div class="info-label">邮箱</div>
            <div class="info-value">{{ user.email || "未设置" }}</div>
          </div>

          <div class="info-item">
            <div class="info-label">所属机构</div>
            <div class="info-value">{{ user.affiliation || "未设置" }}</div>
          </div>

          <div class="info-item">
            <div class="info-label">个人简介</div>
            <div class="info-value">{{ user.introduction || "暂无个人简介" }}</div>
          </div>

          <div class="info-item">
            <div class="info-label">研究方向</div>
            <div class="info-value">{{ user.interest || "暂无研究方向" }}</div>
          </div>
        </div>
      </div>

      <!-- 底部按钮 -->
      <div class="action-buttons">
        <button @click="startEditing" class="edit-button">编辑资料</button>
        <button @click="$emit('showPasswordModal')" class="password-button">修改密码</button>
        <button @click="$emit('logout')" class="logout-button">退出登录</button>
      </div>
    </div>

    <!-- 编辑状态：表单 -->
    <form v-else @submit.prevent="handleSubmit" class="profile-form-edit">
      <div class="profile-layout">
        <!-- 左侧头像 -->
        <div class="avatar-section">
          <div class="avatar-container" @click="triggerFileInput">
            <img :src="avatarUrl || defaultAvatar" alt="用户头像" class="avatar-image" />
            <div class="avatar-overlay">
              <span>更换头像</span>
            </div>
          </div>
        </div>

        <div class="form-content">
          <div class="info-item">
            <div class="info-label">用户名</div>
            <div class="info-value">{{ user.username || "未设置" }}</div>
          </div>

          <div class="info-item">
            <div class="info-label">邮箱</div>
            <div class="info-value">{{ user.email || "未设置" }}</div>
          </div>

          <div class="info-item">
            <div class="info-label">所属机构</div>
            <div class="info-value">{{ user.affiliation || "未设置" }}</div>
          </div>

          <div class="form-group">
            <label for="introduction">个人简介</label>
            <textarea id="introduction" v-model="form.introduction" class="form-textarea" rows="4"></textarea>
          </div>

          <div class="form-group">
            <label for="interest">研究方向</label>
            <textarea id="interest" v-model="form.interest" class="form-textarea" rows="3"
              placeholder="多个研究方向请用逗号分隔"></textarea>
          </div>
        </div>
      </div>

      <div class="form-actions">
        <button type="button" @click="cancelEditing" class="cancel-button">取消</button>
        <PrimaryButton type="submit" :fullWidth="false">保存</PrimaryButton>
      </div>
    </form>
  </div>
</template>

<script>
import PrimaryButton from "@/components/buttons/PrimaryButton.vue"
import defaultAvatar from "@/assets/female.png"
import User from "@/api/User"
import bus from '@/utils/bus'
export default {
  name: "ProfileForm",
  components: { PrimaryButton },
  props: { user: { type: Object, required: true } },
  data() {
    return {
      isEditing: false,
      form: { introduction: "", interest: "" },
      avatarUrl: null,
      avatarFile: null,
      defaultAvatar,
      loading: false,
    }
  },
  created() {
    this.initForm()
  },
  methods: {
    initForm() {
      this.form = {
        introduction: this.user.introduction || "",
        interest: this.user.interest || "",
      }
      this.avatarUrl = this.user.avatar_url || null
    },
    startEditing() {
      this.isEditing = true
      this.initForm()
    },
    cancelEditing() {
      this.isEditing = false
      this.initForm()
    },
    triggerFileInput() {
      if (this.$refs.fileInput) this.$refs.fileInput.click()
    },
    handleFileChange(event) {
      const file = event.target.files[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (e) => {
        this.avatarUrl = e.target.result
        this.avatarFile = file
      }
      reader.readAsDataURL(file)

      const formData = new FormData()
      formData.append("avatar", file)

      User.preference(formData)
        .then((res) => {
          const newAvatar = res.data.data.avatar_url
          this.$message.success("头像更新成功")
          this.$emit("avatarUpdated", newAvatar)
          bus.emit('avatar-updated', newAvatar)
        })
        .catch(() => {
          this.$message.error("头像上传失败")
        })
    },
    async handleSubmit() {
      this.loading = true
      try {
        const formData = new FormData()
        formData.append("introduction", this.form.introduction)
        formData.append("interest", this.form.interest)
        await User.preference(formData)
        this.$emit("profileUpdated", {
          ...this.user,
          introduction: this.form.introduction,
          interest: this.form.interest,
          avatar_url: this.avatarUrl,
        })
        this.$message.success("个人信息更新成功")
        this.isEditing = false
      } catch {
        this.$message.error("个人信息更新失败")
      } finally {
        this.loading = false
      }
    },
  },
}
</script>


<style scoped>
.profile-form {
  max-width: 800px;
  margin: 0 auto;
}

.profile-layout {
  display: flex;
  margin-bottom: 2rem;
}

.avatar-section {
  flex: 0 0 150px;
  margin-right: 2rem;
}

.avatar-container {
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
  cursor: pointer;
}

.avatar-container:hover .avatar-overlay {
  opacity: 1;
}

.info-content,
.form-content {
  flex: 1;
}

.info-item {
  margin-bottom: 1rem;
  line-height: 1.6;
  display: flex;
  flex-direction: row;
  align-items: center;
  text-align: left;
}

.info-label {
  font-weight: 600;
  color: #333;
  min-width: 80px;
  text-align: left;
}

.info-value {
  color: #666;
  text-align: left;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}

.edit-button,
.password-button,
.logout-button {
  padding: 0.6rem 1.25rem;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.button-icon {
  width: 16px;
  height: 16px;
}

.edit-button {
  background-color: transparent;
  border-color: #ddd;
  color: #555;
}

.edit-button:hover {
  background-color: #f5f5f5;
  border-color: #ccc;
}

.password-button {
  background-color: rgba(168, 230, 207, 0.2);
  color: #27ae60;
  border-color: rgba(39, 174, 96, 0.3);
}

.password-button:hover {
  background-color: rgba(168, 230, 207, 0.3);
  border-color: rgba(39, 174, 96, 0.5);
}

.logout-button {
  background-color: rgba(231, 76, 60, 0.1);
  color: #e74c3c;
  border-color: rgba(231, 76, 60, 0.3);
}

.logout-button:hover {
  background-color: rgba(231, 76, 60, 0.2);
  border-color: rgba(231, 76, 60, 0.5);
}

.form-actions {
  display: flex;
  justify-content: flex-start;
  margin-top: 1.5rem;
  gap: 1rem;
}

.cancel-button {
  padding: 0.5rem 1.5rem;
  background-color: transparent;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.cancel-button:hover {
  background-color: #f5f5f5;
}

.form-group {
  margin-bottom: 1.5rem;
  text-align: left;
  width: 100%;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  text-align: left;
}

.form-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  resize: vertical;
}
</style>
