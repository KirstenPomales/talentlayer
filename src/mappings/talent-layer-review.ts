import { BigInt, DataSourceContext } from '@graphprotocol/graph-ts'
import { User } from '../../generated/schema'
import { Approval, ApprovalForAll, Mint, Transfer } from '../../generated/TalentLayerReview/TalentLayerReview'
import { getOrCreateReview, getOrCreateService, getOrCreateUserStat } from '../getters'
import { ONE } from '../constants'
import { ReviewData } from '../../generated/templates'

export function handleApproval(event: Approval): void {}

export function handleApprovalForAll(event: ApprovalForAll): void {}

export function handleMint(event: Mint): void {
  const review = getOrCreateReview(event.params.tokenId, event.params.serviceId, event.params.toId)
  review.rating = event.params.rating
  review.createdAt = event.block.timestamp
  review.cid = event.params.reviewUri

  const receiver = User.load(event.params.toId.toString())
  const receiverStats = getOrCreateUserStat(event.params.toId)

  if (!receiver) return

  receiverStats.numGivenReviews = receiverStats.numGivenReviews.plus(ONE)
  receiver.rating
    .times(receiverStats.numReceivedReviews.toBigDecimal())
    .plus(event.params.rating.toBigDecimal())
    .div(receiverStats.numReceivedReviews.toBigDecimal())

  receiver.save()
  receiverStats.save()

  const service = getOrCreateService(event.params.serviceId)
  const buyerStats = getOrCreateUserStat(BigInt.fromString(service.buyer!))
  const sellerStats = getOrCreateUserStat(BigInt.fromString(service.seller!))

  if (receiverStats.id == buyerStats.id) {
    sellerStats.numGivenReviews
    sellerStats.save()
  } else {
    buyerStats.numGivenReviews
    buyerStats.save()
  }

  const cid = event.params.reviewUri
  const dataId = cid + '-' + event.block.timestamp.toString()
  const context = new DataSourceContext()
  context.setString('reviewId', review.id)
  context.setString('id', dataId)

  ReviewData.createWithContext(cid, context)

  review.description = dataId
  review.save()
}

export function handleTransfer(event: Transfer): void {}
