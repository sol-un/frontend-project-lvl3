/* eslint-disable no-param-reassign */

import {
  uniqueId, differenceBy,
} from 'lodash';
import i18next from 'i18next';
import axios from 'axios';
import validate from './utils.js';
import ru from './locales/ru.js';
import parse from './parser.js';
import watchState from './renderer.js';
import 'bootstrap';

const addProxy = (link) => {
  const proxyUrl = new URL('get', 'https://hexlet-allorigins.herokuapp.com');
  proxyUrl.searchParams.set('disableCache', true);
  proxyUrl.searchParams.set('url', link);

  return proxyUrl.toString();
};

const timeoutInterval = 5000;

const normalizePosts = (channelId, posts) => posts.map((post) => ({
  ...post,
  channelId,
  id: uniqueId(),
}));

const downloadChannel = (link, watchedState) => {
  watchedState.loadingProcess = {
    ...watchedState.loadingProcess,
    status: 'fetching',
  };
  axios(addProxy(link))
    .then((response) => {
      const { title, description, items } = parse(response.data.contents);
      const id = uniqueId();
      const fullChannelData = {
        title, description, id, link,
      };
      const normalizedChannelContents = normalizePosts(id, items);

      watchedState.loadingProcess = {
        status: 'success',
        error: null,
      };
      watchedState.channels = [...watchedState.channels, fullChannelData];
      watchedState.posts = [...watchedState.posts, ...normalizedChannelContents];
    })
    .catch((error) => {
      watchedState.loadingProcess = {
        status: 'error',
        error: error.response || error.request ? 'network' : error.message,
      };
    });
};

const updatePosts = (state) => {
  const { channels } = state;
  const channelUpdatePromises = channels.map(({
    id, link,
  }) => axios(addProxy(link))
    .then((response) => {
      const { items } = parse(response.data.contents);
      const normalizedFetchedPosts = normalizePosts(id, items);

      const prevPosts = state.posts;
      const newPosts = differenceBy(normalizedFetchedPosts, prevPosts, 'link');
      state.posts = [...newPosts, ...state.posts];
    })
    .catch((error) => console.log(error)));
  Promise.all(channelUpdatePromises)
    .finally(() => setTimeout(() => updatePosts(state), timeoutInterval));
};

export default () => {
  const state = {
    form: {
      status: 'valid',
      error: null,
    },
    loadingProcess: {
      status: 'idle',
      error: null,
    },
    uiState: {
      viewedPosts: new Set(),
    },
    channels: [],
    posts: [],
    modalContentsId: null,
  };
  const i18nextInstance = i18next.createInstance();
  return i18nextInstance.init({
    lng: 'ru',
    resources: { ru },
  }).then((t) => {
    const nodeDispatcher = {
      modal: {
        modalTitle: document.querySelector('#previewModalTitle'),
        modalBody: document.querySelector('#previewModalBody'),
      },
      input: document.querySelector('input'),
      button: document.querySelector('#addButton'),
      channelsContainer: document.querySelector('#channels'),
      postsContainer: document.querySelector('#posts'),
      flashContainer: document.querySelector('.feedback'),
      form: document.querySelector('#addChannelForm'),
    };

    const watchedState = watchState(state, nodeDispatcher, t);

    setTimeout(() => updatePosts(watchedState), timeoutInterval);

    nodeDispatcher.form.addEventListener('submit', (e) => {
      e.preventDefault();
      const link = new FormData(e.target).get('link');

      const addedLinks = watchedState.channels.map(({ link: channelLink }) => channelLink);
      const error = validate(link, addedLinks);
      if (error) {
        watchedState.form = {
          valid: false,
          error: error.type,
        };
      } else {
        watchedState.form = { valid: true, error: null };
        downloadChannel(link, watchedState);
      }
    });

    nodeDispatcher.postsContainer.addEventListener('click', ({ target }) => {
      const postId = target.dataset.id;
      if (!postId) {
        return;
      }
      watchedState.modalContentsId = postId;
      watchedState.uiState.viewedPosts.add(postId);
    });
  });
};
