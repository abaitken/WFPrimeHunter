const https = require('https');
const fs = require('fs');
const orignalData = "original-data.json.tmp";

function readFileData(callback) {
  let rawdata = fs.readFileSync(orignalData);
  let data = JSON.parse(rawdata);
  callback(data);
}

function getData(callback) {

  if (fs.existsSync(orignalData)) {
    console.log('Reading cached data');
    readFileData(callback);
    return;
  }

  console.log('Downloading data');
  const file = fs.createWriteStream(orignalData);
  const request = https.get("https://drops.warframestat.us/data/relics.json", function (response) {
    response.on('end', () => {
      readFileData(callback);
    });
    response.pipe(file, { end: false });
  });
}

function restructureData(data, callback) {

  console.log('Reorganising data');

  let itemids = [];
  let items = {};
  let relics = {};

  let tiers = [];
  let tierLookup = {};
  let rewardTiers = [0, 0, 0, 1, 1, 2];

  for (let index = 0; index < data['relics'].length; index++) {
    const element = data['relics'][index];
    let tier = element['tier'];
    let name = element['relicName'];

    if (!relics[tier]) {
      relics[tier] = {};

      tierLookup[tier] = tiers.length;
      tiers.push({
        name: tier,
        relics: []
      });
    }

    if (!relics[tier][name]) {
      relics[tier][name] = {};
      relics[tier][name].rewards = [];

      tiers[tierLookup[tier]].relics.push(name);

      if (element['rewards'].length != 6)
        throw 'Expected 6 rewards';

      element['rewards'].sort(function (a, b) {
        return a['chance'] > b['chance'] ? -1 : 1;
      });

      for (let j = 0; j < element['rewards'].length; j++) {
        const reward = element['rewards'][j];
        if (!items[reward['_id']]) {
          items[reward['_id']] = {
            name: reward['itemName'],
            relics: []
          };
          itemids.push(reward['_id']);
        }

        items[reward['_id']].relics.push({
          tier: tier,
          name: name,
          rarity: rewardTiers[j]
        });
        relics[tier][name].rewards.push({
          id: reward['_id'],
          rarity: rewardTiers[j]
        });
      }
    }
  }


  var restructured = {
    itemids: itemids,
    items: items,
    relics: relics,
    tiers: tiers
  };

  callback(restructured);


}

function writeData(data) {
  console.log('Writing data');
  let raw = JSON.stringify(data);
  fs.writeFileSync('bin/data.json', raw);
  console.log('Done');
}

getData(function (data) { restructureData(data, writeData); });