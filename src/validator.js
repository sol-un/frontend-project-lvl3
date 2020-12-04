import { string } from 'yup';

export default (link, blacklist) => {
  const schema = string()
    .url()
    .notOneOf(blacklist);
  return schema
    .validate(link)
    .catch((e) => e);
};
