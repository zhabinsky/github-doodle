#!/usr/bin/env node

const params = require ('./src/resolveParams');
const createDoodle = require ('./src/createDoodle');
const text2png = require ('text2png');
// var fs = require ('fs');

const colors = ['#ffff', '#c6e48b', '#7bc96f', '#239a3b', '#196127'];
const {
  w,
  h,
  dir,
  image,
  startDate,
  resizeMode,
  text,
  invert,
  scaleEffect,
} = params;

console.log (params);

const doodle = (imagePath, options = {}) => {
  return createDoodle (imagePath, {
    colors,
    target: [w, h],
    dir,
    startDate,
    scaleEffect,
    resizeMode,
    invert,
    ...options,
  });
};

if (image) {
  /** Creating from image */
  doodle (image);
} else if (text) {
  /** Creating from text */
  const img = text2png (text, {
    textColor: 'white',
    strokeColor: 'black',
    backgroundColor: 'transparent',
    padding: 0,
    lineSpacing: 0,
    strokeWidth: 5,
    strokeColor: 'white',
    font: '50px sans-serif',
  });
  //   fs.writeFileSync ('out.png', img);
  doodle (img, {invert: !invert});
} else {
  throw new Error ('Must supply either image path text');
}
