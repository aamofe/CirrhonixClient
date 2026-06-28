<template>
  <div class="profile-form">
    <input type="file" ref="fileInput" accept="image/*" style="display: none" @change="handleFileChange" />

    <div v-if="!isEditing" class="profile-info">
      <div class="profile-layout">
        <div class="avatar-section">
          <div class="avatar-container" @click="triggerFileInput">
            <img :src="displayAvatar" alt="用户头像" class="avatar-image" @error="onAvatarError" />
            <div class="avatar-overlay">
              <span>更换头像</span>
            </div>
          </div>
        </div>

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
            <div class="info-value">
              {{ user.introduction || "暂无个人简介" }}
            </div>
          </div>

          <div class="info-item">
            <div class="info-label">研究方向</div>
            <div class="info-value">{{ user.interest || "暂无研究方向" }}</div>
          </div>
        </div>
      </div>

      <div class="action-buttons">
        <PrimaryButton variant="secondary" :fullWidth="false" @click="startEditing">
          编辑资料
        </PrimaryButton>
        <PrimaryButton variant="secondary" :fullWidth="false" @click="$emit('showPasswordModal')">
          修改密码
        </PrimaryButton>
        <PrimaryButton variant="danger" :fullWidth="false" @click="$emit('logout')">
          退出登录
        </PrimaryButton>
      </div>
    </div>

    <form v-else @submit.prevent="handleSubmit" class="profile-form-edit">
      <div class="profile-layout">
        <div class="avatar-section">
          <div class="avatar-container" @click="triggerFileInput">
            <img :src="displayAvatar" alt="用户头像" class="avatar-image" @error="onAvatarError" />
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
        <CancelButton @click="cancelEditing">取消</CancelButton>
        <PrimaryButton type="submit" :fullWidth="false">保存</PrimaryButton>
      </div>
    </form>
  </div>
</template>

<script>
import PrimaryButton from "@/components/ui/PrimaryButton.vue"
import CancelButton from "@/components/ui/CancelButton.vue"
import User from "@/api/User"
import notify from "@/utils/notify"
import { DEFAULT_AVATAR } from "@/constants/media"
import { mapMutations } from "vuex"

export default {
  name: "ProfileForm",
  components: { PrimaryButton, CancelButton }, // Register CancelButton
  props: { user: { type: Object, required: true } },
  data() {
    return {
      isEditing: false,
      form: { introduction: "", interest: "" },
      avatarUrl: null,
      avatarFile: null,
      avatarLoadFailed: false,
      loading: false,
    }
  },
  computed: {
    displayAvatar() {
      if (this.avatarLoadFailed || !this.avatarUrl) return DEFAULT_AVATAR
      return this.avatarUrl
    },
  },
  created() {
    this.initForm()
  },
  methods: {
    ...mapMutations(["setUserAvatar"]),

    initForm() {
      this.form = {
        introduction: this.user.introduction || "",
        interest: this.user.interest || "",
      }
      this.avatarUrl = this.user.avatar_url || null
      this.avatarLoadFailed = false
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
          this.avatarUrl = newAvatar
          this.avatarLoadFailed = false
          notify.success("头像更新成功")
          this.setUserAvatar(newAvatar)
        })
        .catch(() => {
          notify.error("头像上传失败")
        })
    },
    async handleSubmit() {
      this.loading = true
      try {
        const formData = new FormData()
        formData.append("introduction", this.form.introduction)
        formData.append("interest", this.form.interest)
        await User.preference(formData)
        const serverAvatar = this.user.avatar_url
        this.$emit("profileUpdated", {
          ...this.user,
          introduction: this.form.introduction,
          interest: this.form.interest,
          avatar_url: serverAvatar,
        })
        notify.success("个人信息更新成功")
        this.isEditing = false
      } catch {
        notify.error("个人信息更新失败")
      } finally {
        this.loading = false
      }
    },
    onAvatarError() {
      this.avatarLoadFailed = true
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
  flex-wrap: wrap;
}

.form-actions {
  display: flex;
  justify-content: flex-start;
  margin-top: 1.5rem;
  gap: 1rem;
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
</style>