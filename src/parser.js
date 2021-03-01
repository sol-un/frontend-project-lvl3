const extractText = (element) => (tagName) => (element.querySelector(tagName)
  ? element.querySelector(tagName).textContent
  : null);

export default (xml) => {
  const parser = new DOMParser();
  const document = parser.parseFromString(xml, 'application/xml');

  if (document.querySelector('parsererror')) {
    throw new Error('nodata');
  }

  const channelData = document.querySelector('channel');
  const extractFromChannel = extractText(channelData);
  const title = extractFromChannel('title');
  const description = extractFromChannel('description');

  const items = [...channelData.querySelectorAll('item')]
    .map((item) => {
      const extractFromItem = extractText(item);
      return {
        title: extractFromItem('title'),
        description: extractFromItem('description'),
        link: extractFromItem('link'),
        creator: extractFromItem('creator'),
      };
    });

  return { title, description, items };
};
