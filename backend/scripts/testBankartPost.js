const https = require('https')
const data = JSON.stringify({ provider: 'bankart', transactionType: 'TEST', result: 'OK', merchantTransactionId: 'test' })

const opts = new URL('https://centerstaysapartment-prishtina.onrender.com/api/payments/bankart/callback')
const options = {
  hostname: opts.hostname,
  path: opts.pathname,
  method: 'POST',
  port: 443,
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
}

const req = https.request(options, (res) => {
  console.log('statusCode:', res.statusCode)
  let body = ''
  res.on('data', d => body += d)
  res.on('end', () => console.log('body:', body))
})

req.on('error', (e) => console.error('request error', e))
req.write(data)
req.end()
