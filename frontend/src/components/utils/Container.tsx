import React, { ReactNode } from "react"

interface IProps {
    children: ReactNode,
    full: boolean,
    id: string
}

const Container = (props: IProps) => {
 
    return (
        <section role="section" id={props.id} className={`w-full flex py-12 justify-center`}>
            <div aria-label="container" className={`h-full ${props.full ? 'min-h-screen' : ''} w-full flex flex-wrap py-2 lg:py-3 px-2 lg:px-40 2xl:container`}>
                {props.children}
            </div>
        </section>
    )
}

export default Container