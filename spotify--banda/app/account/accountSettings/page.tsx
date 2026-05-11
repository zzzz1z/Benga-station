import Header from "@/components/Header"
import SettingsContent from "./components/SettingsContent";

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
            <SettingsContent/>
            
        </div>
    )
}

export default Account;