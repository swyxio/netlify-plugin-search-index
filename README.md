# Netlify Search Index Plugin

Generate a Search Index you can query via a static JSON blob or a Netlify Function!

You may not need this - There are other ways to add search to your site, like using Algolia or [Vanilla JS with a custom search Index](https://www.hawksworx.com/blog/adding-search-to-a-jamstack-site/).

However, you may wish to have a way to generate this index based ONLY on crawling your generated static site, or you may wish to do **index searches in a serverless function** instead of making your user download the entire index and run clientside.

## Demo

- Demo site: https://netlify-plugin-search-index.netlify.app
- Demo search function: https://netlify-plugin-search-index.netlify.app/.netlify/functions/search?s=web
- Demo JSON blob: https://netlify-plugin-search-index.netlify.app/searchIndex.json

## Usage

To install, add the plugin in your `netlify.toml`. No config is required but we show the default options here.

<details>
<summary><b>Generating both serverless function and clientside JSON</b></summary>

```toml
[build]
  functions = functions # must specify a functions folder for this to work
[[plugins]]
  package = netlify-plugin-search-index
    # all inputs is optional, we just show you the defaults below
    # [plugins.inputs]
      # ignore = ["/ignore-this-file.html"] # don't index this file
      # generatedFunctionName = search # change the name of generated folder in case of conflicts, use `null` to turn off
      # publishDirJSONFileName = searchIndex # also use null to turn off
```

</details>

Without config, this would generate:

- a function at `https://yoursite.netlify.com/.netlify/functions/search` and
- a clientside JSON blob at `https://yoursite.netlify.com/searchIndex.json`

<details>
<summary><b>Generating serverless function only</b></summary>
  
To use this plugin only for the generated serveless function, supply `null` to the `publishDirJSONFileName`:

```toml
[[plugins]]
  package = netlify-plugin-search-index
    [plugins.inputs]
      generatedFunctionName = mySearchFunction
      publishDirJSONFileName = null
```

This would generate a Netlify function at `https://yoursite.netlify.com/.netlify/functions/mySearchFunction` which you can query with `https://yoursite.netlify.com/.netlify/functions/mySearchFunction?search=foo`.

</details>

<details>

<summary><b>Generating clientside JSON only</b></summary>

To use this plugin only for the clientside JSON file, supply `null` to the `generatedFunctionName`:

```yml
[[plugins]]
  package = netlify-plugin-search-index
    [plugins.inputs] = 
      generatedFunctionName = null
      publishDirJSONFileName = mySearchIndex # you can use / to nest in a directory
```

This would generate a clientside JSON at `https://yoursite.netlify.com/mySearchIndex.json`.

</details>

Supplying `null` to both `generatedFunctionName` and `publishDirJSONFileName` would be meaningless (because there would be nothing to generate) and cause an error.

## More options

#### Exclude files

Your project probably contains some content files that you don't want your users to search (e.g. paginated pages such as `/page/1/index.html`). Pass an array of paths (or regex) to the files you don’t want to be indexed to dismiss them:

```yml
[[plugins]]
  package = netlify-plugin-search-index
    [plugins.inputs] = 
      exclude = ['/ignore-this-file.html', '''\/page\/''']
```

#### Search params

At the moment of writing, it is not possible to pass custom options to FuseJS.
If it's something that you would like to see implemented, let us know! ✌️


## What It Does

After your project is built:

- this plugin goes through your HTML files
- extracts their metadata (title, description, keywords) with [`unified`](https://unifiedjs.com/)
- converts them to searchable content, weighted by field type
- stores them as a JSON blob in `/searchIndex/searchIndex.json`
- generates a [Netlify Function](https://docs.netlify.com/functions/overview/?utm_source=twitter&utm_medium=laddersblog-swyx&utm_campaign=devex) that fuzzy searches against a query string with [fuse.js](https://fusejs.io/)

You can use this plugin in two ways:

- **Client-side**: You can simple require the JSON blob in your clientside JavaScript if it isn't too big:
    ```js
    // app.js
    import searchIndex from './searchIndex.json'
    ```
- **Serverless-side**: You can use the generated function that reads the JSON and returns fuzzy search results to be lighter on your frontend. The generated function is available at `.netlify/functions/searchIndex` and you can use it with a search term like `.netlify/functions/searchIndex?s=foo` or `.netlify/functions/searchIndex?search=foo`:
    ```js
    // app.js
    document.getElementById('myForm').addEventListener('submit', async event => {
      event.preventDefault()
      const result = await fetch(`/.netlify/functions/searchIndex?search=${event.target.searchText.value}&limit=25`).then(x => x.json())
      document.getElementById('result').innerText = JSON.stringify(result, null, 2)
    })
    ```

You can use an optional `limit` parameter to limit the length of returned results.

Under the hood, the search function uses [fuse.js](https://fusejs.io/) and in future we may expose more configurations for this. **Fuse.js search is fuzzy**, therefore for short strings you may get a lot of results that don't seem relevant. In future we may make Fuzzy matching opt-in, and just use `String.toLowerCase` and `String.includes` - [please see more details here](https://github.com/sw-yx/netlify-plugin-search-index/issues/19).

## Notes for contributors

We had to use [patch-package](https://github.com/ds300/patch-package) to fix this bug: https://github.com/paulmillr/readdirp/issues/157 - `readdirp` is a dependency of ``copy-template-dir` which we use.

Hopefully it will be resolved or we can just fork `copy-template-dir` entirely locally.

## Future plans

WE ARE SEEKING MAINTAINERS.

Micro Todo:
- expose fuse.js and html parse search options for more configurability
- filtering results
- support non html files?
