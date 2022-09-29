import styled from '@emotion/styled'
import { Dispatch, FC, useEffect, useState } from 'react'
import { NftFrame } from '../../../components/molecules/NftFrame/NftFrame'
import { round } from '../../../utils/Format'
import { ethers } from 'ethers'

type Props = {
  amount: number
  src: string
  collection: string
  name: string
  isActive: boolean
  selectedCount: number
  anchorPrice: number
  setAnchorPrice: Dispatch<number>
  delta: number
  chainId: number
}

export const NftFrameWrapper: FC<Props> = ({
  amount,
  src,
  collection,
  name,
  isActive,
  selectedCount,
  anchorPrice,
  setAnchorPrice,
  delta,
  chainId,
}) => {
  const [currentAmount, setCurrentAmount] = useState(0)
  const [prevSelectedCount, setPrevSelectedCount] = useState(0)
  const [prevIsActive, setPrevIsActive] = useState(false)

  const updatePrice = round(amount - prevSelectedCount * delta, 4)
  const downPrice = round(currentAmount - delta, 4)
  const upPrice = round(currentAmount + delta, 4)

  useEffect(() => {
    setCurrentAmount(amount)
    setPrevSelectedCount(selectedCount)
    setPrevIsActive(isActive)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (prevSelectedCount === 0 && selectedCount === 0) return
    if (prevSelectedCount < selectedCount) {
      // 選択行動
      if (isActive) {
        // 選択済み
        if (prevIsActive) {
          // 以前から選択
          // TODO 1 STAY
        } else {
          // 新規で選択された
          // TODO 2 STAY
          const newCount = updatePrice
          setCurrentAmount(newCount)
        }
      } else {
        // 未選択　(以前も現在も未選択)
        // TODO 3 DOWN
        const newAmount = downPrice
        setCurrentAmount(newAmount)
      }
    } else {
      // 解除行動
      if (isActive) {
        // 選択済み
        // 選択 (以前も今も選択済み)
        // TODO 4 UP
        if (anchorPrice > currentAmount) {
          const newAmount = upPrice
          setCurrentAmount(newAmount)
        }
      } else {
        // 未選択
        if (prevIsActive) {
          // 今解除した
          // TODO 5  STAY
          const newAmount = round(updatePrice + delta, 4)
          setCurrentAmount(newAmount)
        } else {
          // 以前から選択していない
          // TODO 6 UP
          if (anchorPrice > currentAmount) {
            const newAmount = upPrice
            setCurrentAmount(newAmount)
          }
        }
      }
    }
    setPrevIsActive(isActive)
    setPrevSelectedCount(selectedCount)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCount])

  const toggleSelect = () => {
    const isSelect = !isActive
    if (isSelect) {
      console.log('select')
    } else {
      console.log('un select', currentAmount)
      setAnchorPrice(currentAmount)
    }
  }

  return (
    <Wrapper onClick={toggleSelect}>
      <NftFrame
        {...{ src, collection, name, isActive, chainId }}
        amount={currentAmount}
      />
    </Wrapper>
  )
}

const Wrapper = styled('div')({})
