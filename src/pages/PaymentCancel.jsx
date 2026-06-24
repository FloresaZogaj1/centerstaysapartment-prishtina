import React from 'react'
import PaymentResultPage from '../components/PaymentResultPage'

export default function PaymentCancel(){
  return (
    <PaymentResultPage
      title="Payment cancelled"
      text="Your booking was saved, but the payment was cancelled."
      showTryAgain={true}
    />
  )
}
