export default function submitPaymentForm ({ action, fields, method = 'POST' }) {
  const form = document.createElement('form')
  form.method = method
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
