export default function submitPaymentForm ({ action, fields, method = 'POST', htmlForm = null }) {
  // If a full HTML form string is provided, inject and submit it
  try {
    if (htmlForm && typeof htmlForm === 'string') {
      const container = document.createElement('div')
      container.style.display = 'none'
      container.innerHTML = htmlForm
      document.body.appendChild(container)
      const f = container.querySelector('form')
      if (!f) {
        console.error('[submitPaymentForm] htmlForm provided but no form found')
        throw new Error('Missing form in htmlForm')
      }
      console.log('[submitPaymentForm] submitting injected htmlForm', { action: f.action, method: f.method })
      f.submit()
      return
    }
  } catch (e) {
    console.error('[submitPaymentForm] htmlForm submit failed', e)
  }

  // Ensure we have an action and fields
  if (!action) {
    console.error('[submitPaymentForm] missing action, cannot submit')
    return
  }

  // Defensive: coerce fields to object
  const safeFields = (fields && typeof fields === 'object') ? fields : {}

  // Safe debug: log action and field names only (do not log sensitive values)
  try {
    console.log('[submitPaymentForm] Submitting form to host:', (() => { try { return new URL(action).host } catch (e) { return action } })())
    console.log('[submitPaymentForm] field names:', Object.keys(safeFields))
  } catch (e) {}

  const form = document.createElement('form')
  form.method = method || 'POST'
  form.action = action
  form.style.display = 'none'

  Object.entries(safeFields).forEach(([key, val]) => {
    const input = document.createElement('input')
    input.type = 'hidden'
    input.name = key
    input.value = val == null ? '' : String(val)
    form.appendChild(input)
  })

  document.body.appendChild(form)
  try { form.submit() } catch (e) { console.error('[submitPaymentForm] submit() threw', e) }
  // remove after submit (browser will navigate away)
  setTimeout(() => form.remove(), 1000)
}
