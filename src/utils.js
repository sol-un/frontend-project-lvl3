import i18next from 'i18next';
import { string } from 'yup';

const t = (key, data) => i18next.t(key, data);

const validate = (link, blacklist) => {
  const schema = string()
    .url()
    .notOneOf(blacklist);
  try {
    return schema.validateSync(link);
  } catch (error) {
    return error;
  }
};

export {
  t, validate,
};
