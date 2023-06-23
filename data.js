const fs = require('fs');

function readData() {
    const data = fs.readFileSync('library.json', 'utf8');
    return JSON.parse(data);
}

function writeData(data) {
    fs.writeFileSync('library.json', JSON.stringify(data, null, 2));
}

module.exports = {
    readData,
    writeData
};