import React from 'react'
import PaymentResultPage from '../components/PaymentResultPage'

export default function PaymentSuccess(){
  return (
    <PaymentResultPage
      title="Payment completed successfully"
      text="Your booking payment was completed. Your reservation is being confirmed."
      showTryAgain={false}
    />
  )
}
