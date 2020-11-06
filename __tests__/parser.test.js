import parser from '../bin/parser.js';

describe('Parser: normal operation', () => {
  it('Should handle test feed', async () => {
    const [data, contents] = await parser('http://lorem-rss.herokuapp.com/feed');
    expect(data.title).toBe('Lorem ipsum feed for an interval of 1 minutes with 10 item(s)');
    expect(contents.length).toBe(10);
  });
});
