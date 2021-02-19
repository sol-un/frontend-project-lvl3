const extractText = (element) => (tagName) => (element.querySelector(tagName)
  ? element.querySelector(tagName).textContent
  : null);

export default (xml) => {
  const parser = new DOMParser();
  const document = parser.parseFromString(xml, 'application/xml');

  if (document.querySelector('parsererror')) {
    throw new Error('nodata');
  }
  const result = { items: [] };
  const channelData = document.querySelector('channel');
  const extractFromChannel = extractText(channelData);
  result.title = extractFromChannel('title');
  result.description = extractFromChannel('description');

  [...channelData.querySelectorAll('item')]
    .reduce((acc, item) => {
      const extractFromItem = extractText(item);
      const data = {
        title: extractFromItem('title'),
        description: extractFromItem('description'),
        link: extractFromItem('link'),
        creator: extractFromItem('creator'),
        pubDate: extractFromItem('pubDate'),
      };
      acc.items.push(data);
      return acc;
    }, result);

  return result;
};
