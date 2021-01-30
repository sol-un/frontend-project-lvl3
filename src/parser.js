const extractText = (element) => (tagName) => (element.querySelector(tagName)
  ? element.querySelector(tagName).textContent
  : null);

export default (xml) => {
  const parser = new DOMParser();
  const document = parser.parseFromString(xml, 'application/xml');

  if (document.querySelector('parsererror')) {
    throw new Error('nodata');
  }

  const channel = document.querySelector('channel');
  const extractFromChannel = extractText(channel);
  const channelData = {
    title: extractFromChannel('title'),
    description: extractFromChannel('description'),
  };

  const items = [...channel.querySelectorAll('item')];
  const channelContents = items.map((item) => {
    const extractFromItem = extractText(item);
    return {
      title: extractFromItem('title'),
      description: extractFromItem('description'),
      link: extractFromItem('link'),
      creator: extractFromItem('creator'),
      pubDate: extractFromItem('pubDate'),
    };
  });

  return [channelData, channelContents];
};
