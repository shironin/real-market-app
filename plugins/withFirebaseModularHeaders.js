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
          'prepare_react_native_project!\n\n# [firebase] static frameworks\nuse_frameworks! :linkage => :static'
        );
        fs.writeFileSync(podfilePath, podfile);
      }

      return config;
    },
  ]);
};

module.exports = withFirebaseModularHeaders;
