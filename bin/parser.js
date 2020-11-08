import axios from 'axios';
import _ from 'lodash';
import $ from 'jquery';

const retrieveText = (node) => (selector) => $(node).find(selector).text();

const parse = (xml) => {
  const id = _.uniqueId();
  const document = $.parseXML(xml);
  const xmlDoc = $(document);
  const retrieveFromDoc = retrieveText(xmlDoc);

  const data = {
    id,
    title: retrieveFromDoc('channel > title'),
    description: retrieveFromDoc('channel > description'),
    link: retrieveFromDoc('channel > link'),
  };

  const items = xmlDoc.find('item');
  const contents = $(items).map((_i, item) => {
    const retrieveFromItem = retrieveText(item);
    return {
      id,
      title: retrieveFromItem('title'),
      description: retrieveFromItem('description'),
      link: retrieveFromItem('link'),
      creator: item.querySelector('creator') ? item.querySelector('creator').textContent : null,
      pubDate: retrieveFromItem('pubDate'),
    };
  }).toArray();

  return [data, contents];
};

export default (link) => axios.get(`https://api.allorigins.win/get?url=${encodeURIComponent(link)}`)
  .then(({ data }) => {
    if (data.status.http_code !== 200) {
      throw new Error('Network error!');
    }
    return parse(data.contents);
  });
