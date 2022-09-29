import { NftFrame as Component } from './NftFrame'
import { render } from '@testing-library/react'

describe('/NftFrame', () => {
  const Target: React.FC<{}> = () => <Component amount={0.016} />

  describe('適切にレンダーできる', () => {
    const { container } = render(<Target />)
    expect(container).toMatchSnapshot()
  })
})
