const nodemailer = require('nodemailer')
const dns = require('dns')
const axios = require('axios')

// Attempt to prefer IPv4 addresses when resolving hostnames. Some platforms
// (like Render) may return IPv6 addresses that are not routable from the
// runtime. Set the default result order to ipv4first when supported.
try {
  if (typeof dns.setDefaultResultOrder === 'function') {
    dns.setDefaultResultOrder('ipv4first')
    console.log('[BOOT] DNS default result order set to ipv4first')
  }
} catch (err) {
  console.error('[BOOT] Failed to set DNS ipv4first', { message: err && err.message })
}

const requiredEnv = ['SMTP_HOST','SMTP_PORT','SMTP_USER','SMTP_PASS','EMAIL_FROM']
const brevoSmtpEnv = ['BREVO_SMTP_HOST','BREVO_SMTP_PORT','BREVO_SMTP_USER','BREVO_SMTP_PASS','BREVO_FROM_EMAIL']

function smtpConfigured() {
  // Accept either generic SMTP_* envs or BREVO_SMTP_* envs as valid SMTP configuration
  const generic = requiredEnv.every(k => !!process.env[k])
  const brevo = brevoSmtpEnv.every(k => !!process.env[k])
  return generic || brevo
}

function brevoConfigured() {
  return !!process.env.BREVO_API_KEY && !!process.env.EMAIL_FROM
}

function createTransporter(){
  if (!smtpConfigured()) return null
  // Determine SMTP settings: prefer generic SMTP_* envs, otherwise fall back to BREVO_SMTP_* if present
  const secure = String(process.env.SMTP_SECURE || '').toLowerCase() === 'true'
  const host = process.env.SMTP_HOST || process.env.EMAIL_HOST || process.env.MAIL_HOST || process.env.BREVO_SMTP_HOST
  const port = process.env.SMTP_PORT || process.env.EMAIL_PORT || process.env.MAIL_PORT || process.env.BREVO_SMTP_PORT || 587
  const user = process.env.SMTP_USER || process.env.EMAIL_USER || process.env.GMAIL_USER || process.env.BREVO_SMTP_USER
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS || process.env.GMAIL_PASS || process.env.BREVO_SMTP_PASS
  // Force IPv4 (family: 4) and set tls.servername for SNI when using secure connections
  const transporterOptions = {
    host: host,
    port: Number(port),
    secure: secure,
    auth: {
      user: user,
      pass: pass
    },
    family: 4,
    tls: {
      servername: host
    },
    // explicit timeouts to fail fast and surface clear errors
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  }

  // Safe diagnostic log for transporter options (no secrets)
  try {
    console.log('[BOOT] SMTP transporter options', {
      host: transporterOptions.host,
      port: transporterOptions.port,
      secure: transporterOptions.secure,
      family: transporterOptions.family,
      tlsServername: transporterOptions.tls && transporterOptions.tls.servername
    })
  } catch (e) {}

  return nodemailer.createTransport(transporterOptions)
}

async function sendMail(opts){
  // If Brevo API key is present, use Brevo REST API instead of SMTP
  if (brevoConfigured()) {
    // forward attachments and recipient name if present
    return sendEmailWithBrevoApi({ to: opts && opts.to, toName: opts && opts.toName, subject: opts && opts.subject, html: opts && opts.html, text: opts && opts.text, attachments: opts && opts.attachments })
  }

  const transporter = createTransporter()
  if (!transporter) {
    console.log('Email not sent: SMTP configuration missing')
    return { ok: false, error: 'smtp_not_configured' }
  }
  try {
    const info = await transporter.sendMail(opts)
    return { ok: true, messageId: info && info.messageId ? info.messageId : null, info }
  } catch (err) {
    // structured logging for operator diagnostics
    console.error('[Email] send failed', {
      to: opts && opts.to,
      subject: opts && opts.subject,
      message: err && err.message,
      code: err && err.code,
      command: err && err.command
    })
    return { ok: false, error: err && err.message ? err.message : String(err), code: err && err.code, command: err && err.command }
  }
}

