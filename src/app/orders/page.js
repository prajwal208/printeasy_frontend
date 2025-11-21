"use client"

import NoResult from '@/component/NoResult/NoResult'
import { useRouter } from 'next/navigation'
import React from 'react'

const page = () => {
  const router = useRouter()
  return (
    <>
      <NoResult
      title={"No Orders Yet"}
      description={"You havent placed any orders.When you do your orders will appear here. Start shopping now and track your purchase all in one place"}
      buttonText={"Explore"}
      onButtonClick={() => router.push('/')}
      />
    </>
  )
}

export default page
