import _ from 'lodash';

const retrieveText = (element) => (tagName) => (element.querySelector(tagName)
  ? element.querySelector(tagName).textContent
  : null);

export default (xml) => {
  const parser = new DOMParser();
  const document = parser.parseFromString(xml, 'application/xml');

  if (document.querySelector('parsererror') !== null) {
    throw new Error('nodata');
  }

  const channel = document.querySelector('channel');
  const retrieveFromChannel = retrieveText(channel);
  const url = retrieveFromChannel('link');
  const title = retrieveFromChannel('title');
  const data = {
    url,
    title,
    description: retrieveFromChannel('description'),
  };

  const items = [...channel.querySelectorAll('item')];
  const contents = items.map((item) => {
    const retrieveFromItem = retrieveText(item);
    const pubDate = retrieveFromItem('pubDate');
    return {
      url,
      id: `${_.kebabCase(title)}-${Date.parse(new Date(pubDate))}`,
      title: retrieveFromItem('title'),
      description: retrieveFromItem('description'),
      link: retrieveFromItem('link'),
      creator: retrieveFromItem('creator'),
      pubDate,
    };
  });

  return [data, contents];
};
