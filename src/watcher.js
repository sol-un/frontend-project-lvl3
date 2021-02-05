import onChange from 'on-change';
import i18next from 'i18next';
import render from './renderer.js';

const state = {
  form: {
    status: 'active',
    error: null,
  },
  loadingProcess: {
    status: 'idle',
    error: null,
  },
  uiState: {
    activeChannel: null,
    viewedPosts: [],
    locale: null,
  },
  channels: [],
  posts: [],
  addedLinks: [],
  modalContents: { title: '', description: '' },
};

const watchedState = onChange(state, (path) => {
  if (path === 'uiState.locale') {
    i18next.changeLanguage(state.uiState.locale);
  }
  render(watchedState);
});

export { watchedState as default };
