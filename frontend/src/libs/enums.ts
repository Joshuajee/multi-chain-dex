export enum ROUTES {
    SWAP = "/",
    TOKENS = "/tokens",
    POOLS = "/pools",
    NEW_POSITION = "/pools/new-position"
}

export enum CHAIN_ID {
    NONE = 0,
    AVALANCHE_FUJI = 43113,
    BNB_TEST = 97,
    MUMBAI = 80001
}  

export enum DOMAIN_ID {
    NONE = 0,
    AVALANCHE_FUJI = 43113,
    BNB_TEST = 97,
    MUMBAI = 80001
}  

export enum FACTORY_ADDRESS {
    NONE = 0,
    AVALANCHE_FUJI = "0x41F4ee20CE94C9F327F3ee5223FCAE982CDB9815",
    BNB_TEST = "0xF5613C6F28C3e03839f72CD62C36E4321f307D75",
    MUMBAI = "0x8EA7d56f0Dcf565e5cd6a7D18A0990b8B0e3A51c"
}  

export enum GAS_FEES {
    CREATE = 11000000,
    ADD_LIQUIDITY = 300000,
    SWAP_TOKEN = 200000,
}  
