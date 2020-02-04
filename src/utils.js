const chalk = require ('chalk');
const utils = {
  br: target => ({text}, i) => text + ((i + 1) % target[0] === 0 ? '\n' : ''),
  title: (a, ...rest) => console.log (chalk.blueBright (a), ...rest),
  pad: target => (num, size = String (Math.max (...target)).length) => {
    let s = num + '';
    while (s.length < size)
      s = '0' + s;
    return s;
  },
  shell: c => {
    return new Promise ((resolve, reject) => {
      require ('child_process').exec (c, (e, r, er) => {
        if (e || er) throw e;
        resolve (r);
      });
    });
  },
  ask: async q => {
    const rl = require ('readline').createInterface ({
      input: process.stdin,
      output: process.stdout,
    });
    return new Promise (r => {
      rl.question (q + '(y/n) ?\n', (a = '') => {
        rl.close ();
        a = a.toLowerCase ();
        if (a === 'y') return r (true);
        else if (a === 'n') return r (false);
        return r (utils.ask (q));
      });
    });
  },
};

module.exports = utils;
