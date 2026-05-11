import Header from "@/components/Header"
import PrivacyView from "./components/PrivacyView";

const AccountPrivacy = () => {
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
            <PrivacyView/>
            
        </div>
    )
}

export default AccountPrivacy;