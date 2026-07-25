# Upgrade App to Google Play Requirements (2026)

This plan upgrades the AllWhist app to target Android 16 (API 36) and Expo SDK 57, ensuring compliance with Google Play's 2026 requirements.

## User Review Required

> [!IMPORTANT]
> This upgrade involves a major jump from Expo SDK 51 to SDK 57. This may introduce breaking changes in the JavaScript/TypeScript code. I will attempt to fix common ones, but some manual testing and adjustment might be needed.

> [!WARNING]
> The `READ_EXTERNAL_STORAGE` and `WRITE_EXTERNAL_STORAGE` permissions will be removed as they are deprecated and restricted in Android 13+. If your app requires picking files or photos, I will ensure it uses modern APIs (like `expo-image-picker` or the system photo picker).

## Open Questions

- Are there any specific native modules or features (e.g., background tasks, Bluetooth, or custom native code) that you are concerned about during this upgrade?
- Does the app use any features that require the `READ_EXTERNAL_STORAGE` or `WRITE_EXTERNAL_STORAGE` permissions specifically (e.g., custom file management outside of app-specific directories)?

## Proposed Changes

### Configuration & Dependencies

#### [MODIFY] [package.json](file:///C:/Projects/allwhist/package.json)
- Upgrade `expo` to `~57.0.0`.
- Upgrade `react-native` to `0.86.0`.
- Upgrade all other Expo-related dependencies to their compatible versions (using `npx expo install --fix`).

#### [MODIFY] [app.json](file:///C:/Projects/allwhist/app.json)
- Increment `versionCode` and update `version`.
- Add `android.softwareKeyboardLayoutMode: "adjustResize"` if not already present (best practice).
- Ensure `userInterfaceStyle` and splash screen configurations are modern.

### Android Native Configuration

#### [MODIFY] [android/build.gradle](file:///C:/Projects/allwhist/android/build.gradle)
- Update `compileSdkVersion` to `36`.
- Update `targetSdkVersion` to `36`.
- Update `buildToolsVersion` to `36.0.0`.
- Update `kotlinVersion` to a version compatible with Expo 57 (likely `1.9.24` or higher).

#### [MODIFY] [android/app/build.gradle](file:///C:/Projects/allwhist/android/app/build.gradle)
- Ensure it picks up the latest versions from the root `build.gradle`.

#### [MODIFY] [android/app/src/main/AndroidManifest.xml](file:///C:/Projects/allwhist/android/app/src/main/AndroidManifest.xml)
- Remove `READ_EXTERNAL_STORAGE` and `WRITE_EXTERNAL_STORAGE`.
- Ensure `android:exported="true"` is correctly set on activities with intent filters (already done, but double-check).

## Verification Plan

### Automated Tests
- Run `npx expo prebuild` to ensure the native project can be generated without errors.
- Run `gradlew lint` (if available) to check for SDK-related issues.

### Manual Verification
- Build the Android app locally (if possible) or verify that the `build.gradle` files are correctly updated.
- Check the UI for edge-to-edge issues (status bar/navigation bar overlapping).
