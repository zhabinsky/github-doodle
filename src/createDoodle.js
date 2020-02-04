const utils = require ('./utils');
const createDoodle = async (image, options = {}) => {
  const {
    colors,
    target,
    dir,
    startDate,
    scaleEffect,
    resizeMode,
    invert,
  } = options;
  const chalk = require ('chalk');
  const jimp = require ('jimp');
  const moment = require ('moment');
  const getStartDate = () => moment (startDate, 'MM-DD-YYYY');
  const generateGitProject = async dates => {
    const FAKE_COMMIT = ([date, c]) => {
      const [days, time] = date.split (' ');
      const p = days.split ('-');
      const d = `${p[2]}-${p[1]}-${p[0]} ${time}`;
      return `cd ${dir} && export GIT_COMMITTER_DATE="${d}" && export GIT_AUTHOR_DATE="${d}" && echo "{i}" > a && git add . && git commit --date="${d}" -m "${c}"`;
    };
    utils.title ('Spawning git commits:');
    await utils.shell (
      `mkdir -p ${dir}; cd ${dir} && rm -rf .git && git init && touch a`
    );
    const commands = dates.map (FAKE_COMMIT), n = commands.length;
    const progress = require ('cli-progress');
    const bar = new progress.SingleBar ();
    bar.start (n, 0);
    for (let i = 0; i < n; i++) {
      await utils.shell (commands[i].replace ('{i}', i));
      bar.update (i + 1);
    }
    bar.stop ();
  };
  const instantiateImage = async name =>
    require ('util')
      .promisify (jimp.read) (name)
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
  const rgbColors = colors
    .map (require ('hex-rgb'))
    .map (({red, green, blue}) => [red, green, blue]);
  async function getColorRange (img) {
    let d = 0, l = 255;
    await img.scan (function (x, y, index) {
      const value = this.bitmap.data[index];
      if (value > d) d = value;
      if (value < l) l = value;
    });
    return {d, l};
  }
  const paintCell = (range, cells) => {
    let count = 0;
    const getDate = (x, y) => () => {
      count += 1;
      const dateString = getStartDate ()
        .add (x * 7 + y, 'days')
        .hours (2)
        .add (count, 'seconds')
        .format ('DD-MM-YYYY h:mm:ss');
      return [dateString, [x, y].map (utils.pad (target)).join ('')];
    };
    return function (x, y, index) {
      const bm = this.bitmap.data;
      const delta = bm[index] - range.l;
      const step = Math.max (
        (range.d - range.l) / rgbColors.length * 1.05,
        0.01
      );
      let colorIndex = rgbColors.length - 1 - Math.floor (delta / step);
      if (invert) {
        colorIndex = rgbColors.length - 1 - colorIndex;
      }
      const color = rgbColors[colorIndex] || rgbColors[0];
      bm[index + 0] = color[0];
      bm[index + 1] = color[1];
      bm[index + 2] = color[2];
      const n = Math.max (colorIndex * scaleEffect, 0);
      const dates = new Array (n).fill ().map (getDate (x, y));
      cells.push ({
        text: chalk.bgRgb (...color) (chalk.rgb (...color) ('aa')),
        dates,
        index,
      });
      return color;
    };
  };
  async function paintCanvas (img) {
    const cells = [], range = await getColorRange (img), dates = [];
    await img.scan (paintCell (range, cells));
    const pattern = cells
      .sort ((b, a) => b.index - a.index)
      .map (utils.br (target))
      .join ('');
    cells.forEach (cell => dates.push (...cell.dates));
    return [pattern, dates.sort ((a, b) => a[1].localeCompare (b[1]))];
  }
  const img = await instantiateImage (image);
  await img.exec (resizeMode, ...target);
  await img.exec ('greyscale');
  const [pattern, dates] = await paintCanvas (img);
  console.log ('Generated doodle:');
  console.log (pattern.split ('\n').map (e => '  ' + e).join ('\n'));
  const question =
    'Do you want to generate git repo (' + dates.length + ' commits) ';
  if (await utils.ask (question)) {
    await generateGitProject (dates);
  } else console.log ('Skip git generation');
  console.log (chalk.green ('\nDone'));

  return;
};

module.exports = createDoodle;
