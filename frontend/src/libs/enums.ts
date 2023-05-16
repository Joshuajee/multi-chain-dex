export enum ROUTES {
    SWAP = "/",
    TOKENS = "/tokens",
    POOLS = "/pools",
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
    AVALANCHE_FUJI = "0x08A778a42D49fD56bDDDA55dFe9c5aA8766eF6eE",
    AFIJORES = "0x86f09775afEEBBffC05E70C4Af8663e8960D2ca3",
    MUMBAI = "0xa0Da51F0c0578973D6A3d8E83Dec9Da5d2f2911d"
}  

export enum GAS_FEES {
    CREATE = 3000000,
    ADD_LIQUIDITY = 600000,
    REMOVE_LIQUIDITY = 1000000,
    SWAP_TOKEN = 400000,
}  
