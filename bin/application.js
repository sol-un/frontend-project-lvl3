import parser from './parser.js';

export default () => {
  const state = {
    channels: [],
    articles: [],
  };
  const form = document.querySelector('#channelLinkForm');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    parser(formData.get('link'))
      .then(([data, contents]) => {
        state.channels.push(data);
        state.articles = [...state.articles, ...contents];
        console.log(state);
      });
  });
};
