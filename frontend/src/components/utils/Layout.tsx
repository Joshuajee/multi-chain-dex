import { ReactNode } from "react"
import Navbar from "./Navbar"


interface IProps {
    children: ReactNode
}

const Layout = (props: IProps) => {

    return (
        <main className={`flex flex-col h-full min-h-screen`}>
            <Navbar />

            <div className='flex-grow bg-slate-50'>{props.children}</div>
        </main>
    )
}

export default Layout