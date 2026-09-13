const { withAppBuildGradle } = require('expo/config-plugins');

// Adds a `release` signingConfig driven by the MYAPP_RELEASE_* environment
// variables used by .github/workflows/android-publish.yml. When they are not
// set (local dev builds) the release build type keeps the debug keystore.
const SIGNING_CONFIG = `
        release {
            if (System.getenv("MYAPP_RELEASE_STORE_FILE")) {
                storeFile file(System.getenv("MYAPP_RELEASE_STORE_FILE"))
                storePassword System.getenv("MYAPP_RELEASE_STORE_PASSWORD")
                keyAlias System.getenv("MYAPP_RELEASE_KEY_ALIAS")
                keyPassword System.getenv("MYAPP_RELEASE_KEY_PASSWORD")
            }
        }`;

function applyReleaseSigning(contents) {
  if (contents.includes('MYAPP_RELEASE_STORE_FILE')) {
    return contents;
  }

  let result = contents.replace(
    /signingConfigs\s*\{\s*debug\s*\{[\s\S]*?\n\s*\}\n/,
    (match) => `${match}${SIGNING_CONFIG}\n`,
  );

  result = result.replace(
    /(release\s*\{[^{}]*?)signingConfig signingConfigs\.debug/,
    '$1signingConfig System.getenv("MYAPP_RELEASE_STORE_FILE") ? signingConfigs.release : signingConfigs.debug',
  );

  return result;
}

module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, (mod) => {
    mod.modResults.contents = applyReleaseSigning(mod.modResults.contents);
    return mod;
  });
};
