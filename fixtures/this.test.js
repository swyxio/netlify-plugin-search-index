/**
 * @jest-environment node
 */

const fs = require('fs');
const path = require('path');

// actual test
const netlifyPlugin = require('../index.js');
test('plugin fixture works', () => {
  const initPlugin = netlifyPlugin();
  console.log(`running ${initPlugin.name}`);
  return initPlugin
    .onPostBuild({
      // from netlify.yml
      pluginConfig: {
        debugMode: false,
        generatedFunctionName: 'mySearchFunction',
        publishDirJSONFileName: 'mySearchIndex'
      },
      constants: {
        BUILD_DIR: 'fixtures/publishDir',
        FUNCTIONS_SRC: 'fixtures/functions',
        FUNCTIONS_DIST: 'fixtures/functions-dist'
      }
    })
    .then(() => expect(true).toBe(true));
});
