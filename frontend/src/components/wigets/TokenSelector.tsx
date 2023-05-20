import React from "react";
import { useAccount, useBalance } from 'wagmi'
import { MIN_AMOUNT, supportedNetworks } from "@/libs/utils";
import SelectToken from "./SelectToken";
import { TailSpin } from "react-loader-spinner";


interface IProps {
    value?: number;
    setValue?: (value?: number) => void;
    chainIndex: number  | string;
    setChainIndex?: (value: number | string) => void;
    selectable: boolean;
    disableInput?: boolean;
}

const TokenSelector = (props: IProps) => {

    const chain = supportedNetworks[Number(props?.chainIndex)]

    const { address, isConnected } = useAccount()

    const { data, isLoading } = useBalance({
        address: address,
        chainId: chain?.chainId,
        enabled: chain.chainId != 0,
        watch: true
    })

    const handleChangeEvent = (e: React.ChangeEvent<HTMLInputElement>) => {
        props?.setValue?.(Number(e.target.value))
    }

    const handleSelectEvent = (e: React.ChangeEvent<HTMLSelectElement>) => {
        props?.setChainIndex?.(e.target.value)
    }

    return (
        <div className="flex justify-between items-center bg-gray-200 rounded-2xl px-2 h-20 md:h-24 mt-2">
            
            <div>
                <input step="any" disabled={props.disableInput} min={MIN_AMOUNT}  placeholder="0" type={"number"} className="swap-input text-3xl outline-none bg-gray-200 w-full" value={props.value} onChange={handleChangeEvent} />
            </div>

            <div className="flex flex-col  items-end">

                {
                    props.selectable ?
                        (<SelectToken chainIndex={0} handleSelectEvent={handleSelectEvent} />)
                            :
                        ( 
                            <p className="min-w-[120px] cursor-pointer text-center py-2 w-full bg-gray-400 h-10 rounded-lg outline-none">
                                {   chain?.name  }
                            </p>
                        )
                }

                { 
                    isConnected && chain.chainId != 0 && 
                        <div className="mt-2 text-sm font-normal flex" >
                            <p className="mr-[1px]">Balance:  </p> 
                            {
                                isLoading ?
                                    <div className="ml-2">
                                        <TailSpin height="20" width="20" 
                                            color="#4fa94d" ariaLabel="tail-spin-loading" 
                                            radius="2" wrapperStyle={{}} wrapperClass="" visible={true}/>
                                    </div>
                                    :
                                    <p className="ml-[1px]"> {Number(data?.formatted?.toString())?.toFixed(4)} </p>
                            }   
                        </div>
                }

            </div>

        </div>
    )
}

export default TokenSelector