import { ModeSelector as Component } from './ModeModeSelector'
import { render } from '@testing-library/react'

describe('/ModeSelector', () => {
  const Target: React.FC<{}> = () => <Component />

  describe('適切にレンダーできる', () => {
    const { container } = render(<Target />)
    expect(container).toMatchSnapshot()
  })
})
