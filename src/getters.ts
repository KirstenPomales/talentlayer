import { BigInt, Bytes, Address, log } from '@graphprotocol/graph-ts'
import {
  User,
  Review,
  Service,
  Proposal,
  Payment,
  Platform,
  Token,
  FeeClaim,
  FeePayment,
  PlatformGain,
  UserGain,
  Protocol,
  Transaction,
  Evidence,
  Keyword,
} from '../generated/schema'
import { PROTOCOL_ID, ZERO, ZERO_ADDRESS, ZERO_BIGDEC, ZERO_TOKEN_ADDRESS } from './constants'
import { ERC20 } from '../generated/TalentLayerEscrow/ERC20'

export function getOrCreateService(id: BigInt): Service {
  let service = Service.load(id.toString())
  if (!service) {
    service = new Service(id.toString())
    service.status = 'Filled'
    service.createdAt = ZERO
    service.updatedAt = ZERO
    service.save()
  }
  return service
}

export function getOrCreateProposal(id: string, serviceId: BigInt): Proposal {
  let proposal = Proposal.load(id)
  if (!proposal) {
    proposal = new Proposal(id)
    proposal.status = 'Pending'
    proposal.createdAt = ZERO
    proposal.updatedAt = ZERO
    proposal.service = getOrCreateService(serviceId).id
    proposal.rateToken = getOrCreateToken(ZERO_ADDRESS).id
    proposal.save()
  }
  return proposal
}

export function getOrCreateReview(id: BigInt, serviceId: BigInt, toId: BigInt): Review {
  let review = Review.load(id.toString())
  if (!review) {
    review = new Review(id.toString())
    review.to = getOrCreateUser(toId).id
    review.service = getOrCreateService(serviceId).id
    review.createdAt = ZERO
    review.save()
  }
  return review
}

export function getOrCreateUser(id: BigInt): User {
  let user = User.load(id.toString())
  if (!user) {
    user = new User(id.toString())
    user.address = ZERO_ADDRESS.toHex()
    user.handle = ''
    user.withPoh = false
    user.numReviews = ZERO
    user.rating = ZERO_BIGDEC
    user.createdAt = ZERO
    user.updatedAt = ZERO
    user.save()
  }
  return user
}

export function getOrCreateTransaction(id: BigInt, blockTimestamp: BigInt = ZERO): Transaction {
  let transaction = Transaction.load(id.toString())
  if (!transaction) {
    transaction = new Transaction(id.toString())
    transaction.token = ''
    transaction.amount = ZERO
    transaction.protocolEscrowFeeRate = 0
    transaction.originPlatformEscrowFeeRate = 0
    transaction.platformEscrowFeeRate = 0
    transaction.senderFee = ZERO
    transaction.receiverFee = ZERO
    transaction.lastInteraction = blockTimestamp
    transaction.status = 'NoDispute'
    transaction.arbitrator = ZERO_ADDRESS
    transaction.arbitratorExtraData = Bytes.empty()
    transaction.arbitrationFeeTimeout = ZERO
    transaction.metaEvidenceUri = ''
    transaction.save()
  }
  return transaction
}

export function getOrCreatePayment(paymentId: string, serviceId: BigInt): Payment {
  let payment = Payment.load(paymentId)
  if (!payment) {
    payment = new Payment(paymentId.toString())
    payment.service = getOrCreateService(serviceId).id
    payment.amount = ZERO
    payment.paymentType = ''
  }
  return payment
}

export function getOrCreatePlatform(platformId: BigInt): Platform {
  let platform = Platform.load(platformId.toString())
  if (!platform) {
    platform = new Platform(platformId.toString())
    platform.address = ZERO_ADDRESS
    platform.createdAt = ZERO
    platform.updatedAt = ZERO
    platform.name = ''
    platform.platformEscrowFeeRate = 0
    platform.arbitrator = ZERO_ADDRESS
    platform.arbitratorExtraData = Bytes.empty()
    platform.arbitrationFeeTimeout = ZERO
    platform.save()
  }
  return platform
}

export function getOrCreateToken(tokenAddress: Bytes): Token {
  let contract = ERC20.bind(Address.fromBytes(tokenAddress))
  let token = Token.load(tokenAddress.toHex())

  if (!token) {
    token = new Token(tokenAddress.toHex())
    token.address = tokenAddress

    if (tokenAddress.toHex() == ZERO_TOKEN_ADDRESS) {
      token.symbol = 'ETH'
      token.name = 'Ether'
      token.decimals = BigInt.fromString('18')
    } else {
      let callResultSymbol = contract.try_symbol()
      if (callResultSymbol.reverted) {
        log.info('Reverted {}', ['Reverted'])
      } else {
        let result = callResultSymbol.value
        log.info('Symbol {}', [result])
        token.symbol = result
      }

      let callResultName = contract.try_name()
      if (callResultName.reverted) {
        log.info('Reverted {}', ['Reverted'])
      } else {
        let result = callResultName.value
        log.info('Name {}', [result])
        token.name = result
      }

      let callResultDecimal = contract.try_decimals()
      if (callResultDecimal.reverted) {
        log.info('Reverted {}', ['Reverted'])
      } else {
        let result = callResultDecimal.value
        log.info('decimals {}', [result.toString()])
        token.decimals = BigInt.fromI32(result)
      }
    }
    // Token initially set to non-allowed. Status will be handled in "handleAllowedTokenListUpdated" handler
    token.allowed = false
    token.save()
  }
  return token
}