async function verifyTransporter(){
  // If Brevo API is configured, skip any SMTP verification entirely and
  // report that the Brevo API provider will be used. This avoids network
  // timeouts or SMTP checks on platforms that have restricted outbound
  // SMTP (for example Render). Do NOT log the API key itself.
  if (process.env.BREVO_API_KEY) {
    console.log('[BOOT] Email provider: Brevo API')
    console.log('[BOOT] Brevo API key exists:', true)
    return { ok: true, provider: 'brevo-api' }
  }

  const transporter = createTransporter()
  if (!transporter) {
    // Explicitly log missing configuration
    console.error('[BOOT] SMTP transporter verify failed', { message: 'smtp_not_configured' })
    return { ok: false, reason: 'smtp_not_configured' }
  }
  // Perform an explicit IPv4 DNS lookup diagnostic prior to verification
  try {
    const host = process.env.SMTP_HOST || process.env.EMAIL_HOST || process.env.MAIL_HOST
    dns.lookup(host, { family: 4 }, (err, address, family) => {
      if (err) {
        console.error('[BOOT] SMTP IPv4 lookup failed', {
          host,
          message: err && err.message,
          code: err && err.code
        })
      } else {
        console.log('[BOOT] SMTP IPv4 lookup result', { host, address, family })
      }
    })
  } catch (e) {
    console.error('[BOOT] SMTP IPv4 lookup diagnostic failed', { message: e && e.message })
  }

  try {
    await transporter.verify()
    console.log('[BOOT] SMTP transporter verified')
    return { ok: true }
  } catch (err) {
    // Log a standardized failure object for Render
    try {
      console.error('[BOOT] SMTP transporter verify failed', {
        message: err && err.message ? err.message : String(err),
        code: err && err.code,
        command: err && err.command
      })
    } catch (e) {}
    return { ok: false, error: err && err.message ? err.message : String(err), code: err && err.code, command: err && err.command }
  }
}

