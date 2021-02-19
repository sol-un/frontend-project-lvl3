/* eslint-disable no-param-reassign */

import { uniqueId, differenceBy, isEmpty } from 'lodash';
import i18next from 'i18next';
import axios from 'axios';
import $ from 'jquery';
import { validate } from './utils.js';
import ru from './locales/ru.js';
import parse from './parser.js';
import watchState from './renderer.js';
import 'bootstrap/dist/js/bootstrap.min.js';

const addProxy = (link) => {
  const proxyUrl = new URL('https://hexlet-allorigins.herokuapp.com/get');
  proxyUrl.search = `?disableCache=true&url=${link}`;
  return proxyUrl.toString();
};

const timeoutInterval = 5000;

const normalizePosts = (channelId, posts) => posts.map((post) => ({
  ...post,
  channelId,
  id: uniqueId(),
}));

const downloadChannel = (link, watchedState) => {
  watchedState.loadingProcess.status = 'fetching';
  axios(addProxy(link))
    .then((response) => {
      const { title, description, items } = parse(response.data.contents);
      const id = uniqueId();
      const fullChannelData = {
        title, description, id, link,
      };
      const normalizedChannelContents = normalizePosts(id, items);
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
  }) => axios(addProxy(link))
    .then((response) => {
      const { items } = parse(response.data.contents);
      const normalizedFetchedPosts = normalizePosts(id, items);

      const prevPosts = state.posts;
      const newPosts = differenceBy(normalizedFetchedPosts, prevPosts, 'link');
      state.posts = [...newPosts, ...prevPosts];
    })
    .finally(() => {
      state.loadingProcess.status = 'idle';
      state.loadingProcess.error = null;
      setTimeout(() => updatePosts(state), timeoutInterval);
    }));
};

export default () => {
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
  return i18next.init({
    lng: 'ru',
    fallbackLng: 'ru',
    resources: { ru },
  }).then(() => {
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
      if (isEmpty(link)) {
        return;
      }
      watchedState.form.status = 'disabled';

      const error = validate(link, watchedState.addedLinks);
      if (error) {
        watchedState.form.status = 'active';
        watchedState.form.error = error.type;
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
  });
};
