const fs = require('fs');
const path = require('path');
const { withEntitlementsPlist, withAndroidManifest, withDangerousMod, createRunOncePlugin } = require('@expo/config-plugins');
const pkg = require('../package.json');

const withAutofill = (config) => {
  // iOS Autofill skipped as per user request

  // 1. Android: Copy the MyAutofillService Kotlin source into the generated project
  config = withDangerousMod(config, [
    'android',
    (config) => {
      const packageName = config.android?.package;
      if (!packageName) return config;
      const dir = path.join(
        config.modRequest.platformProjectRoot,
        'app', 'src', 'main', 'java',
        ...packageName.split('.')
      );
      fs.mkdirSync(dir, { recursive: true });
      const src = fs.readFileSync(path.join(__dirname, 'MyAutofillService.kt'), 'utf8');
      const withPackage = src.replace(/^package .+$/m, `package ${packageName}`);
      fs.writeFileSync(path.join(dir, 'MyAutofillService.kt'), withPackage);
      return config;
    },
  ]);

  // 2. Android: Register the Autofill Service in AndroidManifest
  config = withAndroidManifest(config, (config) => {
    const mainApplication = config.modResults.manifest.application[0];
    
    if (!mainApplication.service) {
      mainApplication.service = [];
    }

    mainApplication.service.push({
      $: {
        'android:name': '.MyAutofillService',
        'android:label': 'Expense Manager Autofill',
        'android:permission': 'android.permission.BIND_AUTOFILL_SERVICE',
        'android:exported': 'true',
      },
      'intent-filter': [
        {
          action: [
            { $: { 'android:name': 'android.service.autofill.AutofillService' } }
          ]
        }
      ]
    });
    
    return config;
  });

  return config;
};

module.exports = createRunOncePlugin(withAutofill, pkg.name, pkg.version);
