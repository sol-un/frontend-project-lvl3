const formatText = (value, format) => {
  switch (format) {
    case 'italic':
      return `<i>${value}</i>`;
    case 'link':
      return `<a data-toggle="collapse" href="#collapseLinks" role="button" aria-expanded="false" aria-controls="collapseExample">${value}</a>`;
    case 'pseudolink':
      return `<u class="user-select-all">${value}</u>`;
    default:
      return value;
  }
};

const formatDate = (timestamp) => {
  const normalizedDate = new Date(timestamp);
  const day = normalizedDate.getDate();
  const month = normalizedDate.getMonth();
  const year = normalizedDate.getFullYear();
  const [digit1, digit2] = normalizedDate.getMinutes().toString();
  const minutes = digit2 ? `${digit1}${digit2}` : `0${digit1}`;
  const time = `${normalizedDate.getHours()}:${minutes}`;

  return {
    time, day, month, year,
  };
};

export { formatDate, formatText };