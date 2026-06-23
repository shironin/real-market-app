const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

// Makes Android splash screen fill the entire screen.
// Uses a withDangerousMod for BOTH file copies AND the styles patch so this
// always runs AFTER expo-splash-screen's withAndroidStyles and wins.
function withAndroidFullscreenSplash(config) {
  // First dangerous mod: copy image assets + write fullscreen bitmap drawable
  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const drawablePath = path.join(
        config.modRequest.projectRoot,
        'android/app/src/main/res/drawable'
      );
      await fs.promises.mkdir(drawablePath, { recursive: true });

      await fs.promises.copyFile(
        path.join(config.modRequest.projectRoot, 'assets', 'splash.jpg'),
        path.join(drawablePath, 'splash_fullscreen.jpg')
      );

      const bitmapXml = `<?xml version="1.0" encoding="utf-8"?>
<bitmap xmlns:android="http://schemas.android.com/apk/res/android"
    android:src="@drawable/splash_fullscreen"
    android:gravity="fill"
    android:tileMode="disabled" />
`;
      await fs.promises.writeFile(
        path.join(drawablePath, 'splash_bg_fullscreen.xml'),
        bitmapXml
      );
      return config;
    },
  ]);

  // Second dangerous mod: patch styles.xml to use the fullscreen drawable as
  // windowSplashScreenBackground. Dangerous mods run after withAndroidStyles,
  // so this always wins over expo-splash-screen's style generation.
  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const stylesPath = path.join(
        config.modRequest.projectRoot,
        'android/app/src/main/res/values/styles.xml'
      );

      let xml = await fs.promises.readFile(stylesPath, 'utf8');

      // Replace windowSplashScreenBackground with our fullscreen drawable
      xml = xml.replace(
        /<item name="windowSplashScreenBackground">.*?<\/item>/,
        '<item name="windowSplashScreenBackground">@drawable/splash_bg_fullscreen</item>'
      );

      // Remove the animated icon so only the background image is shown
      xml = xml.replace(
        /\s*<item name="windowSplashScreenAnimatedIcon">.*?<\/item>/,
        ''
      );

      await fs.promises.writeFile(stylesPath, xml, 'utf8');
      return config;
    },
  ]);

  return config;
}

module.exports = withAndroidFullscreenSplash;
