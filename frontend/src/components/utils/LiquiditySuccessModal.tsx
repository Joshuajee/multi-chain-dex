import Link from "next/link";
import ModalWrapper from "./ModalWrapper"
import { ROUTES } from "@/libs/enums";


interface IProps {
    open: boolean;
    symbol1: string;
    symbol2: string;
    handleClose(): void; 
}

const LiquiditySuccessModal = (props: IProps) => {

    const { open, symbol1, symbol2, handleClose } = props

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
            <p className="text-center text-lg px-4 md:px-10">You have successfully provided Liquidity to,  {symbol1} / {symbol2} </p>
        
            <div className="flex justify-center gap-2 mt-4">
                <Link href={ROUTES.POOLS}>
                    <button className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg">
                        View Position
                    </button>
                </Link>
                <button onClick={handleClose} className="bg-gray-500 hover:bg-gray-600 text-white w-32 p-2 rounded-lg">
                    Close
                </button>
            </div>
        </ModalWrapper>
    )
}

export default LiquiditySuccessModal