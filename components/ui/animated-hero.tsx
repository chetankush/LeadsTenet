import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { MoveRight, PhoneCall } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

function Hero() {
  const [titleNumber, setTitleNumber] = useState(0)
  const titles = useMemo(() => ['Modern', 'Full-stack', 'Secure', 'Scalable', 'Powerful'], [])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (titleNumber === titles.length - 1) {
        setTitleNumber(0)
      } else {
        setTitleNumber(titleNumber + 1)
      }
    }, 2000)
    return () => clearTimeout(timeoutId)
  }, [titleNumber, titles])

  return <div className="">hey i am starter</div>
}

export { Hero }
