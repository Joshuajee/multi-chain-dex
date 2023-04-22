import { ReactNode } from "react";

interface IProps { 
    color?: string; 
    disabled?: boolean; 
    loading?: boolean;
    onClick?: () => void; 
    children: ReactNode 
}

const LoadingButton = (props: IProps) => {

    const { color, disabled, loading, children, onClick } = props

    if (loading) return (
        <button 
            disabled={true}
            className="my-2 rounded-lg w-full bg-gray-400 disabled:hover:bg-gray-400 disabled:text-gray-200 py-2"> 
            Please Wait...
        </button>
    )

    switch (color) {
        case "red":
            return (
                <button 
                    onClick={onClick}
                    disabled={disabled}
                    className="my-2 rounded-lg w-full bg-red-600 hover:bg-red-700 py-2 text-white disabled:bg-gray-400 disabled:hover:bg-gray-400 disabled:text-gray-200"> 
                    {children}
                </button>
            )
        case "green":
            return (
                <button 
                    onClick={onClick}
                    disabled={disabled}
                    className="my-2 rounded-lg w-full bg-green-600 hover:bg-green-700 py-2 text-white disabled:bg-gray-400 disabled:hover:bg-gray-400 disabled:text-gray-200"> 
                    {children}
                </button>
            )
        case "yellow":
            return (
                <button 
                    onClick={onClick}
                    disabled={disabled}
                    className="my-2 rounded-lg w-full bg-yellow-600 hover:bg-yellow-700 py-2 text-white disabled:bg-gray-400 disabled:hover:bg-gray-400 disabled:text-gray-200"> 
                    {children}
                </button>
            )
        default:
            return (
                <button 
                    onClick={onClick}
                    disabled={disabled}
                    className="my-2 rounded-lg w-full bg-blue-600 hover:bg-blue-700 py-2 text-white disabled:bg-gray-400 disabled:hover:bg-gray-400 disabled:text-gray-200"> 
                    {children}
                </button>
            )
    }

}

export default LoadingButton