import './globals.scss'
import { AppProps } from 'next/app'
import { NextPage } from 'next'
import React, { FC, ReactElement, ReactNode, useEffect, useState } from 'react'
import { useRouter } from 'next/router'

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout
}

export default function App({ Component, pageProps }: AppPropsWithLayout) {
  const getLayout = Component.getLayout ?? ((page) => page)
  const router = useRouter()

  useBodyClass('main-theme', router.pathname !== '/admin')

  return <>
    <MobileNavOpenContextProvider>
      {getLayout(<Component {...pageProps} />)}
    </MobileNavOpenContextProvider>
  </>
}

export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
  getLayout?: GetLayoutFn
}

export type GetLayoutFn = (content: ReactElement) => ReactNode

export const MobileNavOpenContext = React.createContext({ isOpen: false, setIsOpen: (isOpen: boolean) => { } })

const MobileNavOpenContextProvider: FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false)

  useBodyClass('no-scroll', isOpen)

  return (
    <MobileNavOpenContext.Provider value={{ isOpen, setIsOpen }}>
      {children}
    </MobileNavOpenContext.Provider>
  )
}

function useBodyClass(className: string, condition: boolean) {
  useEffect(() => {
    if (condition) {
      document.body.classList.add(className)
    } else {
      document.body.classList.remove(className)
    }
  })
}