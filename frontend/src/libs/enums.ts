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
    AVALANCHE_FUJI = "0x8817f100b8E40A74F63CC592f3CaC92a3e9fcD51",
    AFIJORES = "0x86f09775afEEBBffC05E70C4Af8663e8960D2ca3",
    MUMBAI = "0x055d405D3e8110c571B5D94788F8904709B5042C"
}  

export enum GAS_FEES {
    CREATE = 3000000,
    ADD_LIQUIDITY = 600000,
    REMOVE_LIQUIDITY = 1000000,
    SWAP_TOKEN = 400000,
}  
