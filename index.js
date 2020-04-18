const path = require('path');
const fs = require('fs');
const globby = require('globby');
const { promisify } = require('util');
const chalk = require('chalk');
const makeDir = require('make-dir');
const pathExists = require('path-exists');

const cpy = require('copy-template-dir');
const copy = promisify(cpy);
const { zipFunctions } = require('@netlify/zip-it-and-ship-it'); // eslint-disable-line
const { parse } = require('./parser')

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

function netlifyPluginSearchIndex(_) {
  return {
    name: 'netlify-plugin-search-index',
    async onPostBuild(opts) {
      const {
        pluginConfig: {
          exclude = [],
          generatedFunctionName = 'search',
          publishDirJSONFileName = 'searchIndex',
          debugMode,
        },
        constants: { BUILD_DIR, FUNCTIONS_SRC, FUNCTIONS_DIST }
      } = opts;

      if (generatedFunctionName === null && publishDirJSONFileName === null) {
        throw new Error(
          'generatedFunctionName and publishDirJSONFileName cannot both be null, this plugin wouldnt be generating anything!'
        );
      }
      if (debugMode) {
        console.warn('debugMode is not implemented yet for this plugin');
      }

      let searchIndex = {}
      const newManifest = await walk(BUILD_DIR, exclude)
      console.log({ newManifest })

      // https://www.npmjs.com/package/html-to-text#user-content-options
      await Promise.all(
        newManifest.map(async (htmlFilePath) => {
          const indexPath = path.relative(BUILD_DIR, htmlFilePath);
          const htmlFileContent = await readFile(htmlFilePath, 'utf8');
          searchIndex[`/${indexPath}`] = await parse(htmlFileContent, htmlFilePath, { BUILD_DIR })
        })
      );

      let stringifiedIndex = JSON.stringify(searchIndex);

      /**
       *
       * clientside JSON
       *
       */
      if (publishDirJSONFileName) {
        let searchIndexPath = path.join(
          BUILD_DIR,
          publishDirJSONFileName + '.json'
        );
        if (await pathExists(searchIndexPath)) {
          console.warn(
            `Existing file at ${searchIndexPath}, plugin will overwrite it but this may indicate an accidental conflict. Delete this file from your repo to avoid confusion - the plugin should be the sole manager of your search index`
          );
          // to do: let people turn off this warning?
        }
        await makeDir(`${searchIndexPath}/..`); // make a dir out of the parent
        await writeFile(searchIndexPath, stringifiedIndex);
        console.log(
          `Search Index JSON generated at ${chalk.cyan(
            `/${publishDirJSONFileName}.json`
          )}!`
        );
      }
      /**
       *
       * serverless function + json
       *
       */
      if (generatedFunctionName) {
        if (typeof FUNCTIONS_SRC === 'undefined') {
          throw new Error('FUNCTIONS_SRC is undefined - did you forget to declare a functions folder in netlify.toml? https://github.com/sw-yx/netlify-plugin-search-index#usage')
        }
        const searchIndexFunctionPath = path.join(
          FUNCTIONS_SRC,
          generatedFunctionName
        );
        const vars = {
          searchIndex: generatedFunctionName
        };
        await copy(
          __dirname + '/functionTemplate',
          searchIndexFunctionPath,
          vars
        );
        // now we have copied it out to intermediate dir
        // we may want to do some processing/templating
        await writeFile(
          path.join(searchIndexFunctionPath, 'searchIndex.json'),
          stringifiedIndex
        );
        // and then..
        // we still need to zip this to dist because netlify build doesnt recognize generated functions
        await zipFunctions(FUNCTIONS_SRC, FUNCTIONS_DIST);
        console.log(
          `Netlify Function generated at ${chalk.cyan(
            `/.netlify/functions/${generatedFunctionName}`
          )}!`
        );
        // done with generating functions
      }
    }
  };
}
module.exports = netlifyPluginSearchIndex;

async function walk(dir, exclude = []) {
  return (await globby(path.join(dir, '**/*.html')))
    .filter(p =>
      exclude
      .find(r => p.replace(dir, '').match(r)) === undefined
    )
}
