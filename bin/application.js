import onChange from 'on-change';
import $ from 'jquery';
import _ from 'lodash';
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

        _.set(watchedState, 'link', link);
        _.set(watchedState, 'linkStatus', linkStatus);
        _.set(watchedState, 'error', message);
      });
  });

  render(state);
};
