// LOCAL TEST ONLY - DO NOT RUN IN PRODUCTION
// Helper to call the admin test-email endpoint on a local backend.
// Reads ADMIN_API_KEY from backend/.env and issues a POST to
// /api/admin/test-email. Do not use in production.
const fs = require('fs')
const path = require('path')

(async ()=>{
  try{
    // Read ADMIN_API_KEY from backend/.env without loading dotenv
    const envPath = path.resolve(__dirname, '../.env')
    let apiKey = 'change_me'
    try {
      const envText = fs.readFileSync(envPath, 'utf8')
      const m = envText.match(/^ADMIN_API_KEY=(.*)$/m)
      if (m && m[1]) apiKey = m[1].trim()
    } catch (e) {
      // fallback to default 'change_me'
    }

    const to = 'test@example.com'
    const res = await fetch('http://127.0.0.1:5000/api/admin/test-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-api-key': apiKey },
      body: JSON.stringify({ to })
    })
    const text = await res.text()
    console.log('HTTP', res.status, text)
  }catch(e){
    console.error('Request failed:', e && e.message ? e.message : e)
    process.exit(1)
  }
})()
