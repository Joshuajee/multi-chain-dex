export enum ROUTES {
    SWAP = "/",
    TOKENS = "/tokens",
    POOLS = "/pools",
    FAUCETS = "/faucets",
    NEW_POSITION = "/pools/new-position"
}

export enum CHAIN_ID {
    NONE = 0,
    AVALANCHE_FUJI = 43113,
    AFIJORES = 44787,
    MUMBAI = 80001
}  

export enum DOMAIN_ID {
    NONE = 0,
    AVALANCHE_FUJI = 43113,
    AFIJORES = 44787,
    MUMBAI = 80001
}  

export enum FACTORY_ADDRESS {
    NONE = 0,
    AVALANCHE_FUJI = "0xaaE37b1905F5461BAAC7C871fDa7462bd5D748E9",
    AFIJORES = "0xB7a9a945538DfEb40c5F1654Ad469aA51936b13d",
    MUMBAI = "0xAc2b2C0A8eF52C5426387F6F9D4665038b0AaE72"
}  

export enum GAS_FEES {
    CREATE = 3000000,
    ADD_LIQUIDITY = 600000,
    REMOVE_LIQUIDITY = 1000000,
    SWAP_TOKEN = 400000,
}  
