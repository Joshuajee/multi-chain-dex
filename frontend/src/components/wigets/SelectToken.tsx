import React from "react";
import { useAccount, useBalance } from 'wagmi'
import { SUPPORTED_NETWORKS } from "@/libs/interfaces";
import { supportedNetworks } from "@/libs/utils";
import { CHAIN_ID } from "@/libs/enums";


interface IProps {
    chainIndex: number  | CHAIN_ID | string;
    handleSelectEvent: (e:  React.ChangeEvent<HTMLSelectElement>) => void;
}

const SelectToken = (props: IProps) => {

    return (
        <select className="min-w-48 h-10 rounded-lg outline-none" onChange={props.handleSelectEvent}>

            { 
                supportedNetworks.map((network: SUPPORTED_NETWORKS, index: number) => {
                    return (
                        <option value={index} key={index} className="min-w-48"> {network.name} </option>
                    )
                }) 
            }

        </select>
    )
}

export default SelectToken