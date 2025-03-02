'use client';

import useLoadImage from "@/hooks/useLoadImage";
import { Song } from "@/types";
import Image from "next/image";
import { CgPlayButton } from "react-icons/cg";
import PlayButton from "./PlayButton";

interface SongItemProps {
    data: Song;
    onClick: (id: string) => void;
};

const SongItem: React.FC<SongItemProps> = ({ data, onClick }) => {
    const imagePath = useLoadImage(data);

    return (
        <div
            onClick={() => onClick(data.id)}
            className="
                relative
                group
                flex
                flex-col
                items-center
                justify-center
                rounded-md
                overflow-hidden
                gap-x-4
                bg-neutral-400/10
                cursor-pointer
                hover:bg-neutral-400/20
                transition
                p-3
            "
         
        >
            {/* Image Container */}
            <div
                className="
                    relative
                    aspect-square
                    w-full
                    h-full
                    rounded-md
                    overflow-hidden
                "
            >
            <Image
                priority
                    className="object-cover"
                    src={imagePath ?? '/images/likedit.png'}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    alt={data.title ?? 'Song cover image'} // Descriptive alt text
                />
            </div>

            {/* Song Info */}
            <div className="flex flex-col items-start w-full p-4 gap-y-1">
                <p className="font-semibold truncate w-full">
                    {data.title}
                </p>
                <p
                    className="text-neutral-400 text-sm pb-4 w-full truncate"
                >
                    {data.author}
                </p>
            </div>

            {/* Play Button */}
            <div
                className="
                    absolute
                    bottom-4
                    right-5
                    group-hover:opacity-100
                    opacity-0
                    transition-opacity
                "
                role="presentation"
            >
                <PlayButton />
            </div>
        </div>
    );
};

export default SongItem;
