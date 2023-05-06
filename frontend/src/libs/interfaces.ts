import { Address } from "wagmi";
import { CHAIN_ID, FACTORY_ADDRESS } from "./enums";
import { SUPPORTED_SYMBOLS } from "./types";
import { BigNumber } from "ethers";

export interface SUPPORTED_NETWORKS {
    name: string,
    description: string,
    icon: string,
    chainId: CHAIN_ID,
    domainId: number,
    mailbox?: Address,
    factoryAddress: FACTORY_ADDRESS,
    symbol: SUPPORTED_SYMBOLS;
}


export interface POSITION {
    id: Address,
    owner: Address,
    amountIn1: BigNumber,
    amountIn2: BigNumber,
    availableFees: BigNumber,
    totalFees: BigNumber,
    paid: Boolean,
}