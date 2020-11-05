import rssParser from '../bin/rss-parser.js';

describe('RSS Parser', () => {
  it('data should download', async () => {
    const [, contents] = await rssParser('http://lorem-rss.herokuapp.com/feed');
    expect(contents.length).toBe(10);
  });
});
