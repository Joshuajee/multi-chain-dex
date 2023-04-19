import { ethers } from "ethers"
import { isAddress } from "ethers/lib/utils.js"
import { Address } from "wagmi"
import { CHAIN_ID, DOMAIN_ID } from "./enums"
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

export const getDate = () => {

    const date = new Date()

    const year = date.getFullYear()
    const month = (date.getMonth() + 1 > 10) ? date.getMonth() + 1 : `0${date.getMonth() + 1}`

    return (`${year}-${month}-${date.getDate()}`)

}

export const isEthAddress = (address: Address) => {
    return ethers.utils.isAddress(address)
}

export const convertToEther = (price: number) => {
    if (!price) return 0
    return (ethers.utils.formatUnits(price.toString(), 'ether')).toString()
}

export const convertToWEI = (amount: number) => {
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
        mailbox: "0xCC737a94FecaeC165AbCf12dED095BB13F037685",
    },
    {
        name: "Mumbai",
        description: "",
        icon: "",
        chainId: CHAIN_ID.MUMBAI,
        domainId: DOMAIN_ID.MUMBAI,
        mailbox: "0xCC737a94FecaeC165AbCf12dED095BB13F037685",
    },
    {
        name: "Goerli",
        description: "",
        icon: "",
        chainId: CHAIN_ID.GOERLI,
        domainId: DOMAIN_ID.GOERLI,
        mailbox: '0xCC737a94FecaeC165AbCf12dED095BB13F037685',
    },
    {
        name: "BNB Testnet",
        description: "",
        icon: "",
        chainId: CHAIN_ID.BNB_TEST,
        domainId: DOMAIN_ID.BNB_TEST,
        mailbox: '0xCC737a94FecaeC165AbCf12dED095BB13F037685',
    }

]