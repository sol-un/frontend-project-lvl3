import onChange from 'on-change';
import _ from 'lodash';
import i18next from 'i18next';
import { string } from 'yup';
import { formatText } from './utils.js';
import en from './locales/en.js';
import ru from './locales/ru.js';
import es from './locales/es.js';
import process from './data-handler.js';
import render from './renderer.js';
import validate from './validator.js';

const articlesUpdater = (state) => {
  if (state.uiState.modalVisibility === 'show' || state.loadingProcess.status === 'fetching') {
    setTimeout(() => articlesUpdater(state), 5 * 1000);
    return;
  }
  const { channels } = onChange.target(state);
  channels.map(({
    url,
  }) => process(url)
    .then(([, contents]) => _.set(onChange.target(state), 'posts', _.concat(contents, _.filter(onChange.target(state).posts, (o) => o.url !== url))))
    .catch(() => _.noop()));
  setTimeout(() => articlesUpdater(state), 5 * 1000);
};

export default () => i18next.init({
  interpolation: { format: formatText },
  lng: 'en',
  resources: { en, ru, es },
}).then(() => {
  const state = {
    form: {
      input: '',
      status: 'active',
      error: null,
    },
    loadingProcess: {
      status: 'idle',
      error: null,
    },
    uiState: {
      modalVisibility: 'hide',
      activeChannel: null,
      viewedPosts: new Set(),
      locale: null,
    },
    channels: [],
    posts: [],
    addedLinks: [],
    modalContents: { title: '', description: '' },
  };

  const watchedState = onChange(state, (path) => {
    if (path === 'uiState.locale') {
      i18next.changeLanguage(watchedState.uiState.locale);
    }
    render(watchedState);
  });

  setTimeout((prevState = watchedState) => articlesUpdater(prevState), 5 * 1000);

  const nodeDispatcher = {
    form: document.querySelector('#addChannelForm'),
    links: [...document.querySelectorAll('.dropdown-menu > a')],
  };

  nodeDispatcher.form.addEventListener('submit', (e) => {
    e.preventDefault();
    const link = new FormData(e.target).get('link');
    if (link.length === 0) {
      return;
    }
    const blacklist = watchedState.addedLinks.flatMap((o) => Object.values(o));
    validate(link, blacklist)
      .then(() => {
        _.set(watchedState, 'form.status', 'disabled');
        _.set(watchedState, 'loadingProcess.status', 'fetching');
        return process(link)
          .then(([data, contents]) => {
            _.set(watchedState, 'form.input', '');
            _.set(watchedState, 'form.status', 'active');
            _.set(watchedState, 'form.error', null);
            _.set(watchedState, 'loadingProcess.status', 'success');
            _.set(watchedState, 'loadingProcess.error', null);
            _.set(watchedState, 'uiState.activeChannelUrl', data.url);
            _.set(watchedState, 'channels', [...watchedState.channels, data]);
            _.set(watchedState, 'posts', [...watchedState.posts, ...contents]);
            _.set(watchedState, 'addedLinks', [...watchedState.addedLinks, { [data.url]: link }]);
          })
          .catch((error) => {
            throw error;
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

  _.set(watchedState, 'uiState.locale', i18next.language);
});