async function sendEmailWithBrevoApi({ to, toName, subject, html, text, attachments }){
  try {
    console.log('[Email][Brevo API] sending', { to, toName, subject })
    // Accept attachments array: [{ filename, path, content, contentType }]
    // Helper: simple HTML -> text converter for basic content
    function htmlToText(htmlStr) {
      if (!htmlStr) return ''
      try {
        // Replace block elements with line breaks, strip tags, decode entities simplistically
        let s = String(htmlStr)
        // Normalize <br> and <p> and <li> into line breaks
        s = s.replace(/<br\s*\/?>/gi, '\n')
        s = s.replace(/<p[^>]*>/gi, '\n')
        s = s.replace(/<\/p>/gi, '\n')
        s = s.replace(/<li[^>]*>/gi, '\n- ')
        s = s.replace(/<\/li>/gi, '\n')
        // Remove remaining tags
        s = s.replace(/<[^>]+>/g, '')
        // Decode common HTML entities
        s = s.replace(/&nbsp;/g, ' ')
        s = s.replace(/&amp;/g, '&')
        s = s.replace(/&lt;/g, '<')
        s = s.replace(/&gt;/g, '>')
        s = s.replace(/&quot;/g, '"')
        // Collapse multiple newlines/spaces
        s = s.replace(/\r/g, '\n')
        s = s.replace(/\n\s+/g, '\n')
        s = s.replace(/[ \t]+/g, ' ')
        s = s.replace(/\n{3,}/g, '\n\n')
        return s.trim()
      } catch (e) {
        return String(htmlStr)
      }
    }

    const payload = {
      sender: {
        // Use EMAIL_FROM when available, otherwise fall back to BREVO_FROM_EMAIL
        email: process.env.EMAIL_FROM || process.env.BREVO_FROM_EMAIL,
        name: process.env.BREVO_FROM_NAME || 'CenterStays Apartments Prishtina'
      },
      to: [{ email: to, name: toName || undefined }],
      subject: subject,
      htmlContent: html || text || '',
      // Brevo requires textContent in your account configuration — ensure a plain-text alternative
      textContent: (text && String(text)) || htmlToText(html)
    }

    // handle attachments by reading files and base64-encoding them
    const attachmentMeta = []
    if (attachments && Array.isArray(attachments) && attachments.length) {
      const atts = []
      for (const a of attachments) {
        try {
          const fs = require('fs')
          if (a.path) {
            const buf = fs.readFileSync(a.path)
            atts.push({ name: a.filename || (a.name || 'attachment.pdf'), content: buf.toString('base64') })
            attachmentMeta.push({ filename: a.filename || (a.name || 'attachment.pdf'), size: buf.length })
          } else if (a.content) {
            const buf = Buffer.isBuffer(a.content) ? a.content : Buffer.from(String(a.content))
            atts.push({ name: a.filename || (a.name || 'attachment.pdf'), content: buf.toString('base64') })
            attachmentMeta.push({ filename: a.filename || (a.name || 'attachment.pdf'), size: buf.length })
          }
        } catch (e) {
          console.error('[Email][Brevo API] attachment read failed', { filename: a && a.filename, message: e && e.message })
        }
      }
      if (atts.length) payload.attachment = atts
    }

    // Validate htmlContent is a string
    if (typeof payload.htmlContent !== 'string') payload.htmlContent = String(payload.htmlContent || '')

    const resp = await axios.post('https://api.brevo.com/v3/smtp/email', payload, {
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 15000
    })

    const data = resp && resp.data ? resp.data : {}
    if (!resp || resp.status < 200 || resp.status >= 300) {
      console.error('[Email][Brevo API] send failed', { to, subject, status: resp && resp.status, response: data })
      return { ok: false, error: data && data.message ? data.message : `Brevo API failed with status ${resp && resp.status}`, statusCode: resp && resp.status, brevoError: data, recipient: to, senderEmail: process.env.EMAIL_FROM, attachment: attachmentMeta }
    }

    console.log('[Email][Brevo API] sent', { to, subject, messageId: data && data.messageId })
    return { ok: true, messageId: data && data.messageId }
  } catch (err) {
    // If Brevo returned a response body, surface it in a structured way
    try {
      if (err && err.response) {
        const status = err.response.status
        const data = err.response.data
        console.error('[Email][Brevo API] send failed', { status, data, recipient: to, senderEmail: process.env.EMAIL_FROM })
        return { ok: false, statusCode: status, brevoError: data, recipient: to, senderEmail: process.env.EMAIL_FROM }
      }
    } catch (e) {}

    // Standard fallback
    console.error('[Email][Brevo API] send failed', { to, subject, message: err && err.message })
    return { ok: false, error: err && err.message }
  }
}

function isEmailConfigured(){
  return smtpConfigured()
}

async function sendTestEmail(to){
  // Returns:
  // - false when SMTP missing
  // - true when sent
  // - throws when send fails
  // Allow using Brevo API even when SMTP env vars are not present.
  if (!isEmailConfigured() && !brevoConfigured()) {
    console.log('Email not sent: SMTP configuration missing and Brevo API not configured')
    return false
  }

  // Use Brevo API if available
  if (brevoConfigured()) {
    const r = await sendEmailWithBrevoApi({ to, subject: 'City Center Prishtina - SMTP test', text: 'SMTP email delivery is configured correctly.' })
    if (r && r.ok) return true
    throw new Error(r && r.error ? r.error : 'Brevo API send failed')
  }

  const transporter = createTransporter()
  if (!transporter) {
    console.log('Email not sent: SMTP configuration missing')
    return false
  }

  const subject = 'City Center Prishtina - SMTP test'
  const text = 'SMTP email delivery is configured correctly.'

  // Let errors bubble up so callers can distinguish send failures
  const info = await transporter.sendMail({ from: process.env.EMAIL_FROM, to, subject, text })
  return true
}

