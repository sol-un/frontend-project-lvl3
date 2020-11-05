import parser from './parser.js';

export default () => {
  const form = document.querySelector('#channelLinkForm');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const state = parser(formData.get('link'));
    console.log(state);
  });
};
