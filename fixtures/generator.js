/**
 * Feches articles and generates
 * HTML files to populate ./publishDir/articles
 */

const fs = require("fs");
const path = require("path");
const slugify = require('slugify');
const NewsAPI = require('newsapi');

const newsapi = new NewsAPI(process.env.NEWS_API_KEY);

const vfile = require('vfile')
const unified = require('unified')
const meta = require('rehype-meta')
const doc = require('rehype-document')
const parse = require('rehype-parse')
const stringify = require('rehype-stringify')

function createFragment({
  title,
  author,
  description,
  content
}) {
  return `
  <div>
    <h1>${title}</h1>
    <h2>by ${author}</h2>
    <div class="content">
      <p>${description}</p>
      <p>${content}</p>
    </div>
  </div>
  `;
}

async function createVFile(article) {
  const {
    source: { name },
    author,
    title,
    description,
    urlToImage: image,
    publishedAt: published,
    content,
    url,
  } = article;


  const subPath = name.split('.')[0].toLowerCase()
  const slug = slugify(url.split('/').filter(e => e).pop())
  const fileName = `${subPath}/${slug}`

  const processor = unified()
    .use(parse, { fragment: true })
    .use(doc)
    .use(meta)
    .use(stringify)


  const file = await processor.process(
    vfile({
      data: {
        meta: {
          twitter: true,
          og: true,
          title,
          image,
          author,
          published,
          pathname: `/${fileName}.html`,
          description,
        },
      },
      contents: createFragment({ title, author, description, content }),
    })
  );

  return {
    file,
    fileName,
  };
}

async function fetchContent(res = [], max = 5, page = 1) {
  if (page > max) {
    return res
  }
  const { status, articles } = await newsapi.v2.topHeadlines({
    category: "technology",
    language: "en",
    country: "us",
    page
  })
  if (status !== 'ok') {
    throw new Error('Could not fetch NewsApi')
  }
  return fetchContent([...res, ...articles], max, page + 1)
}

function netlifyPluginGenerateArticles() {
  return {
    name: 'netlify-plugin-generate-article',
    async onPostBuild(opts) {
      const {
        pluginConfig: {
          folder = 'articles'
        },
        constants: { BUILD_DIR }
      } = opts;
      
      try {
        const articles = await fetchContent()
        articles.forEach(async (article) => {
          const { file, fileName } = await createVFile(article);
          writeFileSyncRecursive(
            path.join(BUILD_DIR, folder, `${fileName}.html`),
            file.contents
          );
        })
      } catch(e) {
        console.error(e)
      }
    }
  }
}

module.exports = netlifyPluginGenerateArticles;

/** Pasted from https://gist.github.com/drodsou/de2ba6291aea67ffc5bc4b52d8c32abd */
function writeFileSyncRecursive(filename, content, charset) {
  // -- normalize path separator to '/' instead of path.sep, 
  // -- as / works in node for Windows as well, and mixed \\ and / can appear in the path
  let filepath = filename.replace(/\\/g, '/');

  // -- preparation to allow absolute paths as well
  let root = '';
  if (filepath[0] === '/') {
    root = '/';
    filepath = filepath.slice(1);
  } else if (filepath[1] === ':') {
    root = filepath.slice(0, 3); // c:\
    filepath = filepath.slice(3);
  }

  // -- create folders all the way down
  const folders = filepath.split('/').slice(0, -1); // remove last item, file
  folders.reduce(
    (acc, folder) => {
      const folderPath = acc + folder + '/';
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath);
      }
      return folderPath
    },
    root // first 'acc', important
  );

  // -- write file
  fs.writeFileSync(root + filepath, content, charset);
}