function formatDate(d){
  if (!d) return ''
  try { return (new Date(d)).toISOString() } catch(e){ return String(d) }
}

function safeNumber(n){
  if (n == null) return ''
  return Number(n).toFixed(2)
}

async function sendBookingPaidCustomerEmail(booking){
  if (!booking || !booking.email) return false
  if (!isEmailConfigured()) {
    console.log('Email not sent: SMTP configuration missing')
    return false
  }
  const to = booking.email
  const subject = 'Booking confirmed - Center Stays Apartments'
  const text = `Booking number: ${booking.bookingNumber} - Your payment was received and your booking is confirmed.`
  const html = `<p>${text}</p>`
  const result = await sendMail({ from: process.env.EMAIL_FROM, to, subject, text, html })
  if (result && result.ok) return true
  console.error('[Email] booking paid customer send failed', { to, subject, error: result && result.error, code: result && result.code })
  return false
}

async function sendBookingPaidAdminEmail(booking, payment){
  if (!process.env.ADMIN_EMAIL) {
    console.log('Email not sent: ADMIN_EMAIL missing')
    return false
  }
  if (!isEmailConfigured()) {
    console.log('Email not sent: SMTP configuration missing')
    return false
  }

  const to = process.env.ADMIN_EMAIL
  const subject = 'New paid booking - Center Stays Apartments'

  const roomObj = booking.room || {}
  const roomName = (roomObj && roomObj.name) ? roomObj.name : (booking.roomName || (roomObj && roomObj.toString && roomObj.toString()) || 'N/A')
  const roomId = (roomObj && roomObj._id) ? roomObj._id : (booking.room ? booking.room : '')

  const addons = booking.addons || {}

  const html = `
    <h3>New paid booking</h3>
    <table border="0" cellpadding="4" cellspacing="0">
      <tr><td><strong>Booking status</strong></td><td>paid</td></tr>
      <tr><td><strong>Payment status</strong></td><td>${payment.status}</td></tr>
      <tr><td><strong>Booking number</strong></td><td>${booking.bookingNumber}</td></tr>
      <tr><td><strong>Customer</strong></td><td>${booking.firstName} ${booking.lastName}</td></tr>
      <tr><td><strong>Customer email</strong></td><td>${booking.email}</td></tr>
      <tr><td><strong>Customer phone</strong></td><td>${booking.phone}</td></tr>
      <tr><td><strong>Room name</strong></td><td>${roomName}</td></tr>
      <tr><td><strong>Room ID</strong></td><td>${roomId}</td></tr>
      <tr><td><strong>Check-in</strong></td><td>${formatDate(booking.checkInDate)}</td></tr>
      <tr><td><strong>Check-out</strong></td><td>${formatDate(booking.checkOutDate)}</td></tr>
      <tr><td><strong>Nights</strong></td><td>${booking.nights}</td></tr>
      <tr><td><strong>Guests</strong></td><td>${booking.guests}</td></tr>
      <tr><td><strong>Base price per night</strong></td><td>${roomObj && roomObj.basePricePerNight ? safeNumber(roomObj.basePricePerNight) : ''}</td></tr>
      <tr><td><strong>Addons</strong></td><td>
        Breakfast: ${addons.breakfast ? 'Yes' : 'No'}<br/>
        Lunch: ${addons.lunch ? 'Yes' : 'No'}<br/>
        Dinner: ${addons.dinner ? 'Yes' : 'No'}<br/>
        Airport transport: ${addons.airportTransport ? 'Yes' : 'No'}<br/>
        Rent car Golf 7: ${addons.rentCarGolf7 ? 'Yes' : 'No'}
      </td></tr>
      <tr><td><strong>Total amount</strong></td><td>${safeNumber(booking.pricing?.totalAmount)} EUR</td></tr>
      <tr><td><strong>Payment provider</strong></td><td>${payment.provider}</td></tr>
      <tr><td><strong>Payment ID</strong></td><td>${payment._id}</td></tr>
      <tr><td><strong>Payment created</strong></td><td>${formatDate(payment.createdAt)}</td></tr>
      <tr><td><strong>Booking created</strong></td><td>${formatDate(booking.createdAt)}</td></tr>
    </table>
  `

  const result = await sendMail({ from: process.env.EMAIL_FROM, to, subject, html })
  if (result && result.ok) return true
  console.error('[Email] booking paid admin send failed', { to, subject, error: result && result.error, code: result && result.code })
  return false
}

