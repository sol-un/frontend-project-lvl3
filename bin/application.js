import onChange from 'on-change';
import $ from 'jquery';
import i18next from 'i18next';
import en from '../locales/en.js';
import ru from '../locales/ru.js';
import es from '../locales/es.js';
import process from './parser.js';
import render from './renderer.js';
import validate from './validator.js';

const savedState = JSON.parse(localStorage.getItem('SJRssPageState'));

const articlesUpdater = (state, t) => {
  const {
    channels,
  } = onChange.target(state);
  channels.map(({
    url,
  }) => process(url)
    .then(([, contents]) => {
      onChange
        .target(state)
        .articles = onChange.target(state).articles.filter((o) => o.url !== url).concat(contents);
    })
    .catch(() => {}));
  setTimeout(() => articlesUpdater(state, t), 5 * 1000);
  render(state, t);
};

const inputValueHandle = (e, state) => {
  const link = $(e.target).val();
  const { channels } = state;
  const newState = onChange.target(state);
  const blacklist = channels.map(({ url }) => url);
  let linkStatus;
  let message;

  const errorMessageDispatcher = {
    url: 'url',
    notOneOf: 'notOneOf',
  };

  validate(link, blacklist)
    .then(({ type }) => {
      if (!type) {
        linkStatus = 'valid';
        message = null;
      } else {
        linkStatus = 'invalid';
        message = errorMessageDispatcher[type];
      }

      newState.link = link;
      newState.linkStatus = linkStatus;
      newState.error = message;
    });
};

const updateState = (data, contents, state) => {
  const newState = onChange.target(state);
  newState.link = '';
  newState.linkStatus = 'valid';
  newState.activeChannelUrl = data.url;
  newState.channels = [...newState.channels, data];
  newState.articles = [...newState.articles, ...contents];
};

export default () => i18next.init({
  lng: savedState && savedState.locale,
  fallbackLng: 'en',
  resources: { en, ru, es },
}).then((t) => {
  const state = savedState || {
    activeChannelUrl: null,
    link: '',
    linkStatus: null,
    channels: [],
    articles: [],
    error: null,
    locale: i18next.language,
  };

  const watchedState = onChange(state, (path) => {
    console.log(watchedState);
    localStorage.setItem('SJRssPageState', JSON.stringify(state));
    if (path === 'locale') {
      i18next.changeLanguage(watchedState.locale);
      render(watchedState, t);
    }
    if (path !== 'link') {
      render(watchedState, t);
    }
    if (watchedState.channels.length > 0 && !watchedState.activeChannelUrl) {
      watchedState.activeChannelUrl = watchedState.channels[0].url;
    }
  });

  setTimeout((prevState = watchedState) => articlesUpdater(prevState, t), 5 * 1000);

  $('#addChannelForm').on('submit', (e) => {
    e.preventDefault();
    const link = new FormData(e.target).get('link');
    if (link.length === 0) {
      return;
    }
    process(link)
      .then(([data, contents]) => updateState(data, contents, watchedState))
      .catch(({
        message,
      }) => {
        watchedState.error = message;
        watchedState.linkStatus = 'valid';
      });
    watchedState.linkStatus = 'loading';
  });

  $('input').on('keyup', (e) => inputValueHandle(e, watchedState));
  $('input').on('focus', (e) => inputValueHandle(e, watchedState));

  $('#deleteAllButton').on('click', () => {
    localStorage.setItem('SJRssPageState', null);
    window.location.reload();
  });

  const links = $('#languageDropdown')
    .next()
    .find('a');
  $(links).each((_i, item) => $(item).on('click', (e) => {
    e.preventDefault();
    const locale = e.target.innerText.toLowerCase();
    watchedState.locale = locale;
  }));

  render(watchedState, t);
});
