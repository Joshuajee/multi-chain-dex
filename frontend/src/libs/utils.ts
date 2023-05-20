import { BigNumber, ethers } from "ethers"
import { isAddress } from "ethers/lib/utils.js"
import { Address } from "wagmi"
import { CHAIN_ID, DOMAIN_ID, FACTORY_ADDRESS } from "./enums"
import { SUPPORTED_NETWORKS } from "./interfaces"
import { SUPPORTED_SYMBOLS } from "./types"

export const MIN_AMOUNT = 0.000001

export const dollarFormat = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount)
}

export const contractAddress = process.env.NEXT_PUBLIC_CONTRACT


export const networkNameByChainId = (chainId: number) => {

    switch (chainId) {
        case 1:
            return "Ethereum Mainnet"
        case 5:
            return "Goerli"
        case 56:
            return "BNB Smart Chain Mainnet"
        case 97:
            return "BNB Smart Chain Testnet"
        case 137:
            return "Polygon Mainnet"
        case 80001:
            return "Mumbai"
        default:
            return "Unknown Network"
    }

}


export const currencyByChainId = (chainId: number) : SUPPORTED_SYMBOLS => {

    switch (chainId) {
        case CHAIN_ID.AVALANCHE_FUJI:
            return "AVAX"
        case CHAIN_ID.AFIJORES:
            return "CELO"
        case CHAIN_ID.MUMBAI:
            return "MATIC"
        default:
            return ""
    }

}


export const currencyByDomainId = (domainId: DOMAIN_ID): SUPPORTED_SYMBOLS => {

    switch (domainId) {
        case DOMAIN_ID.AVALANCHE_FUJI:
            return "AVAX"
        case DOMAIN_ID.AFIJORES:
            return "CELO"
        case DOMAIN_ID.MUMBAI:
            return "MATIC"
        default:
            return ""
    }

}

export const addressByDomainId = (domainId: DOMAIN_ID) => {

    switch (domainId) {
        case DOMAIN_ID.AVALANCHE_FUJI:
            return FACTORY_ADDRESS.AVALANCHE_FUJI
        case DOMAIN_ID.AFIJORES:
            return FACTORY_ADDRESS.AFIJORES
        case DOMAIN_ID.MUMBAI:
            return FACTORY_ADDRESS.MUMBAI
        default:
            return FACTORY_ADDRESS.NONE
    }

}

export const networkNameByDomainId = (domainId: DOMAIN_ID) => {

    switch (domainId) {
        case DOMAIN_ID.AVALANCHE_FUJI:
            return "Avalanche Fuji"
        case DOMAIN_ID.AFIJORES:
            return "Alfajore"
        case DOMAIN_ID.MUMBAI:
            return "Mumbai"
        default:
            return ""
    }

}

export const getDate = () => {

    const date = new Date()

    const year = date.getFullYear()
    const month = (date.getMonth() + 1 > 10) ? date.getMonth() + 1 : `0${date.getMonth() + 1}`

    return (`${year}-${month}-${date.getDate()}`)

}

export const isEthAddress = (address: Address) => {
    return ethers.utils.isAddress(address)
}

export const convertToEther = (price: number | BigNumber) => {
    if (!price) return 0
    return (ethers.utils.formatUnits(price.toString(), 'ether')).toString()
}

export const convertToWEI = (amount: number) => {
    if (!amount) return 0
    if (amount < MIN_AMOUNT) return 0
    return Number(amount) <= 0 ? 0 : ethers.utils.parseUnits(amount.toString(), 'ether')
}

export const  removeDecimal = (price: number, dicimal: number) => {
    if (!price) return 0
    return (ethers.utils.formatUnits(price.toString(), dicimal)).toString()
}


export const dateToTimeStamp = (date: Date) => {
    return new Date(date).getTime() / 1000
}

export const isAddressZero = (address: Address) => {
    if (address === "0x0000000000000000000000000000000000000000") return true
    return false
}


export const supportedNetworks : SUPPORTED_NETWORKS [] = [
    {
        name: "Select Network",
        description: "",
        icon: "",
        chainId: CHAIN_ID.NONE,
        domainId: DOMAIN_ID.NONE,
        factoryAddress: FACTORY_ADDRESS.NONE,
        symbol: "",
    },
    {
        name: "Mumbai",
        description: "",
        icon: "",
        chainId: CHAIN_ID.MUMBAI,
        domainId: DOMAIN_ID.MUMBAI,
        factoryAddress: FACTORY_ADDRESS.MUMBAI,
        symbol: "MATIC",
    },
    {
        name: "Avalanche Fuji",
        description: "",
        icon: "",
        chainId: CHAIN_ID.AVALANCHE_FUJI,
        domainId: DOMAIN_ID.AVALANCHE_FUJI,
        factoryAddress: FACTORY_ADDRESS.AVALANCHE_FUJI,
        symbol: "AVAX",
    },
    {
        name: "Alfajores",
        description: "",
        icon: "",
        chainId: CHAIN_ID.AFIJORES,
        domainId: DOMAIN_ID.AFIJORES,
        factoryAddress: FACTORY_ADDRESS.AFIJORES,
        symbol: "CELO",
    }
]

export const tokenSelected = (chainId1: number, chainId2: number): boolean => {
    if (chainId1 === chainId2) return false
    if (chainId1 === CHAIN_ID.NONE || chainId2 === CHAIN_ID.NONE) return false
    return true
}

export const getPrice = (amountIn: number, reserve1: BigNumber, reserve2: BigNumber): number => {

    if (amountIn <= 0) return 0

    const amount = BigNumber.from(convertToWEI(amountIn))

    const num = reserve1.mul(amount)

    const dem = reserve2.add(amount)

    return Number(convertToEther(num.div(dem)))
}

export const getPriceRatio = (reserve1: BigNumber, reserve2: BigNumber) : BigNumber  => {
    if (reserve1.gt(reserve2)) return reserve1.div(reserve2)
    return  BigNumber.from(1).div(reserve2.div(reserve1))
}

