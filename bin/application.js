import rssParser from './rss-parser.js';

export default () => {
  const form = document.querySelector('#channelLinkForm');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    rssParser(formData.get('link'));
  });
};
