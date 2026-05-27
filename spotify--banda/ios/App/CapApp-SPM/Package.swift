// swift-tools-version: 5.9
import PackageDescription

// DO NOT MODIFY THIS FILE - managed by Capacitor CLI commands
let package = Package(
    name: "CapApp-SPM",
    platforms: [.iOS(.v15)],
    products: [
        .library(
            name: "CapApp-SPM",
            targets: ["CapApp-SPM"])
    ],
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", exact: "8.3.1"),
        .package(name: "CapacitorApp", path: "..\..\..\node_modules\@capacitor\app"),
        .package(name: "CapacitorBackgroundRunner", path: "..\..\..\node_modules\@capacitor\background-runner"),
        .package(name: "CapacitorFilesystem", path: "..\..\..\node_modules\@capacitor\filesystem"),
        .package(name: "CapgoCapacitorMediaSession", path: "..\..\..\node_modules\@capgo\capacitor-media-session"),
        .package(name: "CapgoNativeAudio", path: "..\..\..\node_modules\@capgo\native-audio"),
        .package(name: "TransistorsoftCapacitorBackgroundFetch", path: "..\..\..\node_modules\@transistorsoft\capacitor-background-fetch")
    ],
    targets: [
        .target(
            name: "CapApp-SPM",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor-swift-pm"),
                .product(name: "Cordova", package: "capacitor-swift-pm"),
                .product(name: "CapacitorApp", package: "CapacitorApp"),
                .product(name: "CapacitorBackgroundRunner", package: "CapacitorBackgroundRunner"),
                .product(name: "CapacitorFilesystem", package: "CapacitorFilesystem"),
                .product(name: "CapgoCapacitorMediaSession", package: "CapgoCapacitorMediaSession"),
                .product(name: "CapgoNativeAudio", package: "CapgoNativeAudio"),
                .product(name: "TransistorsoftCapacitorBackgroundFetch", package: "TransistorsoftCapacitorBackgroundFetch")
            ]
        )
    ]
)
