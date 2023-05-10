export enum ROUTES {
    SWAP = "/",
    TOKENS = "/tokens",
    POOLS = "/pools",
    NEW_POSITION = "/pools/new-position"
}

export enum CHAIN_ID {
    NONE = 0,
    SEPOLIA = 11155111,
    BNB_TEST = 97,
    MUMBAI = 80001
}  

export enum DOMAIN_ID {
    NONE = 0,
    SEPOLIA = 11155111,
    BNB_TEST = 97,
    MUMBAI = 80001
}  

export enum FACTORY_ADDRESS {
    NONE = 0,
    SEPOLIA = "0xF5613C6F28C3e03839f72CD62C36E4321f307D75",
    BNB_TEST = "0xF5613C6F28C3e03839f72CD62C36E4321f307D75",
    MUMBAI = "0x64f20d811c383ed8bB055582aa7e2C3F87847E16"
}  

export enum GAS_FEES {
    CREATE = 11000000,
    ADD_LIQUIDITY = 300000,
    SWAP_TOKEN = 200000,
}  
