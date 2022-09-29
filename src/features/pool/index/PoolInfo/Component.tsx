import styled from '@emotion/styled'
import { useRouter } from 'next/router'
import { Dispatch, FC } from 'react'
import { Chip } from '../../../../components/atoms/Chip/Chip'
import { Pool } from '../../../../domains/Pool'
import { Color } from '../../../../utils/Color'

import { Props as ToastProps } from '../../../../components/atoms/Toast/Toast'

type Props = {
  pool: Pool
  curveTypeText: string
  volatilityText: string
  divergenceText: string
  setToast: Dispatch<ToastProps>
}

export const Component: FC<Props> = ({
  pool,
  curveTypeText,
  volatilityText,
  divergenceText,
  setToast,
}) => {
  const router = useRouter()

  const { id, curveType, volatility, divergence, poolName, poolCount } = pool

  const handleClick = () => {
    router.push(`/pool/${id}`)
  }

  return (
    <Root onClick={handleClick}>
      <InfoWrapper>
        <Circle />
        <Name>{poolName}</Name>
        <Chip label={`x${poolCount}`} />
      </InfoWrapper>
      <DetailWrapper>
        <div>
          <Label>{curveTypeText} :</Label>
          <InfomationText>{curveType}</InfomationText>
        </div>
        <div>
          <Label>{volatilityText} :</Label>
          <InfomationText>{volatility}</InfomationText>
        </div>
        <div>
          <Label>{divergenceText} :</Label>
          <InfomationText>{divergence}</InfomationText>
        </div>
      </DetailWrapper>
    </Root>
  )
}

const Root = styled('div')({
  padding: '16px',
  background: Color.base_white,
  borderRadius: '16px',
  cursor: 'pointer',
})

const InfoWrapper = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
})
const DetailWrapper = styled('div')({
  display: 'flex',
  gap: '16px',
})

const Circle = styled('div')({
  width: '16px',
  height: '16px',
  borderRadius: '8px',
  background: Color.gray,
})

const Name = styled('div')({
  fontSize: '20px',
})

const Label = styled('span')({
  fontWeight: 400,
})

const InfomationText = styled('span')({
  fontWeight: 700,
})
