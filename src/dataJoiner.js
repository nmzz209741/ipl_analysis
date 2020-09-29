const fs = require('fs');
const {
  reject
} = require('lodash');
const {
  resolve
} = require('path');
const path = require('path');
let data = []
const dir = './data';
fs.readdir(dir, (err, files) => {
  return new Promise((resolve, reject) => {
    if (err) reject(err);
    files.forEach((file,index) => {
      let content = require(`${dir}/${file}`);
      const year = file.substr(7, 4)
      data[index] = content
      data[index].forEach(team => {
        team['year'] = year
      });
    });
    resolve(data);
  }).then(data => {
    console.log(data)
    fs.writeFileSync(`./final.json`, JSON.stringify(data), function (err) {
      if (err) throw err;
      console.log(`Saved!! final.json`)
    });
  });
});