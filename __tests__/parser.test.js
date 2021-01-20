import process from '../src/data-handler.js';

describe('Parser: normal operation', () => {
  it('Should handle test feed', async () => {
    const [data, contents] = await process('http://lorem-rss.herokuapp.com/feed');
    expect(data.title).toBe('Lorem ipsum feed for an interval of 1 minutes with 10 item(s)');
    expect(contents.length).toBe(10);
  });
});
