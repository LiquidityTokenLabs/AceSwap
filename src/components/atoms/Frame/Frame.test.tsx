import styled from '@emotion/styled'
import { render } from '@testing-library/react'
import { Color } from '../../../utils/Color'
import { Frame as Component } from './Frame'

const Mock = styled('div')({
  width: '100px',
  height: '100px',
  marginTop: '8px',
  background: Color.gray,
})

describe('/Frame', () => {
  const Target: React.FC<{}> = () => (
    <Component>
      <></>
    </Component>
  )

  describe('適切にレンダーできる', () => {
    const { container } = render(<Target />)
    expect(container).toMatchSnapshot()
  })
})
