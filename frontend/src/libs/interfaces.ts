import { Address } from "wagmi";
import { CHAIN_ID } from "./enums";

export interface SUPPORTED_NETWORKS {
    name: string,
    description: string,
    icon: string,
    chainId: CHAIN_ID,
    domainId: number,
    mailbox: Address,
    
}