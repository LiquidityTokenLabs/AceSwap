import { gql } from '@apollo/client'

const GET_TRANSFERS = gql`
  {
    accountToStakes {
      id
      address
      type
      tokenIds
    }
  }
`

export default GET_TRANSFERS