async function sendBookingFailedCustomerEmail(booking, payment){
  if (!booking || !booking.email) return false
  if (!isEmailConfigured()) {
    console.log('Email not sent: SMTP configuration missing')
    return false
  }
  const to = booking.email
  const subject = 'Payment was not completed - Center Stays Apartments'

  const providerResp = payment && payment.rawResponse ? payment.rawResponse : {}
  const safeResp = {
    ErrorCode: providerResp.ErrorCode || providerResp.ErrorCode || '',
    ErrMsg: providerResp.ErrMsg || providerResp.Errmsg || providerResp.ErrMsg || '',
    ProcReturnCode: providerResp.ProcReturnCode || '',
    Response: providerResp.Response || providerResp.response || ''
  }

  const text = `Dear ${booking.firstName || ''},\n\nYour payment attempt for booking ${booking.bookingNumber || ''} was not completed.\n\nAmount attempted: ${safeNumber(booking.pricing?.totalAmount)} ${booking.pricing?.currency || 'EUR'}\nProvider: BKT\nStatus: Failed / Declined\nReason: ${safeResp.ErrorCode} - ${safeResp.ErrMsg} (ProcReturnCode: ${safeResp.ProcReturnCode}, Response: ${safeResp.Response})\n\nYour booking is not confirmed as paid. You may try again with another card or contact us for assistance.\n\nBest regards,\nCenter Stays Apartments`

  const html = `
    <p>Dear ${booking.firstName || ''},</p>
    <p>Your payment attempt for booking <strong>${booking.bookingNumber || ''}</strong> was not completed.</p>
    <table>
      <tr><td><strong>Apartment</strong></td><td>${(booking.room && booking.room.name) || booking.roomName || 'N/A'}</td></tr>
      <tr><td><strong>Check-in</strong></td><td>${formatDate(booking.checkInDate)}</td></tr>
      <tr><td><strong>Check-out</strong></td><td>${formatDate(booking.checkOutDate)}</td></tr>
      <tr><td><strong>Guests</strong></td><td>${booking.guests || ''}</td></tr>
      <tr><td><strong>Attempted amount</strong></td><td>${safeNumber(booking.pricing?.totalAmount)} ${booking.pricing?.currency || 'EUR'}</td></tr>
      <tr><td><strong>Provider</strong></td><td>BKT</td></tr>
      <tr><td><strong>Status</strong></td><td>Failed / Declined</td></tr>
      <tr><td><strong>Reason</strong></td><td>ErrorCode: ${safeResp.ErrorCode}<br/>ErrMsg: ${safeResp.ErrMsg}<br/>ProcReturnCode: ${safeResp.ProcReturnCode}<br/>Response: ${safeResp.Response}</td></tr>
    </table>
    <p>Your booking is not confirmed as paid. You may try again with another card or contact us for assistance.</p>
    <p>Best regards,<br/>Center Stays Apartments</p>
  `

  const result = await sendMail({ from: process.env.EMAIL_FROM, to, subject, text, html })
  if (result && result.ok) return true
  console.error('[Email] booking failed customer send failed', { to, subject, error: result && result.error, code: result && result.code })
  return false
}

