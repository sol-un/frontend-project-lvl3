import parser from '../bin/parser.js';

describe('Parser', () => {
  it('should fetch 10 items from test feed', async () => {
    const [, contents] = await parser('http://lorem-rss.herokuapp.com/feed');
    expect(contents.length).toBe(10);
  });
});
