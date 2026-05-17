import Link from "next/link";
import { IconType } from "react-icons";
import { twMerge } from "tailwind-merge";

interface SideBarItemProps {
  icon: IconType;
  label: string;
  active?: boolean;
  href: string;
}

const SideBarItem: React.FC<SideBarItemProps> = ({ icon: Icon, label, active, href }) => {
  return (
    <Link
      href={href}
      className={twMerge(
        `flex flex-row items-center w-full gap-x-4 font-black uppercase tracking-widest text-xs
         cursor-pointer transition px-3 py-3 relative group`,
        active ? "text-white" : "text-neutral-500 hover:text-white"
      )}
    >
      {/* Active left bar */}
      <span
        className={twMerge(
          "absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 transition-all duration-200",
          active ? "bg-red-500 opacity-100" : "bg-red-500 opacity-0 group-hover:opacity-30"
        )}
      />
      <Icon size={22} className={twMerge("flex-shrink-0 transition-colors", active && "text-red-500")} />
      <p className="truncate">{label}</p>
    </Link>
  );
};

export default SideBarItem;