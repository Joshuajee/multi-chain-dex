import TokenSelector from '@/components/wigets/TokenSelector'
import Container from '@/components/utils/Container'
import Layout from '@/components/utils/Layout'
import { useEffect, useState } from 'react'
import { Address, useContractRead, } from 'wagmi'
import MDexV1NativeFactoryABI from "@/abi/contracts/MDexV1NativeFactory.sol/MDexV1NativeFactory.json";
import MDexV1PairNativeABI from "@/abi/contracts/MDexV1PairNative.sol/MDexV1PairNative.json";
import { convertToEther, convertToWEI, getPrice, isAddressZero, supportedNetworks, tokenSelected } from '@/libs/utils'
import { GAS_FEES } from '@/libs/enums'
import { SUPPORTED_NETWORKS } from '@/libs/interfaces'
import { BigNumber } from 'ethers'
import SwapBtn from '@/components/utils/buttons/SwapBtn'


export default function Facets() {

  
  return (
    <Layout>

      <Container>


      </Container>

    </Layout>
  )
}
