<!-- src/components/profile/ProfileForm.vue -->
<template>
  <form @submit.prevent="handleSubmit" class="profile-form">
    <div class="form-group">
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
        <input
          type="file"
          ref="fileInput"
          accept="image/*"
          style="display: none"
          @change="handleFileChange"
        />
      </div>
    </div>

    <div class="form-group">
      <label for="username">用户名</label>
      <input
        type="text"
        id="username"
        v-model="form.username"
        class="form-input"
        required
      />
    </div>

    <div class="form-group">
      <label for="email">邮箱</label>
      <input
        type="email"
        id="email"
        v-model="form.email"
        class="form-input"
        required
      />
    </div>

    <div class="form-group">
      <label for="name">真实姓名</label>
      <input type="text" id="name" v-model="form.name" class="form-input" />
    </div>

    <div class="form-group">
      <label for="affiliation">所属机构</label>
      <input
        type="text"
        id="affiliation"
        v-model="form.affiliation"
        class="form-input"
      />
    </div>

    <div class="form-group">
      <label for="title">职称/职位</label>
      <input type="text" id="title" v-model="form.title" class="form-input" />
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

    <div class="form-actions">
      <PrimaryButton type="submit" :fullWidth="false">保存修改</PrimaryButton>
    </div>
  </form>
</template>

<script>
import PrimaryButton from "@/components/buttons/PrimaryButton.vue";

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
      form: {
        username: "",
        email: "",
        name: "",
        affiliation: "",
        title: "",
        bio: "",
        research_interests: "",
      },
      avatarUrl: null,
      avatarFile: null,
      defaultAvatar: "/img/default-avatar.png",
    };
  },
  created() {
    // 初始化表单数据
    this.initForm();
  },
  methods: {
    initForm() {
      // 获取用户数据填充表单
      this.form = {
        username: this.user.username || "",
        email: this.user.email || "",
        name: this.user.name || "",
        affiliation: this.user.affiliation || "",
        title: this.user.title || "",
        bio: this.user.bio || "",
        research_interests: this.user.research_interests || "",
      };

      // 设置头像
      if (this.user.avatar_url) {
        this.avatarUrl = this.user.avatar_url;
      }
    },
    triggerFileInput() {
      this.$refs.fileInput.click();
    },
    handleFileChange(event) {
      const file = event.target.files[0];
      if (!file) return;
    },
  },
};
</script>

<style scoped>
.profile-form {
  max-width: 600px;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #444;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.3s;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #a8e6cf;
  box-shadow: 0 0 0 3px rgba(168, 230, 207, 0.2);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.form-actions {
  margin-top: 2rem;
  display: flex;
  justify-content: flex-end;
}

.avatar-section {
  display: flex;
  justify-content: center;
  margin-bottom: 1.5rem;
}

.avatar-container {
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
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
}

.avatar-container:hover .avatar-overlay {
  opacity: 1;
}
</style>
