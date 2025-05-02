import { createStore } from "vuex";

export default createStore({
  state: {
    isAdmin: false,
    userAvatar: "",
    userId: "",
  },
  getters: {
    isAdmin: (state) => state.isAdmin,
    userAvatar: (state) => state.userAvatar,
    userId: (state) => state.userId,
  },
  mutations: {
    setIsAdmin(state, newValue) {
      state.isAdmin = newValue;
    },
    setUserAvatar(state, avatar) {
      state.userAvatar = avatar;
    },
    setUserId(state, id) {
      state.userId = id;
    },
  },
  actions: {},
  modules: {},
});
