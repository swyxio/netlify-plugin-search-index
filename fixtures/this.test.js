/**
 * @jest-environment node
 */

let index
let searchHandler
let referenceLen = 0
const netlifyPlugin = require('../index.js');
test('plugin fixture works', () => {
  const initPlugin = netlifyPlugin;
  console.log(`running build plugin`);
  return initPlugin
    .onPostBuild({
      // from netlify.yml
      inputs: {
        debugMode: false,
        exclude: ['/search.html', /^\/devnull\/.*/],
        generatedFunctionName: 'search',
        publishDirJSONFileName: 'searchIndex'
      },
      constants: {
        PUBLISH_DIR: 'fixtures/publishDir',
        FUNCTIONS_SRC: 'fixtures/functions',
        FUNCTIONS_DIST: 'fixtures/functions-dist'
      },
      utils: { build: { failBuild() {} } },
    })
    .then(() => {
      index = require('./publishDir/searchIndex.json')
      expect(Object.keys(index)).not.toBe(0)
    });
});

test('files in ignored list are not searchable', () => {
  expect(Object.keys(index).find(e => e === '/search.html')).toBe(undefined)
  expect(Object.keys(index).find(e => e.indexOf('/devnull/') === 0)).toBe(undefined)
})

test('empty search index returns 400', async () => {
  searchHandler = require('./functions/search/search').handler
  const { statusCode } = await searchHandler({ queryStringParameters: { search: '' }  })
  expect(statusCode).toBe(400)
});

test('non-empty search index returns results', async () => {
  const { statusCode, body } = await searchHandler({ queryStringParameters: { search: 'developers' }  })
  expect(statusCode).toBe(200)
  const results = JSON.parse(body)
  expect(results.length).toBeGreaterThanOrEqual(1)
  referenceLen = results.length 
});

test('limit qury param should limit results len', async () => {
  const { statusCode, body } = await searchHandler({ queryStringParameters: { search: 'developers', limit: '2' }  })
  expect(statusCode).toBe(200)
  const results = JSON.parse(body)
  expect(results.length).toBe(2)
});

test('NaN should not break search', async () => {
  const { statusCode, body } = await searchHandler({ queryStringParameters: { search: 'developers', limit: 'nan' }  })
  expect(statusCode).toBe(200)
  const results = JSON.parse(body)
  expect(results.length).toBeGreaterThanOrEqual(referenceLen)
});
