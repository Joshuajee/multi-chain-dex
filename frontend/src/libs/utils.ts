import { BigNumber, ethers } from "ethers"
import { isAddress } from "ethers/lib/utils.js"
import { Address } from "wagmi"
import { CHAIN_ID, DOMAIN_ID, FACTORY_ADDRESS } from "./enums"
import { SUPPORTED_NETWORKS } from "./interfaces"

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


export const currencyByChainId = (chainId: number) => {

    switch (chainId) {
        case CHAIN_ID.AVALANCHE_FUJI:
            return "Fuji"
        case CHAIN_ID.ACELO:
            return "Test BNB"
        case CHAIN_ID.MUMBAI:
            return "Matic"
        default:
            return ""
    }

}


export const currencyByDomainId = (domainId: DOMAIN_ID) => {

    switch (domainId) {
        case DOMAIN_ID.AVALANCHE_FUJI:
            return "Fuji"
        case DOMAIN_ID.ACELO:
            return "Test BNB"
        case DOMAIN_ID.MUMBAI:
            return "Matic"
        default:
            return ""
    }

}

export const networkNameByDomainId = (domainId: DOMAIN_ID) => {

    switch (domainId) {
        case DOMAIN_ID.AVALANCHE_FUJI:
            return "Avalanche Fuji"
        case DOMAIN_ID.ACELO:
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

export const convertToWEI = (amount: number | BigNumber) => {
    if (!amount) return 0
    return Number(amount) <= 0 ? 0 : ethers.utils.parseUnits(String(amount), 'ether')
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
        name: "Select Currency",
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
        mailbox: "0xCC737a94FecaeC165AbCf12dED095BB13F037685",
        factoryAddress: FACTORY_ADDRESS.MUMBAI,
        symbol: "MATIC",
    },
    {
        name: "AVALANCHE FUJI",
        description: "",
        icon: "",
        chainId: CHAIN_ID.AVALANCHE_FUJI,
        domainId: DOMAIN_ID.AVALANCHE_FUJI,
        mailbox: '0xCC737a94FecaeC165AbCf12dED095BB13F037685',
        factoryAddress: FACTORY_ADDRESS.AVALANCHE_FUJI,
        symbol: "FUJI",
    },
    {
        name: "Alfajores",
        description: "",
        icon: "",
        chainId: CHAIN_ID.ACELO,
        domainId: DOMAIN_ID.ACELO,
        mailbox: '0xCC737a94FecaeC165AbCf12dED095BB13F037685',
        factoryAddress: FACTORY_ADDRESS.ACELO,
        symbol: "FUJI",
    },
    {
        name: "BNB Testnet",
        description: "",
        icon: "",
        chainId: CHAIN_ID.BNB_TEST,
        domainId: DOMAIN_ID.BNB_TEST,
        mailbox: '0xCC737a94FecaeC165AbCf12dED095BB13F037685',
        factoryAddress: FACTORY_ADDRESS.BNB_TEST,
        symbol: "BNB",
    }

]

export const tokenSelected = (chainId1: number, chainId2: number): boolean => {
    if (chainId1 === chainId2) return false
    if (chainId1 === CHAIN_ID.NONE || chainId2 === CHAIN_ID.NONE) return false
    return true
}

export const getPrice = (amountIn: number, reserve1: BigNumber, reserve2: BigNumber): number => {

    const amount = BigNumber.from(convertToWEI(amountIn))

    const num = reserve1.mul(amount)

    const dem = reserve2.add(amount)

    return Number(convertToEther(num.div(dem)))
}

export const getPriceRatio = (reserve1: BigNumber, reserve2: BigNumber) : BigNumber  => {
    
    console.log("1 ", reserve1.toString())
    console.log("2 ", reserve2.toString())
    
    console.log(" == ",(reserve2.div(reserve1)).toString())
    
    if (reserve1.gt(reserve2)) return reserve1.div(reserve2)
    return  BigNumber.from(1).div(reserve2.div(reserve1))
}

