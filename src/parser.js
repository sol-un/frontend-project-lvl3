import axios from 'axios';
import $ from 'jquery';
import _ from 'lodash';

const retrieveText = (node) => (selector) => $(node).find(selector).text();

const parse = (xml, url) => {
  const document = $.parseXML(xml);
  const xmlDoc = $(document);
  const retrieveFromDoc = retrieveText(xmlDoc);

  const data = {
    title: retrieveFromDoc('channel > title'),
    description: retrieveFromDoc('channel > description'),
    url,
  };

  const items = xmlDoc.find('item');
  const contents = $(items).map((_i, item) => {
    const retrieveFromItem = retrieveText(item);
    const title = retrieveFromItem('title');
    const pubDate = retrieveFromItem('pubDate');
    return {
      url,
      id: `${_.kebabCase(title)}-${Date.parse(new Date(pubDate))}`,
      title,
      description: retrieveFromItem('description'),
      link: retrieveFromItem('link'),
      creator: item.querySelector('creator')?.textContent,
      pubDate,
    };
  }).toArray();

  return [data, contents];
};

export default (link) => axios.get(`https://api.allorigins.win/get?url=${encodeURIComponent(link)}`)
  .then(({ data }) => {
    if (data && !data.contents.includes('<?xml')) {
      throw new Error('url');
    }
    if (data.status.http_code !== 200) {
      throw new Error('network');
    }
    return parse(data.contents, link);
  });
