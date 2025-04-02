import Header from "@/components/Header"
import  AccountContent from "./components/AccountContent"

const Account = () => {
    return (
        <div 
         className="
         bg-neutral-900
         rounded-lg
         h-full
         w-full
         overflow-hidden
         overflow-y-auto
         "
        >
            <Header className="from-bg-neutral-900">
               <></>
            </Header>
            <AccountContent/>
        </div>
    )
}

export default Account;