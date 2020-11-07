import onChange from 'on-change';
import $ from 'jquery';
import process from './parser.js';
import render from './renderer.js';
import validate from './validator.js';

const updateState = (data, contents, watchedState) => {
  Object.assign(watchedState, { blacklist: [...watchedState.blacklist, watchedState.link] });
  Object.assign(watchedState, { link: '' });
  Object.assign(watchedState, { activeChannelId: data.id });
  Object.assign(watchedState, { channels: [...watchedState.channels, data] });
  Object.assign(watchedState, { articles: [...watchedState.articles, ...contents] });
};

export default () => {
  const state = {
    activeChannelId: null,
    link: '',
    linkStatus: null,
    blacklist: [],
    channels: [],
    articles: [],
    error: null,
  };

  const watchedState = onChange(state, (path) => {
    if (path !== 'link') {
      render(watchedState);
    }
  });

  $('#channelLinkForm').on('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    process(formData.get('link'))
      .then(([data, contents, error]) => {
        if (error) {
          return Object.assign(watchedState, { error });
        }
        return updateState(data, contents, watchedState);
      });
  });

  $('input').on('keyup', (e) => {
    const link = $(e.target).val();
    const { blacklist } = state;
    let linkStatus;
    let error;

    const errorMessageDispatcher = {
      url: 'The link is wrong or unsupported format!',
      notOneOf: 'You\'ve already added this channel!',
    };

    validate(link, blacklist)
      .then(({ type }) => {
        if (!type) {
          linkStatus = 'valid';
          error = null;
        } else {
          error = errorMessageDispatcher[type];
          linkStatus = 'invalid';
        }

        Object.assign(watchedState, { link });
        Object.assign(watchedState, { linkStatus });
        Object.assign(watchedState, { error });
      });
  });

  render(state);
};
