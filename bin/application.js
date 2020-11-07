import onChange from 'on-change';
import $ from 'jquery';
import parse from './parser.js';
import render from './renderer.js';

export default () => {
  const state = {
    activeChannelId: null,
    channels: [],
    articles: [],
  };

  const watchedState = onChange(state, () => {
    render(watchedState);
  });

  $('#channelLinkForm').on('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    parse(formData.get('link'))
      .then(([data, contents]) => {
        watchedState.activeChannelId = data.id;
        watchedState.channels.push(data);
        watchedState.articles = [...state.articles, ...contents];
      })
      .catch((error) => console.log(error));
  });

  render(state);
};