async function sendBookingFailedAdminEmail(booking, payment){
  if (!process.env.ADMIN_EMAIL) {
    console.log('Email not sent: ADMIN_EMAIL missing')
    return false
  }
  if (!isEmailConfigured()) {
    console.log('Email not sent: SMTP configuration missing')
    return false
  }

  const to = process.env.ADMIN_EMAIL
  const subject = 'Payment failed booking - Center Stays Apartments'

  const roomObj = booking.room || {}
  const roomName = (roomObj && roomObj.name) ? roomObj.name : (booking.roomName || (roomObj && roomObj.toString && roomObj.toString()) || 'N/A')
  const roomId = (roomObj && roomObj._id) ? roomObj._id : (booking.room ? booking.room : '')

  const resp = payment && payment.rawResponse ? payment.rawResponse : {}
  // Safe selected response fields only
  const safeResp = {
    Response: resp.Response || resp.response || '',
    ProcReturnCode: resp.ProcReturnCode || '',
    mdStatus: resp.mdStatus || '',
    ErrMsg: resp.ErrMsg || resp.Errmsg || ''
  }

  // Additional useful provider fields if available
  const extra = {
    ErrorCode: resp.ErrorCode || '',
    traceId: resp.traceId || resp.trace_id || ''
  }

  const html = `
    <h3>Payment failed booking</h3>
    <table border="0" cellpadding="4" cellspacing="0">
      <tr><td><strong>Booking status</strong></td><td>failed</td></tr>
      <tr><td><strong>Payment status</strong></td><td>${payment.status}</td></tr>
      <tr><td><strong>Booking number</strong></td><td>${booking.bookingNumber}</td></tr>
      <tr><td><strong>Customer</strong></td><td>${booking.firstName} ${booking.lastName}</td></tr>
      <tr><td><strong>Customer email</strong></td><td>${booking.email}</td></tr>
      <tr><td><strong>Customer phone</strong></td><td>${booking.phone}</td></tr>
      <tr><td><strong>Room name</strong></td><td>${roomName}</td></tr>
      <tr><td><strong>Room ID</strong></td><td>${roomId}</td></tr>
      <tr><td><strong>Check-in</strong></td><td>${formatDate(booking.checkInDate)}</td></tr>
      <tr><td><strong>Check-out</strong></td><td>${formatDate(booking.checkOutDate)}</td></tr>
      <tr><td><strong>Nights</strong></td><td>${booking.nights}</td></tr>
      <tr><td><strong>Guests</strong></td><td>${booking.guests}</td></tr>
      <tr><td><strong>Total amount</strong></td><td>${safeNumber(booking.pricing?.totalAmount)} EUR</td></tr>
      <tr><td><strong>Payment provider</strong></td><td>${payment.provider}</td></tr>
      <tr><td><strong>Payment ID</strong></td><td>${payment._id}</td></tr>
  <tr><td><strong>Failure Response</strong></td><td>Response: ${safeResp.Response}<br/>ProcReturnCode: ${safeResp.ProcReturnCode}<br/>mdStatus: ${safeResp.mdStatus}<br/>ErrMsg: ${safeResp.ErrMsg}<br/>ErrorCode: ${extra.ErrorCode}<br/>traceId: ${extra.traceId}</td></tr>
    </table>
  `

  const result = await sendMail({ from: process.env.EMAIL_FROM, to, subject, html })
  if (result && result.ok) return true
  console.error('[Email] booking failed admin send failed', { to, subject, error: result && result.error, code: result && result.code })
  return false
}

module.exports = {
  sendBookingPaidCustomerEmail,
  sendBookingPaidAdminEmail,
  sendBookingFailedCustomerEmail,
  sendBookingFailedAdminEmail,
  // lower-level sendMail used by invoice service
  sendMail,
  isEmailConfigured,
  sendTestEmail,
  verifyTransporter
}
