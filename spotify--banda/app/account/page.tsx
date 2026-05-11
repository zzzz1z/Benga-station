import Header from "@/components/Header";
import SettingsContent from "./components/SettingsContent";
import getLikedSongs from "@/actions/getLikedSongs";
import getPlaylists from "@/actions/getPlaylists";

const Account = async () => {
    const [likedSongs, playlists] = await Promise.all([
        getLikedSongs(),
        getPlaylists(),
    ]);

    return (
        <div className="bg-neutral-900 rounded-lg h-full w-full overflow-hidden pt-[60px] overflow-y-auto">
            <Header className="from-bg-neutral-900">
               <></>
            </Header>
            <SettingsContent likedSongs={likedSongs} playlists={playlists} />
        </div>
    )
}

export default Account;