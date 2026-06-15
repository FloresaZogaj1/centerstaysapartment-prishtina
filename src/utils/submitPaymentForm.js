export default function submitPaymentForm ({ action, fields, method = 'POST' }) {
  // Safe debug: log action and field names only (do not log values or secrets)
  try {
    console.log('Submitting BKT form to:', action)
    console.log('BKT form field names:', Object.keys(fields || {}))
  } catch (e) {
    // don't let logging fail the submit
  }

  const form = document.createElement('form')
  form.method = method || 'POST'
  form.action = action
  form.style.display = 'none'

  Object.keys(fields || {}).forEach(key => {
    const input = document.createElement('input')
    input.type = 'hidden'
    input.name = key
    input.value = fields[key]
    form.appendChild(input)
  })

  document.body.appendChild(form)
  form.submit()
  // remove after submit (browser will navigate away)
  setTimeout(() => form.remove(), 1000)
}
