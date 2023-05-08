import { Address } from "wagmi";

export enum ROUTES {
    SWAP = "/",
    TOKENS = "/tokens",
    POOLS = "/pools",
    NEW_POSITION = "/pools/new-position"
}

export enum CHAIN_ID {
    NONE = 0,
    GOERLI = 5,
    BNB_TEST = 97,
    MUMBAI = 80001
}  

export enum DOMAIN_ID {
    NONE = 0,
    GOERLI = 5,
    BNB_TEST = 97,
    MUMBAI = 80001
}  

export enum FACTORY_ADDRESS {
    NONE = 0,
    GOERLI = "",
    BNB_TEST = "0xF80Af2b1d9b1dd7c342aD9d1bd4E79531c181269",
    MUMBAI = "0xBE4EC2736eC3D2f93365267da4e0b01C2c956323"
}  

export enum GAS_FEES {
    CREATE = 10000000,
    ADD_LIQUIDITY = 150000,
    SWAP_TOKEN = 100000,
}  
