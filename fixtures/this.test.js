/**
 * @jest-environment node
 */

const { indexKeys: expectedKeys } = require('../parser')

let index
const netlifyPlugin = require('../index.js');
test('plugin fixture works', () => {
  const initPlugin = netlifyPlugin();
  console.log(`running ${initPlugin.name}`);
  return initPlugin
    .onPostBuild({
      // from netlify.yml
      pluginConfig: {
        debugMode: false,
        exclude: ['/search.html', /^\/devnull\/.*/],
        generatedFunctionName: 'mySearchFunction',
        publishDirJSONFileName: 'mySearchIndex'
      },
      constants: {
        BUILD_DIR: 'fixtures/publishDir',
        FUNCTIONS_SRC: 'fixtures/functions',
        FUNCTIONS_DIST: 'fixtures/functions-dist'
      },
      utils: { build: { failBuild() {} } },
    })
    .then(() => {
      index = require('./publishDir/mySearchIndex.json')
      expect(Object.keys(index)).not.toBe(0)
    });
});

test('files in ignored list are not searchable', () => {
  expect(Object.keys(index).find(e => e === '/search.html')).toBe(undefined)
  expect(Object.keys(index).find(e => e.indexOf('/devnull/') === 0)).toBe(undefined)
})

test('search items have expected keys', () => {
  expectedKeys.forEach((expectedKey) => {
    expect(Object.entries(index).find(([_, e]) => !e[expectedKey])).toBe(undefined)
  })
});
