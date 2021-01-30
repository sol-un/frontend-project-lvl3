import _ from 'lodash';
import i18next from 'i18next';
import { string } from 'yup';
import axios from 'axios';
import { formatText } from './utils.js';
import en from './locales/en.js';
import ru from './locales/ru.js';
import es from './locales/es.js';
import parse from './parser.js';
import watchedState from './watcher.js';

// const process = (link) => axios.get(`https://api.allorigins.win/get?url=${encodeURIComponent(link)}`)
const process = (link) => axios.get(`https://cors-anywhere.herokuapp.com/${link}`)
  .then((response) => {
    const [channelData, channelContents] = parse(response.data);
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
  if (state.uiState.modalVisibility === 'show' || state.loadingProcess.status === 'fetching') {
    setTimeout(() => updatePosts(state), 5 * 1000);
    return;
  }
  const { channels } = state;
  channels.map(({
    id, link,
  }) => axios.get(`https://cors-anywhere.herokuapp.com/${link}`)
    .then((response) => {
      const [, newPosts] = parse(response.data);
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
      _.set(state, 'posts', [...otherPosts, ...postsToAdd]);
    }));
  setTimeout(() => updatePosts(state), 5 * 1000);
};

export default () => i18next.init({
  interpolation: { format: formatText },
  lng: 'en',
  resources: { en, ru, es },
}).then(() => {
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
    _.set(watchedState, 'loadingProcess.status', 'fetching');
    validate(link, watchedState.addedLinks)
      .then(() => {
        _.set(watchedState, 'form.status', 'disabled');
        return process(link)
          .then(([data, contents]) => {
            _.set(watchedState, 'form.input', '');
            _.set(watchedState, 'form.status', 'active');
            _.set(watchedState, 'form.error', null);
            _.set(watchedState, 'loadingProcess.status', 'success');
            _.set(watchedState, 'loadingProcess.error', null);
            _.set(watchedState, 'uiState.activeChannel', data.id);
            _.set(watchedState, 'channels', [...watchedState.channels, data]);
            _.set(watchedState, 'posts', [...watchedState.posts, ...contents]);
            _.set(watchedState, 'addedLinks', [...watchedState.addedLinks, link]);
          });
      })
      .catch((error) => {
        _.set(watchedState, 'form.input', link);
        _.set(watchedState, 'form.status', 'active');
        if (error.name === 'ValidationError') {
          _.set(watchedState, 'loadingProcess.error', null);
          _.set(watchedState, 'form.error', error.type);
        } else if (error instanceof Error) {
          _.set(watchedState, 'form.error', null);
          _.set(watchedState, 'loadingProcess.status', 'error');
          _.set(watchedState, 'loadingProcess.error', error.message);
        }
      });
  });

  nodeDispatcher.links.forEach((link) => link.addEventListener('click', (e) => {
    e.preventDefault();
    const locale = e.target.innerText.toLowerCase();
    _.set(watchedState, 'uiState.locale', locale);
  }));

  nodeDispatcher.modalCloseButton.addEventListener('click', () => {
    _.set(watchedState, 'uiState.modalVisibility', 'hide');
  });

  _.set(watchedState, 'uiState.locale', i18next.language);
});
