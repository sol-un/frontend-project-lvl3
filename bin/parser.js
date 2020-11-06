import axios from 'axios';
import _ from 'lodash';

const parse = (xml) => {
  const id = _.uniqueId();
  const parser = new DOMParser();
  const document = parser.parseFromString(xml, 'application/xml');
  const channel = document.querySelector('channel');
  const [channelTitle, channelDescription, channelLink] = Array.from(channel.childNodes);
  const data = {
    id,
    title: channelTitle.textContent,
    description: channelDescription.textContent,
    link: channelLink.textContent,
  };
  const items = Array.from(channel.querySelectorAll('item'));
  const contents = items.map((item) => {
    const [title, description, link, , creator, pubDate] = Array.from(item.childNodes);
    return {
      id,
      title: title.textContent,
      description: description.textContent,
      link: link.textContent,
      creator: creator.textContent,
      pubDate: pubDate.textContent,
    };
  });
  return [data, contents];
};

export default (link) => axios.get(`https://api.allorigins.win/get?url=${encodeURIComponent(link)}`)
  .then(({ data }) => parse(data.contents))
  .catch((error) => error);
