import React from "react";
import { useAccount, useBalance } from 'wagmi'
import { SUPPORTED_NETWORKS } from "@/libs/interfaces";
import { supportedNetworks } from "@/libs/utils";
import { CHAIN_ID } from "@/libs/enums";


interface IProps {
    value: number | string;
    setValue: (value: string) => void;
    chainId: number  | CHAIN_ID | string;
    setChainId: (value: number | CHAIN_ID | string) => void;
}

const TokenSelector = (props: IProps) => {

    const { address, isConnected } = useAccount()

    const { data, isLoading } = useBalance({
        address: address,
        chainId: Number(props?.chainId),
    })

    const handleChangeEvent = (e: React.ChangeEvent<HTMLInputElement>) => {
        props.setValue(e.target.value)
    }

    const handleSelectEvent = (e: React.ChangeEvent<HTMLSelectElement>) => {
        props.setChainId(e.target.value)
    }

    return (
        <div className="flex justify-between items-center bg-gray-200 rounded-2xl px-2 h-16 md:h-24 mt-2">
            
            <div>
                <input placeholder="0" type={"number"} className="swap-input text-3xl outline-none bg-gray-200 w-full" value={props.value} onChange={handleChangeEvent} />
            </div>

            <div className="flex flex-col  items-end">

                <select className="min-w-48 outline-none" onChange={handleSelectEvent}>

                    { 
                        supportedNetworks.map((network: SUPPORTED_NETWORKS, index: number) => {
                            return (
                                <option value={network.chainId} key={index} className="min-w-48"> {network.name} </option>
                            )
                        }) 
                    }

                </select>

                { 
                    isConnected && <p className="mt-2 text-sm font-normal" >Balance: {Number(data?.formatted?.toString())?.toFixed(4)}</p>
                }

            </div>

        </div>
    )
}

export default TokenSelector