const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

// React Native Firebase with New Architecture requires static frameworks so that
// Firebase Swift pods generate their Swift headers at framework paths
// (e.g. <FirebaseAuth/FirebaseAuth-Swift.h>).
const withFirebaseModularHeaders = (config) => {
  return withDangerousMod(config, [
    'ios',
    (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      let podfile = fs.readFileSync(podfilePath, 'utf8');

      if (!podfile.includes('# [firebase] static frameworks')) {
        podfile = podfile.replace(
          'prepare_react_native_project!',
          // Expo's precompiled RNCore artifacts don't always keep up with new
          // ReactCommon headers added between RN patch versions (e.g. RN 0.86 added
          // RCTTurboModuleWithJSIBindings.h), which breaks the archive with a
          // "file not found" error under `use_frameworks!`. Force a source build so
          // the Pods are compiled from the exact node_modules/react-native checked
          // out here instead of a possibly-stale prebuilt binary.
          "ENV['RCT_USE_PREBUILT_RNCORE'] = '0'\n" +
            "ENV['RCT_USE_RN_DEP'] = '0'\n" +
            "ENV['EXPO_USE_PRECOMPILED_MODULES'] = '0'\n\n" +
            'prepare_react_native_project!\n\n' +
            '# [firebase] static frameworks\nuse_frameworks! :linkage => :static'
        );
        fs.writeFileSync(podfilePath, podfile);
      }

      return config;
    },
  ]);
};

module.exports = withFirebaseModularHeaders;
