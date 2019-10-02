const getParams = props => {
  const { match: { params: content } } = props;

  // return inner url params, but also lowercase all values
  return Object.keys(content)
  .reduce((destination, key) => {
    destination[key] = (content[key] || "").toLowerCase();
    return destination;
  }, {});
};

export { getParams };
