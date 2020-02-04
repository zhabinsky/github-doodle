const argumentator = require ('argumentator');
const defaults = {};
const options = [
  {
    name: 'image',
    description: 'image name or url (Optional if --text is given)',
    value: undefined,
  },
  {
    name: 'text',
    description: 'text to generate (Optional if --image is given)',
    value: 'ILOVECATS',
  },
  {
    name: 'start-date',
    description: 'first commit date (MM-DD-YYYY)',
    value: '12-31-2017',
  },
  {
    name: 'dir',
    description: 'output repository path',
    value: 'doodle',
  },
  {
    name: 'effect-scale',
    description: 'commits multiplier (recommended < 6)',
    value: '2',
  },
  {
    name: 'resize-mode',
    description: 'image resize mode (cover, contain)',
    value: 'contain',
  },
  {
    name: 'w',
    description: 'output image width',
    value: 52,
  },
  {
    name: 'invert',
    description: 'colors to inverse',
    value: false,
  },
  {
    name: 'h',
    description: 'output image height',
    value: 7,
  },
].map (({name, value, description}) => {
  defaults[name] = value;
  return {
    flags: '--' + name + '=' + value,
    description: 'Sets ' + description,
  };
});

const context = {
  ...defaults,
  ...argumentator (options),
};

const {
  w,
  h,
  dir,
  image,
  ['start-date']: startDate,
  ['effect-scale']: scaleEffect,
  ['resize-mode']: resizeMode,
  texts = [],
  text: textArgument,
  invert,
} = context;

const text = (textArgument + ' ' + texts.join (' ')).trim ();

module.exports = {
  w: Number (w),
  h: Number (h),
  scaleEffect: Number (scaleEffect),
  dir,
  image,
  startDate,
  resizeMode,
  text,
  invert: Boolean (invert),
};
