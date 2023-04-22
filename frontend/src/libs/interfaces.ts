import { Address } from "wagmi";
import { CHAIN_ID, FACTORY_ADDRESS } from "./enums";
import { SUPPORTED_SYMBOLS } from "./types";

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