const { withEntitlementsPlist, withAndroidManifest, createRunOncePlugin } = require('@expo/config-plugins');
const pkg = require('../package.json');

const withAutofill = (config) => {
  // iOS Autofill skipped as per user request


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
