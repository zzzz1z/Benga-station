import Header from "@/components/Header"
import AccountContent from "./components/AccountContent"

const Account = () => {
    return (
        <div 
            className="
                bg-neutral-900
                rounded-lg
                h-full
                w-full
                overflow-hidden
                flex
                flex-col
            "
        >
            <Header className="from-bg-neutral-900">
              <></>
            </Header>

            <div className="flex-1 overflow-y-auto">
                <AccountContent />
            </div>
        </div>
    )
}

export default Account;
