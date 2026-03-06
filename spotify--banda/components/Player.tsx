'use client'
import useLoadSongUrl from "@/hooks/useLoadSongUrl";
import usePlayer from "@/hooks/usePlayer"
import PlayerContent from "./PlayerContent";

const Player = () => {
    const player = usePlayer();

    // Pull the active song directly from the cache — no async fetch, instant on skip
    const song = player.activeID ? player.songs[player.activeID] : null;
    const songUrl = useLoadSongUrl(song!);

    if (!song || !songUrl || !player.activeID) {
        return null;
    }

    return (
        <div
            className="
             fixed
             bottom-0
             bg-black
             w-full
             py-2
             h-[90px]
             mb-3
             px-4
            "
        >
        <PlayerContent
                song={song}
                songUrl={songUrl}
            />
        </div>
    )
}

export default Player;