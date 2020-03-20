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
        ignore: ['/search.html', /^\/devnull\/.*/],
        generatedFunctionName: 'mySearchFunction',
        publishDirJSONFileName: 'mySearchIndex'
      },
      constants: {
        BUILD_DIR: 'fixtures/publishDir',
        FUNCTIONS_SRC: 'fixtures/functions',
        FUNCTIONS_DIST: 'fixtures/functions-dist'
      }
    })
    .then(() => {
      index = require('./publishDir/mySearchIndex.json')
      expect(true).toBe(true)
    });
});

test('files in ignored list are not searchable', () => {
  expect(Object.keys(index).find(e => e === '/search.html')).toBe(undefined)
  expect(Object.keys(index).find(e => e.indexOf('/devnull/') === 0)).toBe(undefined)
})

test('search items have expected keys', () => {
  Object.entries(index).forEach(([_, item]) => {
    expect(Object.keys(item).filter(e => expectedKeys.indexOf(e) !== -1).length)
      .toBe(expectedKeys.length)
  })
});
