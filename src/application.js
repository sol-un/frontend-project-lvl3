/* eslint-disable no-param-reassign */

import _ from 'lodash';
import i18next from 'i18next';
import { string } from 'yup';
import axios from 'axios';
import URI from 'urijs';
import { formatText } from './utils.js';
import en from './locales/en.js';
import ru from './locales/ru.js';
import es from './locales/es.js';
import parse from './parser.js';
import watchState from './renderer.js';
import 'bootstrap/dist/js/bootstrap.min.js';

const proxy = 'https://hexlet-allorigins.herokuapp.com/get';

const idPosts = (channelId, posts) => posts.map((post) => ({
  ...post,
  channelId,
  id: _.uniqueId(),
}));

const downloadChannel = (link, watchedState) => {
  watchedState.loadingProcess.status = 'fetching';
  return axios(proxy, {
    params: {
      disableCache: true,
      url: link,
    },
  })
    .then((response) => {
      const [channelData, channelContents] = parse(response.data.contents);
      const id = _.uniqueId();
      const fullChannelData = { ...channelData, id, link };
      const idedChannelContents = idPosts(id, channelContents);
      return [fullChannelData, idedChannelContents];
    })
    .then(([data, contents]) => {
      watchedState.form = {
        input: '',
        status: 'active',
        error: null,
      };
      watchedState.loadingProcess = {
        status: 'success',
        error: null,
      };
      watchedState.uiState.activeChannel = data.id;
      watchedState.channels = [...watchedState.channels, data];
      watchedState.posts = [...watchedState.posts, ...contents];
      watchedState.addedLinks = [...watchedState.addedLinks, link];
    })
    .catch((error) => {
      watchedState.loadingProcess = {
        status: 'error',
        error: error.response || error.request ? 'network' : error.message,
      };
      watchedState.form = { status: 'active', error: null };
    });
};

const getSchema = (blacklist) => string()
  .url()
  .notOneOf(blacklist);

const updatePosts = (state, updateInterval) => {
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
      const idedNewPosts = idPosts(id, newPosts);

      const prevPostsToAdd = _.intersectionBy(prevPosts, fetchedPosts, 'link');

      const postsToAdd = [...idedNewPosts, ...prevPostsToAdd];
      const otherPosts = state.posts.filter(({ channelId }) => channelId !== id);
      state.posts = [...otherPosts, ...postsToAdd];
    })
    .finally(() => {
      state.loadingProcess = { status: 'idle', error: null };
      setTimeout(() => updatePosts(state), updateInterval);
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
      activeChannel: null,
      viewedPosts: [],
      locale: null,
    },
    channels: [],
    posts: [],
    addedLinks: [],
    modalContents: { title: '', description: '' },
  };

  const watchedState = watchState(state);

  const updateInterval = 5000;
  setTimeout(() => updatePosts(watchedState, updateInterval), updateInterval);

  const nodeDispatcher = {
    form: document.querySelector('#addChannelForm'),
    links: [...document.querySelectorAll('.dropdown-menu > a')],
    modalCloseButton: document.querySelector('#previewModalCloseButton'),
  };

  nodeDispatcher.form.addEventListener('submit', (e) => {
    e.preventDefault();
    const link = new FormData(e.target).get('link');
    if (_.isEmpty(link)) {
      return;
    }
    const noHashLink = new URI(link).fragment('').toString();
    watchedState.form.status = 'disabled';
    try {
      getSchema(watchedState.addedLinks).validateSync(noHashLink);
      downloadChannel(noHashLink, watchedState);
    } catch (error) {
      watchedState.form = { status: 'active', error: error.type };
    }
  });

  nodeDispatcher.links.forEach((link) => link.addEventListener('click', (e) => {
    e.preventDefault();
    const locale = e.target.innerText.toLowerCase();
    watchedState.uiState.locale = locale;
  }));

  watchedState.uiState.locale = i18next.language;
});
