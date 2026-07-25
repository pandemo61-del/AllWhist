# Walkthrough: App Upgrade for Google Play 2026

I have upgraded the AllWhist application to meet the latest Google Play requirements for 2026. This includes targeting Android 16 (API 36) and migrating to Expo SDK 57.

## Changes Made

### 1. Dependencies Upgrade
- **Expo SDK**: Upgraded from `~51.0.0` to `~57.0.0`.
- **React Native**: Upgraded to `0.86.0`.
- **React**: Upgraded to `19.2.0`.
- **Core Libraries**: Updated `expo-router`, `react-native-reanimated`, `react-native-screens`, and others to their latest compatible versions.

### 2. Android Native Configuration
- **Target SDK**: Updated `targetSdkVersion` and `compileSdkVersion` to **36**.
- **Min SDK**: Updated `minSdkVersion` to **24** (Android 7.0) to align with modern library requirements.
- **Gradle**: Upgraded to **8.10.2**.
- **New Architecture**: Enabled `newArchEnabled=true` in `gradle.properties` for better performance and future-proofing.
- **Jetifier**: Disabled `android.enableJetifier` as it's no longer needed for modern projects.

### 3. Permissions & Privacy
- **Removed Legacy Storage Permissions**: Deleted `READ_EXTERNAL_STORAGE` and `WRITE_EXTERNAL_STORAGE` from `AndroidManifest.xml` as they are restricted in Android 13+ (API 33+). The app should now use the system photo picker or scoped storage if file access is needed.

### 4. App Configuration (`app.json`)
- Updated `version` to `1.1.0` and `versionCode` to `2`.
- Set `softwareKeyboardLayoutMode` to `adjustResize` for better UI behavior.
- Adjusted status bar visibility to improve the edge-to-edge experience required by Android 15+.

## Next Steps

> [!IMPORTANT]
> Since this is a major upgrade, please perform a full build of the application.
> You may need to run:
> ```bash
> npx expo install --fix
> npx expo prebuild --clean
> ```
> This will ensure all native files are correctly synchronized with the new SDK version.

> [!TIP]
> Test any features that involve file or image picking to ensure they work correctly with the new scoped storage model.
