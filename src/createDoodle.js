const convertToRGB = require ('hex-rgb');
const chalk = require ('chalk');
const Jimp = require ('jimp');

const loadImage = async name => {
  return new Promise (function (res) {
    Jimp.read (name, async (err, img) => {
      if (err) throw err;
      const exec = (a, ...args) => new Promise (r => img[a] (...args, r));
      const bm = () => img.bitmap;
      const scan = f => exec ('scan', 0, 0, bm ().width, bm ().height, f);

      let filename = name.split ('/');
      filename = filename[filename.length - 1];

      const pattern = filename.split ('.')[0] + '.jpg';
      const save = async () => await exec ('write', pattern);
      const image = {
        exec,
        save,
        scan,
      };
      res (image);
    });
  });
};

const getPixelValue = (b, i) => (b[i] + b[i + 1] + b[i + 2]) / 3;
const colors = ['#ffff', '#c6e48b', '#7bc96f', '#239a3b', '#196127']
  .map (convertToRGB)
  .map (({red, green, blue}) => [red, green, blue]);
const target = [51, 7];

async function inspectColorRange (image) {
  let darkest = 0, lightest = 255;
  const figureOutRange = function (x, y, index) {
    const value = getPixelValue (this.bitmap.data, index);
    if (value > darkest) darkest = value;
    if (value < lightest) lightest = value;
  };
  await image.scan (figureOutRange);
  return {
    darkest,
    lightest,
  };
}

const paintCell = (range, terminalCells) => {
  return function (x, y, index) {
    const value = getPixelValue (this.bitmap.data, index);
    const delta = range.darkest - range.lightest;
    const deltaStep = delta / colors.length * 1.1;
    const deltaPixel = value - range.lightest;
    const colorIndex = colors.length - 1 - Math.floor (deltaPixel / deltaStep);
    const color = colors[colorIndex];

    //change pixel color
    this.bitmap.data[index + 0] = color[0];
    this.bitmap.data[index + 1] = color[1];
    this.bitmap.data[index + 2] = color[2];

    // save pixel cell
    terminalCells.push ({
      text: chalk.bgRgb (...color) (' ' + chalk.black (colorIndex)),
      index,
    });

    return color;
  };
};

async function paintCanvas (image) {
  const range = await inspectColorRange (image);
  const terminalCells = [];

  const scanner = paintCell (range, terminalCells);
  await image.scan (scanner);

  const breakLine = ({text}, i) =>
    text + (i > 0 && (i + 1) % target[0] === 0 ? '\n' : '');
  terminalCells.sort ((a, b) => -(b.index - a.index));
  return terminalCells.map (breakLine).join ('').trim ();
}

const createDoodle = async file => {
  const image = await loadImage (file);

  // resize
  await image.exec ('cover', ...target);

  await image.exec ('greyscale');

  const pattern = await paintCanvas (image);

  // save image
  // await image.save ();

  console.log (pattern);
};

module.exports = createDoodle;
