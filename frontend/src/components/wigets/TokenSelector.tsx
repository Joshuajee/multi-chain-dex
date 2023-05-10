import React from "react";
import { useAccount, useBalance } from 'wagmi'
import { SUPPORTED_NETWORKS } from "@/libs/interfaces";
import { supportedNetworks } from "@/libs/utils";
import { CHAIN_ID } from "@/libs/enums";
import SelectToken from "./SelectToken";


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
                <input disabled={props.disableInput}  placeholder="0" type={"number"} className="swap-input text-3xl outline-none bg-gray-200 w-full" value={props.value} onChange={handleChangeEvent} />
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
                    isConnected && <p className="mt-2 text-sm font-normal" >Balance: {Number(data?.formatted?.toString())?.toFixed(4)}</p>
                }

            </div>

        </div>
    )
}

export default TokenSelector