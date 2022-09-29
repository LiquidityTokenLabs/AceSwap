---
to: src/components/<%= atomic %>/<%= h.changeCase.pascal(component_name) %>/<%= h.changeCase.pascal(component_name) %>.tsx
---

import { FC } from 'react'

type Props = {

}

export const <%= h.changeCase.pascal(component_name) %>: FC<Props> = ({}) => {
  return (
    <></>
  )
}