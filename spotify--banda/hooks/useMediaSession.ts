// useMediaSession.ts
// Lock screen controls are now fully handled by NativeAudio's notificationMetadata.
// This hook is intentionally a no-op — kept so existing call sites don't break.
// Player.tsx passes metadata directly in preload(), so nothing else is needed here.

const useMediaSession = (..._args: any[]) => {
  // intentionally empty
};

export default useMediaSession;