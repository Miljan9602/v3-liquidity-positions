import {
  DecreaseLiquidity as DecreaseLiquidityEvent,
  IncreaseLiquidity as IncreaseLiquidityEvent, NonfungibleTokenPositionManagerAddress,
  Transfer as TransferEvent
} from "../generated/NonfungibleTokenPositionManagerAddress/NonfungibleTokenPositionManagerAddress"
import {
  DecreaseLiquidity,
  IncreaseLiquidity,
  Transfer,
  Token,
  LiquidityPosition
} from "../generated/schema"
import {Address, BigInt, Bytes} from "@graphprotocol/graph-ts";
import {ERC20} from "../generated/NonfungibleTokenPositionManagerAddress/ERC20";

const NON_FUNGIBLE_POSITION_MANAGER_ADDRESS = Address.fromHexString("0xCB796653533a4C0982D7C698932e2008A32209AA")
const FACTORY_ADDRESS = Address.fromHexString("0x12437643B9c943201407695409386c264516c0BC")
const CHAIN_ID = 1329

import {computePoolAddress, FeeAmount} from "@miljan9602/dswap-v3-sdk"
import {Token as PoolToken} from "@miljan9602/dswap-sdk-core"

export function handleDecreaseLiquidity(event: DecreaseLiquidityEvent): void {
  let entity = new DecreaseLiquidity(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )

  entity.tokenId = event.params.tokenId
  entity.liquidity = event.params.liquidity
  entity.amount0 = event.params.amount0
  entity.amount1 = event.params.amount1


  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleIncreaseLiquidity(event: IncreaseLiquidityEvent): void {
  let entity = new IncreaseLiquidity(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )


  event.params.tokenId

  entity.tokenId = event.params.tokenId
  entity.liquidity = event.params.liquidity
  entity.amount0 = event.params.amount0
  entity.amount1 = event.params.amount1

  // const token0 = getOrCreateToken(event.params.token0)
  // const token1 = getOrCreateToken(event.params.token1)

  // const firstToken = new Token(1, '0xc0AB4F2E35Ed034D980a53a5a9B6B1e86a805f4E', 18)
  // const secondToken = new Token(1, '0xc0AB4F2E35Ed034D980a53a5a9B6B1e86a805f4E', 18)
  // const pool = new Pool(firstToken, secondToken, 0.05, 1, 0, 10)
  //
  // const position = new Position({pool: pool, liquidity : 1, tickLower : -1, tickUpper  : 1})
  // const firstAmount = position.amount1
  // const secondAmount = position.amount0

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  event.block.number

  entity.save()
}

function getOrCreateLiquidityPosition(tokenId: BigInt, blockNumber: BigInt, blockTimestamp: BigInt) : LiquidityPosition {

  let id = Bytes.fromI32(tokenId.toI32())
  let position = LiquidityPosition.load(id)
  let contract = NonfungibleTokenPositionManagerAddress.bind(NON_FUNGIBLE_POSITION_MANAGER_ADDRESS)

  if (position === null) {

    let contractPositionData = contract.positions(tokenId)

    position = new LiquidityPosition(id)
    position.owner = contract.ownerOf(tokenId)
    position.liquidity = contractPositionData.getLiquidity()
    position.token0 = contractPositionData.getToken0().toHexString()
    position.token1 = contractPositionData.getToken1().toHexString()
    position.fee = BigInt.fromString(contractPositionData.getFee().toString())
    position.poolAddress = getPoolAddress(position.token0, position.token1, position.fee)
    position.amount0 = BigInt.fromI32(0)
    position.amount1 = BigInt.fromI32(0)
    position.lastUpdatedBlockNumber = blockNumber
    position.lastUpdatedBlockTimestamp = blockTimestamp

    position.save()
  }

  return position
}

function getPoolAddress(token0: string, token1: string, fee: BigInt): string {
  
  let firstToken = getOrCreateToken(token0)
  let secondToken = getOrCreateToken(token1)

  let firstPoolToken = new PoolToken(CHAIN_ID, firstToken.id.toHexString(), firstToken.decimals.toI32(), firstToken.symbol, firstToken.name)
  let secondPoolToken = new PoolToken(CHAIN_ID, secondToken.id.toHexString(), secondToken.decimals.toI32(), secondToken.symbol, secondToken.name)

  let feeTier = function getFeeAmount(fee: BigInt): FeeAmount {
    if (fee.equals(BigInt.fromI32(100))) {
      return FeeAmount.LOWEST
    } else if (fee.equals(BigInt.fromI32(500))) {
      return FeeAmount.LOW
    } else if (fee.equals(BigInt.fromI32(3000))) {
      return FeeAmount.MEDIUM
    }
    return FeeAmount.HIGH
}

  return computePoolAddress({
    factoryAddress: FACTORY_ADDRESS.toHexString(),
    fee: feeTier(fee),
    tokenA: firstPoolToken,
    tokenB: secondPoolToken
  });
}

function getOrCreateToken(tokenAddress: string): Token  {

  let tokenId = Bytes.fromHexString(tokenAddress)
  let token = Token.load(tokenId)
  const contract = ERC20.bind(Address.fromHexString(tokenAddress))

  if (token === null) {
    token = new Token(tokenId)
    token.symbol = contract.symbol()
    token.name = contract.name()
    token.decimals = contract.decimals()
    token.save()
  }

  return token
}

export function handleTransfer(event: TransferEvent): void {
  let entity = new Transfer(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.from = event.params.from
  entity.to = event.params.to
  entity.tokenId = event.params.tokenId

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}
