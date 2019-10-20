import wiiuIcon from './img/wiiu.png';
import switchIcon from './img/switch.png';
import bothIcon from './img/both.png';

const getParams = props => {
  const { match: { params: content } } = props;

  // return inner url params, but also lowercase all values
  return Object.keys(content)
  .reduce((destination, key) => {
    destination[key] = (content[key] || "").toLowerCase();
    return destination;
  }, {});
};

const platformIcons = {
  wiiu: wiiuIcon,
  switch: switchIcon,
  both: bothIcon
}

export { getParams, platformIcons };
