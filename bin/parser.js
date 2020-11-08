import axios from 'axios';
import _ from 'lodash';

const retrieveText = (element) => (tagName) => (element.querySelector(tagName)
  ? element.querySelector(tagName).textContent
  : null);

const parse = (xml) => {
  const id = _.uniqueId();
  const parser = new DOMParser();
  const document = parser.parseFromString(xml, 'application/xml');
  const channel = document.querySelector('channel');
  const retrieveFromChannel = retrieveText(channel);
  const data = {
    id,
    title: retrieveFromChannel('title'),
    description: retrieveFromChannel('description'),
    link: retrieveFromChannel('link'),
  };
  const items = Array.from(channel.querySelectorAll('item'));
  const contents = items.map((item) => {
    const retrieveFromItem = retrieveText(item);
    return {
      id,
      title: retrieveFromItem('title'),
      description: retrieveFromItem('description'),
      link: retrieveFromItem('link'),
      creator: retrieveFromItem('creator'),
      pubDate: retrieveFromItem('pubDate'),
    };
  });
  return [data, contents];
};

export default (link) => axios.get(`https://api.allorigins.win/get?url=${encodeURIComponent(link)}`)
  .then(({ data }) => {
    if (data.status.http_code !== 200) {
      throw new Error('Network error!');
    }
    return parse(data.contents);
  });
