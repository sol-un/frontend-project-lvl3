import onChange from 'on-change';
import $ from 'jquery';
import _ from 'lodash';
import i18next from 'i18next';
import en from '../locales/en.js';
import ru from '../locales/ru.js';
import es from '../locales/es.js';
import process from './parser.js';
import render from './renderer.js';
import validate from './validator.js';

const updateState = (data, contents, watchedState) => {
  _.set(watchedState, 'blacklist', [...watchedState.blacklist, watchedState.link]);
  _.set(watchedState, 'link', '');
  _.set(watchedState, 'activeChannelId', data.id);
  _.set(watchedState, 'channels', [...watchedState.channels, data]);
  _.set(watchedState, 'articles', [...watchedState.articles, ...contents]);
};

export default () => i18next.init({
  lng: 'en',
  resources: { en, ru, es },
}).then((t) => {
  const state = JSON.parse(localStorage.getItem('state')) || {
    activeChannelId: null,
    link: '',
    linkStatus: null,
    blacklist: [],
    channels: [],
    articles: [],
    error: null,
    locale: null,
  };

  const watchedState = onChange(state, (path) => {
    localStorage.setItem('state', JSON.stringify(state));
    if (path === 'locale') {
      i18next.changeLanguage(state.locale);
      render(watchedState, t);
    }
    if (path !== 'link') {
      render(watchedState, t);
    }
  });

  $('#channelLinkForm').on('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    process(formData.get('link'))
      .then(([data, contents]) => updateState(data, contents, watchedState))
      .catch(({ message }) => _.set(watchedState, 'error', message));
  });

  $('input').on('keyup', (e) => {
    const link = $(e.target).val();
    const { blacklist } = state;
    let linkStatus;
    let message;

    const errorMessageDispatcher = {
      url: 'The link is wrong or unsupported format!',
      notOneOf: 'You\'ve already added this channel!',
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

        _.set(watchedState, 'link', link);
        _.set(watchedState, 'linkStatus', linkStatus);
        _.set(watchedState, 'error', message);
      });
  });

  $('#deleteAllButton').on('click', () => {
    localStorage.clear();
    window.location.reload();
  });

  const links = $('#languageDropdown')
    .next()
    .find('a');
  $(links).each((_i, item) => $(item).on('click', (e) => {
    e.preventDefault();
    const locale = e.target.innerText.toLowerCase();
    _.set(watchedState, 'locale', locale);
  }));

  render(state, t);
});
