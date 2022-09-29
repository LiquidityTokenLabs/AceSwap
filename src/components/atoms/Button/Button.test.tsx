import { Button as Component } from './Button'
import { render } from '@testing-library/react'

describe('/Button', () => {
  const fn = jest.fn()
  const Target: React.FC<{}> = () => (
    <Component label={'TEST'} margin={'16px'} color="gray" onClick={fn} />
  )

  describe('適切にレンダーできる', () => {
    const { container } = render(<Target />)
    expect(container).toMatchSnapshot()
  })
})
