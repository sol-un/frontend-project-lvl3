import axios from 'axios';
import parse from './parser.js'

export default (link) => axios.get(`https://api.allorigins.win/get?url=${encodeURIComponent(link)}`)
  .then(({ data }) => {
    if (data && !data.contents.includes('<?xml')) {
      throw new Error('nodata');
    }
    if (data.status.http_code !== 200) {
      throw new Error('network');
    }
    return parse(data.contents);
  });
