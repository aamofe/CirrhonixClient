<!-- src/components/profile/ProfileForm.vue -->
<template>
  <div class="profile-form">
    <!-- 非编辑状态：显示信息 -->
    <div v-if="!isEditing" class="profile-info">
      <div class="profile-layout">
        <!-- 左侧头像 -->
        <div class="avatar-section">
          <div class="avatar-container">
            <img
              :src="defaultAvatar"
              alt="用户头像"
              class="avatar-image"
            />
            <div class="avatar-overlay" @click="triggerFileInput">
              <span>更换头像</span>
            </div>
          </div>
          <input
            type="file"
            ref="fileInput"
            accept="image/*"
            style="display: none"
            @change="handleFileChange"
          />
        </div>
        
        <!-- 右侧信息 -->
        <div class="info-content">
          <div class="info-item">
            <div class="info-label">用户名</div>
            <div class="info-value">{{ user.username || '未设置' }}</div>
          </div>
          
          <div class="info-item">
            <div class="info-label">邮箱</div>
            <div class="info-value">{{ user.email || '未设置' }}</div>
          </div>
          
          <div class="info-item">
            <div class="info-label">所属机构</div>
            <div class="info-value">{{ user.affiliation || '未设置' }}</div>
          </div>
          
          <div class="info-item">
            <div class="info-label">个人简介</div>
            <div class="info-value">{{ user.bio || '暂无个人简介' }}</div>
          </div>
          
          <div class="info-item">
            <div class="info-label">研究方向</div>
            <div class="info-value">{{ user.research_interests || '暂无研究方向' }}</div>
          </div>
        </div>
      </div>
      
      <!-- 底部编辑按钮 -->
      <div class="action-button">
        <button @click="startEditing" class="edit-button">
          编辑
        </button>
      </div>
    </div>

    <!-- 编辑状态：表单 -->
    <form v-else @submit.prevent="handleSubmit" class="profile-form-edit">
      <div class="profile-layout">
        <!-- 左侧头像 -->
        <div class="avatar-section">
          <div class="avatar-container">
            <img
              :src="avatarUrl || defaultAvatar"
              alt="用户头像"
              class="avatar-image"
            />
            <div class="avatar-overlay" @click="triggerFileInput">
              <span>更换头像</span>
            </div>
          </div>
        </div>
        
        <!-- 右侧表单 -->
        <div class="form-content">
          <div class="info-item">
            <div class="info-label">用户名</div>
            <div class="info-value">{{ user.username || '未设置' }}</div>
          </div>
          
          <div class="info-item">
            <div class="info-label">邮箱</div>
            <div class="info-value">{{ user.email || '未设置' }}</div>
          </div>
          
          <div class="info-item">
            <div class="info-label">所属机构</div>
            <div class="info-value">{{ user.affiliation || '未设置' }}</div>
          </div>
          
          <div class="form-group">
            <label for="bio">个人简介</label>
            <textarea
              id="bio"
              v-model="form.bio"
              class="form-textarea"
              rows="4"
            ></textarea>
          </div>
          
          <div class="form-group">
            <label for="research_interests">研究方向</label>
            <textarea
              id="research_interests"
              v-model="form.research_interests"
              class="form-textarea"
              rows="3"
              placeholder="多个研究方向请用逗号分隔"
            ></textarea>
          </div>
        </div>
      </div>
      
      <!-- 底部保存和取消按钮 -->
      <div class="form-actions">
        <button type="button" @click="cancelEditing" class="cancel-button">
          取消
        </button>
        <PrimaryButton type="submit" :fullWidth="false">保存</PrimaryButton>
      </div>
    </form>
  </div>
</template>

<script>
import PrimaryButton from "@/components/buttons/PrimaryButton.vue";
import defaultAvatar from '@/assets/female.png';

export default {
  name: "ProfileForm",
  components: {
    PrimaryButton,
  },
  props: {
    user: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      isEditing: false,
      form: {
        bio: "",
        research_interests: "",
      },
      avatarUrl: null,
      avatarFile: null,
      defaultAvatar,
    };
  },
  created() {
    // 初始化表单数据
    this.initForm();
  },
  methods: {
    initForm() {
      // 只保留需要编辑的字段
      this.form = {
        bio: this.user.bio || "",
        research_interests: this.user.research_interests || "",
      };
      
      // 设置头像
      if (this.user.avatar_url) {
        this.avatarUrl = this.user.avatar_url;
      }
    },
    startEditing() {
      this.isEditing = true;
      this.initForm(); // 重新初始化表单，确保最新数据
    },
    cancelEditing() {
      this.isEditing = false;
      this.initForm(); // 重置表单数据
    },
    triggerFileInput() {
      this.$refs.fileInput.click();
    },
    handleFileChange(event) {
      const file = event.target.files[0];
      if (!file) return;
      
      // 处理文件上传预览
      const reader = new FileReader();
      reader.onload = (e) => {
        this.avatarUrl = e.target.result;
        this.avatarFile = file;
      };
      reader.readAsDataURL(file);
    },
    handleSubmit() {
      // 创建表单数据对象
      const formData = new FormData();
      formData.append('bio', this.form.bio);
      formData.append('research_interests', this.form.research_interests);
      
      // 如果有新头像，添加到表单数据
      if (this.avatarFile) {
        formData.append('avatar', this.avatarFile);
      }
      
      // 发出保存事件，让父组件处理
      this.$emit('save', formData);
      
      // 退出编辑模式
      this.isEditing = false;
    }
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

.info-content, .form-content {
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

.action-button {
  display: flex;
  justify-content: flex-end;
  margin-top: 1rem;
}

.edit-button {
  padding: 0.5rem 1.5rem;
  background-color: transparent;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.edit-button:hover {
  background-color: #f5f5f5;
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