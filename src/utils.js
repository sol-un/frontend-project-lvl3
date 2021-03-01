import i18next from 'i18next';
import { string } from 'yup';

const t = (key, data) => i18next.t(key, data);

const validate = (link, blacklist) => {
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

export {
  t, validate,
};
