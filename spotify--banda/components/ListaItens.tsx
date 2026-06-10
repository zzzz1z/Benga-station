"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { FaPlay } from "react-icons/fa";

interface ListaItensProps {
  image: string;
  name: string;
  href: string;
  fill?: boolean;
  sizes: string;
}

const ListaItens: React.FC<ListaItensProps> = ({
  image,
  name,
  href,
  fill = true,
  sizes,
}) => {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push(href)}
      className="
        relative 
        group 
        flex 
        items-center 
        gap-x-4 
        bg-neutral-100/5 
     
         
        pr-4
        border-l-2
        border-red-600/40
      "
      style={{
        clipPath: "polygon(0 0, 95% 0, 100% 25%, 100% 100%, 5% 100%, 0 75%)"
      }}
    >
      <div className="relative min-h-[64px] min-w-[64px]">
        <Image
          priority
          className="object-cover"
          fill={fill}
          sizes={sizes}
          src={image}
          alt="Image"
        />
        {/* Neon Overlay */}
        <div className="absolute inset-0 bg-red-600/10 opacity-40" />
      </div>

      <p className="font-black uppercase tracking-widest text-[11px] text-white truncate py-5 ml-2">
        {name}
      </p>

      <div
        className="
          absolute 
           
          opacity-0 
          rounded-full 
          flex 
          items-center 
          justify-center 
          bg-red-600 
          p-4 
          drop-shadow-[0_0_10px_#ef4444] 
          right-5 
          
        "
      >
        <FaPlay className="text-black" size={14} />
      </div>
    </button>
  );
};

export default ListaItens;