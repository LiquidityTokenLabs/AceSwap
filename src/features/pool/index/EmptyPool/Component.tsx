import styled from '@emotion/styled'
import { FC } from 'react'
import { Card } from '../../../../components/atoms/Card/Card'
import { Color } from '../../../../utils/Color'

type Props = {
  text: string
}

export const Component: FC<Props> = ({ text }) => {
  return (
    <Wrapper>
      <IconWrapper>
        <SVG
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-6 h-6">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H6.911a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661z"
          />
        </SVG>
      </IconWrapper>
      <Text>{text}</Text>
    </Wrapper>
  )
}

const Wrapper = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  margin: '32px',
})

const Text = styled('div')({
  fontSize: '16px',
  color: Color.text_gray,
})

const IconWrapper = styled('div')({
  marginBottom: '16px',
})

const SVG = styled('svg')({
  color: Color.text_gray,
  width: '48px',
  height: '48px',
})
