import axios from 'axios';
import $ from 'jquery';

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
    return {
      url,
      title: retrieveFromItem('title'),
      description: retrieveFromItem('description'),
      link: retrieveFromItem('link'),
      creator: item.querySelector('creator')?.textContent,
      pubDate: retrieveFromItem('pubDate'),
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
