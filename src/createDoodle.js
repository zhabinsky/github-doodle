const convertToRGB = require ('hex-rgb');
const chalk = require ('chalk');
const Jimp = require ('jimp');
const {promisify} = require ('util');
const moment = require ('moment');

const dateFormat = 'ddd DD MMM YYYY h:mm:ss';
const colors = ['#ffff', '#c6e48b', '#7bc96f', '#239a3b', '#196127'];
const target = [2, 2];
// const target = [51, 7];

const instantiateImage = async name => {
  return promisify (Jimp.read) (name)
    .then (img => {
      const {bitmap: bm} = img;
      const exec = (a, ...args) => new Promise (r => img[a] (...args, r));
      return {
        scan: f => exec ('scan', 0, 0, bm.width, bm.height, f),
        exec,
      };
    })
    .catch (err => {
      throw err;
    });
};

const rgbColors = colors
  .map (convertToRGB)
  .map (({red, green, blue}) => [red, green, blue]);

async function getColorRange (image) {
  let dark = 0, light = 255;

  const figureOutRange = function (x, y, index) {
    const value = this.bitmap.data[index];
    if (value > dark) dark = value;
    if (value < light) light = value;
  };

  await image.scan (figureOutRange);

  return {
    dark,
    light,
  };
}

const paintCell = (range, cells) => {
  return function (x, y, index) {
    const bm = this.bitmap.data;

    // map pixel to color index
    const delta = bm[index] - range.light;
    const step = (range.dark - range.light) / rgbColors.length * 1.1;
    const colorIndex = rgbColors.length - 1 - Math.floor (delta / step);

    const color = rgbColors[colorIndex];

    // change pixel color
    bm[index + 0] = color[0];
    bm[index + 1] = color[1];
    bm[index + 2] = color[2];

    const dateStart = '31-12-2017';
    let count = 0;

    const getDate = () => {
      count++;
      return moment (dateStart, 'DD-MM-YYYY')
        .add (x, 'weeks')
        .add (y, 'days')
        .hours (12)
        .utcOffset (2, false)
        .add (count, 'seconds')
        .format (dateFormat);
    };

    // save pixel cell
    cells.push ({
      dates: new Array (colorIndex * 5).fill ().map (getDate),
      text: chalk.bgRgb (...color) (' ' + chalk.black (colorIndex)),
      index,
    });

    return color;
  };
};

async function paintCanvas (image) {
  const cells = [];
  const range = await getColorRange (image);

  await image.scan (paintCell (range, cells));

  // break line
  const br = ({text}, i) => text + ((i + 1) % target[0] === 0 ? '\n' : '');
  const pattern = cells
    .sort ((b, a) => b.index - a.index)
    .map (br)
    .join ('')
    .trim ();

  const dates = [];
  cells.forEach (cell => dates.push (...cell.dates));
  dates.sort ((a, b) => moment (a, dateFormat).diff (moment (b, dateFormat)));

  return [pattern, dates];
}

const createDoodle = async file => {
  const image = await instantiateImage (file);

  // resize
  await image.exec ('cover', ...target);
  await image.exec ('greyscale');

  const [pattern, dates] = await paintCanvas (image);

  // show preview of the doodle
  console.log (pattern);
};

module.exports = createDoodle;
