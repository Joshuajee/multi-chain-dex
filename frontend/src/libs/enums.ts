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
    BNB_TEST = "0xfeaA40C32FdE5674D41DB86bD84177d5714e5cF8",
    MUMBAI = "0xF7bf0D92D65e51FF7eA9c2ed5d32A0fa92F91077"
}  

export enum GAS_FEES {
    CREATE = 10000000,
    ADD_LIQUIDITY = 1000000,
    SWAP_TOKEN = 200000,
}  
