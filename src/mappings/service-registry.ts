import { log } from "@graphprotocol/graph-ts";
import { Service, User } from "../../generated/schema";
import {
  ServiceCreated,
  ServiceConfirmed,
  ServiceFinished,
  ServiceRejected,
  ProposalCreated,
  ProposalRejected,
  ProposalUpdated,
} from "../../generated/ServiceRegistry/ServiceRegistry";
import { getOrCreateService, getOrCreateProposal } from "../getters";
import { generateProposalId } from "./utils";

export function handleServiceCreated(event: ServiceCreated): void {
  const service = getOrCreateService(event.params.id);
  service.buyer = User.load(event.params.buyerId.toString())!.id;

  const sellerId = event.params.sellerId.toString();
  log.warning("seller: {}", [sellerId]);
  if (sellerId != "0") {
    service.seller = User.load(sellerId)!.id;
  } else {
    service.status = "Opened";
  }

  service.sender = User.load(event.params.initiatorId.toString())!.id;
  if (event.params.initiatorId == event.params.buyerId) {
    service.recipient = service.seller;
  } else if (event.params.initiatorId == event.params.sellerId) {
    service.recipient = service.buyer;
  } else {
    log.error("Service created by neither buyer nor seller, senderId: {}", [
      event.params.initiatorId.toString(),
    ]);
  }

  service.uri = event.params.serviceDataUri;

  service.createdAt = event.block.timestamp;
  service.updatedAt = event.block.timestamp;

  service.save();
}

export function handleServiceConfirmed(event: ServiceConfirmed): void {
  const service = getOrCreateService(event.params.id);
  service.status = "Confirmed";
  service.updatedAt = event.block.timestamp;
  service.save();
}

export function handleServiceFinished(event: ServiceFinished): void {
  const service = getOrCreateService(event.params.id);
  service.status = "Finished";
  service.updatedAt = event.block.timestamp;
  service.save();
}

export function handleServiceRejected(event: ServiceRejected): void {
  const service = getOrCreateService(event.params.id);
  service.status = "Rejected";
  service.updatedAt = event.block.timestamp;
  service.save();
}

export function handleProposalCreated(event: ProposalCreated): void {
  const proposalId = generateProposalId(event.params.serviceId.toString(), event.params.sellerId.toString());
  const proposal = getOrCreateProposal(proposalId);
  proposal.status = "Pending";

  proposal.rateToken = event.params.rateToken;
  proposal.rateAmount = event.params.rateAmount;
  proposal.uri = event.params.proposalDataUri;
  proposal.service = Service.load(event.params.serviceId.toString())!.id;
  proposal.seller = User.load(event.params.sellerId.toString())!.id;

  proposal.createdAt = event.block.timestamp;
  proposal.updatedAt = event.block.timestamp;

  proposal.save();
}

export function handleProposalRejected(event: ProposalRejected): void {
  const proposalId = generateProposalId(event.params.serviceId.toString(), event.params.sellerId.toString());
  const proposal = getOrCreateProposal(proposalId);
  proposal.status = "Rejected";
  proposal.updatedAt = event.block.timestamp;
  proposal.save();
}

export function handleProposalUpdated(event: ProposalUpdated): void {
  const proposalId = generateProposalId(event.params.serviceId.toString(), event.params.sellerId.toString());
  const proposal = getOrCreateProposal(proposalId);
  proposal.rateToken = event.params.rateToken;
  proposal.rateAmount = event.params.rateAmount;
  proposal.uri = event.params.proposalDataUri;
  proposal.updatedAt = event.block.timestamp;
  proposal.save();
}
