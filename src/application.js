import onChange from 'on-change';
import _ from 'lodash';
import i18next from 'i18next';
import en from './locales/en.js';
import ru from './locales/ru.js';
import es from './locales/es.js';
import process from './parser.js';
import render from './renderer.js';
import validate from './validator.js';

const articlesUpdater = (state) => {
  if (document.body.classList.contains('modal-open')) {
    setTimeout(() => articlesUpdater(state), 5 * 1000);
    return;
  }
  const { channels } = onChange.target(state);
  channels.map(({
    url,
  }) => process(url)
    .then(([, contents]) => _.set(onChange.target(state), 'articles', _.concat(contents, _.filter(onChange.target(state).articles, (o) => o.url !== url))))
    .catch(() => _.noop())
    .then(() => setTimeout(() => articlesUpdater(state), 5 * 1000)));
};

const updateState = (data, contents, watchedState) => {
  _.set(watchedState, 'link', '');
  _.set(watchedState, 'linkStatus', 'valid');
  _.set(watchedState, 'activeChannelUrl', data.url);
  _.set(watchedState, 'channels', [...watchedState.channels, data]);
  _.set(watchedState, 'articles', [...watchedState.articles, ...contents]);
};

export default () => i18next.init({
  lng: 'en',
  resources: { en, ru, es },
}).then(() => {
  const state = {
    activeChannelUrl: null,
    link: '',
    linkStatus: null,
    channels: [],
    articles: [],
    viewed: [],
    error: null,
    locale: i18next.language,
  };

  const watchedState = onChange(state, (path) => {
    if (path === 'locale') {
      i18next.changeLanguage(watchedState.locale);
      render(watchedState);
    }
    if (path !== 'link') {
      render(watchedState);
    }
    if (watchedState.channels.length > 0 && !watchedState.activeChannelUrl) {
      watchedState.activeChannelUrl = watchedState.channels[0].url;
    }
  });

  setTimeout((prevState = watchedState) => articlesUpdater(prevState), 5 * 1000);

  const form = document.querySelector('#addChannelForm');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const link = new FormData(e.target).get('link');
    const blacklist = watchedState.channels.map(({ url }) => url);
    validate(link, blacklist)
      .then(() => process(link)
        .then(([data, contents]) => updateState(data, contents, watchedState))
        .catch((error) => {
          throw error;
        }))
      .catch((error) => {
        const errorType = error.type || error.message;
        _.set(watchedState, 'linkStatus', 'invalid');
        _.set(watchedState, 'error', errorType);
      });
  });

  const links = [...document.querySelectorAll('.dropdown-menu > a')];
  links.forEach((link) => link.addEventListener('click', (e) => {
    e.preventDefault();
    const locale = e.target.innerText.toLowerCase();
    _.set(watchedState, 'locale', locale);
  }));
  render(watchedState);
});