export function getOrCreateOriginPlatformFee(paymentId: string): FeePayment {
  let originPlatformFeePayment = FeePayment.load(paymentId)
  if (!originPlatformFeePayment) {
    originPlatformFeePayment = new FeePayment(paymentId)
    originPlatformFeePayment.type = 'OriginPlatform'
    originPlatformFeePayment.amount = ZERO
    originPlatformFeePayment.save()
  }
  return originPlatformFeePayment
}

export function getOrCreatePlatformFee(paymentId: string): FeePayment {
  let platformFeePayment = FeePayment.load(paymentId)
  if (!platformFeePayment) {
    platformFeePayment = new FeePayment(paymentId)
    platformFeePayment.type = 'Platform'
    platformFeePayment.amount = ZERO
    platformFeePayment.save()
  }
  return platformFeePayment
}

export function getOrCreateClaim(claimId: string): FeeClaim {
  let claim = FeeClaim.load(claimId)
  if (!claim) {
    claim = new FeeClaim(claimId)
    claim.amount = ZERO
    claim.save()
  }
  return claim
}

export function getOrCreatePlatformGain(gainId: string): PlatformGain {
  let platformGain = PlatformGain.load(gainId)
  if (!platformGain) {
    platformGain = new PlatformGain(gainId)
    platformGain.totalOriginPlatformFeeGain = ZERO
    platformGain.totalPlatformFeeGain = ZERO
    platformGain.save()
  }
  return platformGain
}

export function getOrCreateUserGain(gainId: string, userId: BigInt): UserGain {
  let userGain = UserGain.load(gainId)
  if (!userGain) {
    userGain = new UserGain(gainId)
    userGain.totalGain = ZERO
    userGain.user = getOrCreateUser(userId).id
    userGain.save()
  }
  return userGain
}

export function getOrCreateProtocol(): Protocol {
  let protocol = Protocol.load(PROTOCOL_ID)
  if (!protocol) {
    protocol = new Protocol(PROTOCOL_ID)
    protocol.userMintFee = ZERO
    protocol.platformMintFee = ZERO
    protocol.protocolEscrowFeeRate = 0
    protocol.originPlatformEscrowFeeRate = 0
    protocol.totalMintFees = ZERO
    protocol.minArbitrationFeeTimeout = ZERO
  }
  return protocol
}

export function getOrCreateEvidence(evidenceId: string, transactionId: BigInt): Evidence {
  let evidence = Evidence.load(evidenceId)
  if (!evidence) {
    evidence = new Evidence(evidenceId)
    evidence.createdAt = ZERO
    evidence.uri = ''
    evidence.transaction = getOrCreateTransaction(transactionId).id
  }
  return evidence
}

export function getOrCreateKeyword(id: string): Keyword {
  let keyword = Keyword.load(id)
  if (!keyword) {
    keyword = new Keyword(id)
    keyword.save()
  }
  return keyword
}

// The following getters are currently not in use
// export function getOrCreateServiceDescription(cid: string, serviceId: BigInt) : ServiceDescription {
//   let serviceDescription = ServiceDescription.load(cid)
//   if(!serviceDescription) {
//     serviceDescription = new ServiceDescription(cid)
//     serviceDescription.service = serviceId.toString()
//     serviceDescription.save()
//   }
//   return serviceDescription
// }

// export function getOrCreateReviewDescription(cid: string) : ReviewDescription {
//   let reviewDescription = ReviewDescription.load(cid)
//   if(!reviewDescription) {
//     reviewDescription = new ReviewDescription(cid)
//     reviewDescription.save()
//   }
//   return reviewDescription
// }

// export function getOrCreateUserDescription(cid: string) : UserDescription {
//   let userDescription = UserDescription.load(cid)
//   if(!userDescription) {
//     userDescription = new UserDescription(cid)
//     userDescription.save()
//   }
//   return userDescription
// }

// export function getOrCreateProposalDescription(cid: string) : ProposalDescription {
//   let proposalDescription = ProposalDescription.load(cid)
//   if(!proposalDescription) {
//     proposalDescription = new ProposalDescription(cid)
//     proposalDescription.save()
//   }
//   return proposalDescription
// }

// export function getOrCreatePlatformDescription(cid: string) : PlatformDescription {
//   let platformDescription = PlatformDescription.load(cid)
//   if(!platformDescription) {
//     platformDescription = new PlatformDescription(cid)
//     platformDescription.save()
//   }
//   return platformDescription
// }
