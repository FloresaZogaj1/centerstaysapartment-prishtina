const https = require('https');

const url = 'https://centerstaysapartment-prishtina.onrender.com/api/rooms';

https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const rooms = JSON.parse(data);
      const names = ['City Apartment 13','City Apartment 19','City Apartment 22'];
      for (const name of names) {
        const r = rooms.find(x => x.name === name);
        console.log('---', name, '---');
        if (!r) { console.log('NOT FOUND'); continue; }
        console.log('name:', r.name);
        console.log('imageUrl:', r.imageUrl);
        console.log('gallery:', JSON.stringify(r.gallery));
      }
    } catch (e) { console.error('parse error', e); }
  });
}).on('error', (e) => { console.error('request error', e); });
