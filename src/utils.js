import { string } from 'yup';

export default (link, blacklist) => {
  const schema = string()
    .required()
    .url()
    .notOneOf(blacklist);
  try {
    schema.validateSync(link);
    return null;
  } catch (error) {
    return error;
  }
};
