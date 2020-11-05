import rssParser from '../bin/rss-parser.js';

describe('RSS Parser', () => {
  it('tests should run', () => {
    expect(rssParser()).toBe(undefined);
  });
});
