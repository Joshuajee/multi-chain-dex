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
    BNB_TEST = "0xacC3d06091e917E07a4624F2105d23D02567CdCD",
    MUMBAI = "0xfa5D6491A825b4428F333BFF9f9a8f38d39F8200"
}  

export enum GAS_FEES {
    CREATE = 10000000,
    ADD_LIQUIDITY = 150000,
    SWAP_TOKEN = 200000,
}  
