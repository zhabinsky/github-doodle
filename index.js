const path = require ('path');
const createDoodle = require ('./src/createDoodle');

const source = path.resolve (__dirname, 'source.png');

createDoodle (source);
