import Link from "next/link";
import ModalWrapper from "./ModalWrapper"
import { ROUTES } from "@/libs/enums";


interface IProps {
    open: boolean;
    initialAmount: number;
    payout: number;
    currency: string;
    handleClose(): void; 
}

const SwapSuccessModal = (props: IProps) => {

    const { open, initialAmount, payout, currency, handleClose } = props

    return (
        <ModalWrapper hideTitle={true} title="Liquidity Added Successfully" open={open} handleClose={handleClose}>
            
            <div className="flex justify-center">
                <div className="w-48">
                    <lottie-player 
                        src="https://assets8.lottiefiles.com/packages/lf20_lk80fpsm.json"  
                        background="transparent"  
                        speed="1"  autoplay />
                </div>
            </div>
            
            <h3 className="text-center text-2xl text-green-500 font-bold">Success</h3>
            
            <div className="p-4 md:p-10 font-semibold">

                <p className="text-center text-lg">
                    Currency Swap was Successful
                </p>

                <div className="flex justify-between p-2">
                    <p>Amount received</p>

                    <p> {payout} {currency}</p>
                </div>

                <div className="flex justify-between p-2">
                    <p>Initial Balance</p>

                    <p> {initialAmount} {currency}</p>
                </div>

                <div className="flex justify-between p-2">
                    <p>Final Balance </p>

                    <p> {Number(initialAmount) + Number(payout)} {currency}</p>
                </div>

            </div>
        
            <div className="flex justify-center gap-2 mt-4">
                <button onClick={handleClose} className="bg-green-500 hover:bg-green-600 text-white w-32 p-2 rounded-lg">
                    Done
                </button>
            </div>

        </ModalWrapper>
    )
}

export default SwapSuccessModal