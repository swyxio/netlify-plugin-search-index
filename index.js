const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const chalk = require('chalk');
const makeDir = require('make-dir');
const pathExists = require('path-exists');
const readdirp = require('readdirp');
const cpy = require('copy-template-dir');
const copy = promisify(cpy);
const { zipFunctions } = require('@netlify/zip-it-and-ship-it'); // eslint-disable-line
const htmlToText = require('html-to-text');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

function netlifyPluginSearchIndex(conf) {
  return {
    name: 'netlify-plugin-search-index',
    async onPostBuild(opts) {
      const {
        pluginConfig: {
          generatedFunctionName = 'search',
          publishDirJSONFileName = 'searchIndex',
          ...htmlToTextOptions // https://www.npmjs.com/package/html-to-text#user-content-options
        },
        constants: { BUILD_DIR, FUNCTIONS_SRC, FUNCTIONS_DIST }
      } = opts;

      if (generatedFunctionName === null && publishDirJSONFileName === null) {
        throw new Error(
          'generatedFunctionName and publishDirJSONFileName cannot both be null, this plugin wouldnt be generating anything!'
        );
      }

      let newManifest = [];
      newManifest = await readdirp
        .promise(BUILD_DIR, { directoryFilter: ['node_modules'] })
        .then((x) => x.map((y) => y.fullPath));
      newManifest = newManifest.filter((x) => x.endsWith('.html'));
      let searchIndex = {};
      // https://www.npmjs.com/package/html-to-text#user-content-options
      await Promise.all(
        newManifest.map(async (htmlFilePath) => {
          const indexPath = path.relative(BUILD_DIR, htmlFilePath);
          const htmlFileContent = await readFile(htmlFilePath, 'utf8');
          const text = htmlToText.fromString(
            htmlFileContent,
            htmlToTextOptions
          );
          searchIndex[`/${indexPath}`] = text;
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
            `searchIndex detected at ${searchIndexPath}, will overwrite for this build but this may indicate an accidental conflict`
          );
        }
        makeDir(`${searchIndexPath}/..`); // make a dir out of the parent
        await writeFile(searchIndexPath, stringifiedIndex);
        console.log(
          `Search Index JSON generated at ${chalk.blue(
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
          `Netlify Function generated at ${chalk.blue(
            `/.netlify/functions/${generatedFunctionName}`
          )}!`
        );
        // done with generating functions
      }
    }
  };
}
module.exports = netlifyPluginSearchIndex;
