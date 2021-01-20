import axios from 'axios';
import parse from './parser.js';

export default (link) => axios.get(`https://api.allorigins.win/get?url=${encodeURIComponent(link)}`)
  .then(({ data }) => parse(data.contents))
  .catch((error) => {
    if (error.response || error.request) {
      throw new Error('network');
    } else {
      throw error;
    }
  });
