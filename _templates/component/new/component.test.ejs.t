---
to: "<%= require_test ? `src/components/${atomic}/${h.changeCase.pascal(component_name)}/${h.changeCase.pascal(component_name)}.test.tsx` : null %>"
---

import { <%= h.changeCase.pascal(component_name) %> as Component } from './<%= h.changeCase.pascal(component_name)%>';
import { render } from '@testing-library/react'

describe('/<%= h.changeCase.pascal(component_name)%>', () => {
  const Target: React.FC<{}> = () => (
    <Component />
  )

  describe('適切にレンダーできる', () => {
    const { container } = render(<Target />)
    expect(container).toMatchSnapshot()
  })

})