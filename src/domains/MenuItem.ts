import { ReactNode } from 'react'
export type MenuItem = {
  label: string
  available: boolean
  type: 'BUTTON' | 'LINK'
  icon: ReactNode
  linkInfo?: {
    href: string
    locale: string
    isOutside?: boolean
  }
  clickHandler?: () => void
}
