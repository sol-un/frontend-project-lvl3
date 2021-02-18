/* eslint-disable no-param-reassign */

import _ from 'lodash';
import i18next from 'i18next';
import axios from 'axios';
import $ from 'jquery';
import { formatText, validate } from './utils.js';
import en from './locales/en.js';
import ru from './locales/ru.js';
import es from './locales/es.js';
import parse from './parser.js';
import watchState from './renderer.js';
import 'bootstrap/dist/js/bootstrap.min.js';

const proxy = 'https://hexlet-allorigins.herokuapp.com/get';
const timeoutInterval = 5000;

const normalizePosts = (channelId, posts) => posts.map((post) => ({
  ...post,
  channelId,
  id: _.uniqueId(),
}));

const downloadChannel = (link, watchedState) => {
  watchedState.loadingProcess.status = 'fetching';
  axios.get(proxy, {
    params: {
      disableCache: true,
      url: link,
    },
  })
    .then((response) => {
      const [channelData, channelContents] = parse(response.data.contents);
      const id = _.uniqueId();
      const fullChannelData = { ...channelData, id, link };
      const normalizedChannelContents = normalizePosts(id, channelContents);
      return [fullChannelData, normalizedChannelContents];
    })
    .then(([fullChannelData, normalizedChannelContents]) => {
      watchedState.form.status = 'active';
      watchedState.form.error = null;
      watchedState.loadingProcess.status = 'success';
      watchedState.loadingProcess.error = null;
      watchedState.channels = [...watchedState.channels, fullChannelData];
      watchedState.posts = [...watchedState.posts, ...normalizedChannelContents];
      watchedState.addedLinks = [...watchedState.addedLinks, link];
    })
    .catch((error) => {
      watchedState.loadingProcess.status = 'error';
      watchedState.loadingProcess.error = error.response || error.request ? 'network' : error.message;
      watchedState.form.status = 'active';
    });
};

const updatePosts = (state) => {
  const { channels } = state;
  channels.map(({
    id, link,
  }) => axios(proxy, {
    params: {
      disableCache: true,
      url: link,
    },
  })
    .then((response) => {
      const [, fetchedPosts] = parse(response.data.contents);
      const prevPosts = state.posts.filter(({ channelId }) => channelId === id);

      const newPosts = _.differenceBy(fetchedPosts, prevPosts, 'link');
      const normalizedNewPosts = normalizePosts(id, newPosts);

      const prevPostsToAdd = _.intersectionBy(prevPosts, fetchedPosts, 'link');

      const postsToAdd = [...normalizedNewPosts, ...prevPostsToAdd];
      const otherPosts = state.posts.filter(({ channelId }) => channelId !== id);
      state.posts = [...otherPosts, ...postsToAdd];
    })
    .finally(() => {
      state.loadingProcess.status = 'idle';
      state.loadingProcess.error = null;
      setTimeout(() => updatePosts(state), timeoutInterval);
    }));
};

export default () => i18next.init({
  interpolation: { format: formatText },
  lng: 'en',
  resources: { en, ru, es },
}).then(() => {
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
      viewedPosts: [],
      locale: null,
    },
    channels: [],
    posts: [],
    addedLinks: [],
    modalContents: { title: '', description: '' },
  };

  const nodeDispatcher = {
    modal: {
      modalWindow: $('#previewModal'),
      modalTitle: document.querySelector('#previewModalTitle'),
      modalBody: document.querySelector('#previewModalBody'),
    },
    input: document.querySelector('input'),
    button: document.querySelector('#addButton'),
    container: document.querySelector('#channelNav'),
    flashContainer: document.querySelector('.feedback'),
    i18n: {
      header: document.querySelector('#header'),
      pitch: document.querySelector('#pitch'),
      addButton: document.querySelector('#addButton'),
      suggestedLink: document.querySelector('#collapseLinks > .card'),
    },
    form: document.querySelector('#addChannelForm'),
    links: [...document.querySelectorAll('.dropdown-menu > a')],
    modalCloseButton: document.querySelector('#previewModalCloseButton'),
  };

  const watchedState = watchState(state, nodeDispatcher);

  setTimeout(() => updatePosts(watchedState), timeoutInterval);

  nodeDispatcher.form.addEventListener('submit', (e) => {
    e.preventDefault();
    const link = new FormData(e.target).get('link');
    if (_.isEmpty(link)) {
      return;
    }
    watchedState.form.status = 'disabled';

    const validationResult = validate(link, watchedState.addedLinks);
    if (validationResult.name === 'ValidationError') {
      watchedState.form.status = 'active';
      watchedState.form.error = validationResult.type;
    } else {
      downloadChannel(link, watchedState);
    }
  });

  nodeDispatcher.container.addEventListener('click', ({ target }) => {
    const postId = target.getAttribute('data-id');
    if (!postId) {
      return;
    }
    const { title, description } = watchedState.posts.find(({ id }) => id === postId);
    watchedState.modalContents = { title, description };
    if (!watchedState.uiState.viewedPosts.includes(postId)) {
      watchedState.uiState.viewedPosts.push(postId);
    }
    nodeDispatcher.modal.modalWindow.modal('toggle');
  });

  nodeDispatcher.links.forEach((link) => link.addEventListener('click', (e) => {
    e.preventDefault();
    const locale = e.target.innerText.toLowerCase();
    watchedState.uiState.locale = locale;
  }));

  watchedState.uiState.locale = i18next.language;
});
