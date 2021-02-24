/* eslint-disable no-param-reassign */

import {
  uniqueId, differenceBy, isEmpty, flatten,
} from 'lodash';
import i18next from 'i18next';
import axios from 'axios';
import { validate } from './utils.js';
import ru from './locales/ru.js';
import parse from './parser.js';
import watchState from './renderer.js';
import 'bootstrap/dist/js/bootstrap.min.js';

const addProxy = (link) => {
  const proxyUrl = new URL('https://hexlet-allorigins.herokuapp.com/get');

  const searchParams = new URLSearchParams();
  searchParams.set('disableCache', true);
  searchParams.set('url', link);
  proxyUrl.search = searchParams;

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

      watchedState.form = {
        status: 'active',
        error: null,
      };
      watchedState.loadingProcess = {
        status: 'success',
        error: null,
      };
      watchedState.channels = [...watchedState.channels, fullChannelData];
      watchedState.posts = [...watchedState.posts, ...normalizedChannelContents];
      watchedState.addedLinks = [...watchedState.addedLinks, link];
    })
    .catch((error) => {
      watchedState.loadingProcess = {
        status: 'error',
        error: error.response || error.request ? 'network' : error.message,
      };
      watchedState.form = { ...watchedState.form, status: 'active' };
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
      return newPosts;
    }));
  Promise.all(channelUpdatePromises)
    .then((fetchedPosts) => {
      state.posts = flatten([...fetchedPosts, ...state.posts]);
      state.loadingProcess = {
        status: 'idle',
        error: null,
      };
      setTimeout(() => updatePosts(state), timeoutInterval);
    });
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
      viewedPosts: new Set(),
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

    const watchedState = watchState(state, nodeDispatcher);

    setTimeout(() => updatePosts(watchedState), timeoutInterval);

    nodeDispatcher.form.addEventListener('submit', (e) => {
      e.preventDefault();
      const link = new FormData(e.target).get('link');
      if (isEmpty(link)) {
        return;
      }
      watchedState.form = { ...watchedState.form, status: 'disabled' };

      const error = validate(link, watchedState.addedLinks);
      if (error) {
        watchedState.form = {
          status: 'active',
          error: error.type,
        };
      } else {
        watchedState.form = { ...watchedState.form, error: null };
        downloadChannel(link, watchedState);
      }
    });

    nodeDispatcher.postsContainer.addEventListener('click', ({ target }) => {
      const postId = target.getAttribute('data-id');
      if (!postId) {
        return;
      }
      const { title, description } = watchedState.posts.find(({ id }) => id === postId);
      watchedState.modalContents = { title, description };
      watchedState.uiState.viewedPosts.add(postId);
    });
  });
};
