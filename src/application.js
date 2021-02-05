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
import getWatchedState from './renderer.js';
import 'bootstrap/dist/js/bootstrap.min.js';

const process = (link) => axios.get(`https://hexlet-allorigins.herokuapp.com/get?disableCache=true&url=${encodeURIComponent(link)}`)
  .then((response) => {
    const [channelData, channelContents] = parse(response.data.contents);
    const id = _.uniqueId();
    const fullChannelData = { ...channelData, id, link };
    const idedChannelContents = channelContents.map((item) => ({
      ...item,
      channelId: id,
      id: _.uniqueId(),
    }));
    return [fullChannelData, idedChannelContents];
  })
  .catch((error) => {
    if (error.response || error.request) {
      throw new Error('network');
    } else {
      throw error;
    }
  });

const validate = (link, blacklist) => {
  const schema = string()
    .url()
    .notOneOf(blacklist);
  return schema.validate(link);
};

const updatePosts = (state) => {
  const { channels } = state;
  channels.map(({
    id, link,
  }) => axios.get(`https://hexlet-allorigins.herokuapp.com/get?disableCache=true&url=${encodeURIComponent(link)}`)
    .then((response) => {
      const [, newPosts] = parse(response.data.contents);
      const oldPosts = _.filter(state.posts, ({ channelId }) => channelId === id);
      const oldLinks = oldPosts.map((item) => item.link);
      const postsToAdd = newPosts.map((newPost) => {
        if (oldLinks.includes(newPost.link)) {
          return oldPosts.find((oldPost) => oldPost.link === newPost.link);
        }
        return {
          ...newPost,
          channelId: id,
          id: _.uniqueId(),
        };
      });
      const otherPosts = _.filter(state.posts, ({ channelId }) => channelId !== id);
      state.posts = [...otherPosts, ...postsToAdd];
    }));
  setTimeout(() => updatePosts(state), 5 * 1000);
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

  const watchedState = getWatchedState(state);
  setTimeout(() => updatePosts(watchedState), 5 * 1000);

  const nodeDispatcher = {
    form: document.querySelector('#addChannelForm'),
    links: [...document.querySelectorAll('.dropdown-menu > a')],
    modalCloseButton: document.querySelector('#previewModalCloseButton'),
  };

  nodeDispatcher.form.addEventListener('submit', (e) => {
    e.preventDefault();
    const link = new FormData(e.target).get('link');
    if (link.length === 0) {
      return;
    }
    const noHashLink = new URI(link).fragment('').toString();
    watchedState.loadingProcess.status = 'fetching';
    watchedState.form.status = 'disabled';
    validate(noHashLink, watchedState.addedLinks)
      .then(() => process(link)
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
          watchedState.addedLinks = [...watchedState.addedLinks, noHashLink];
        }))
      .catch((error) => {
        watchedState.form.status = 'active';
        if (error.name === 'ValidationError') {
          watchedState.loadingProcess.error = null;
          watchedState.form.error = error.type;
        } else if (error instanceof Error) {
          watchedState.loadingProcess = {
            status: error,
            error: error.message,
          };
          watchedState.form.error = null;
        }
      });
  });

  nodeDispatcher.links.forEach((link) => link.addEventListener('click', (e) => {
    e.preventDefault();
    const locale = e.target.innerText.toLowerCase();
    watchedState.uiState.locale = locale;
  }));

  watchedState.uiState.locale = i18next.language;
});
