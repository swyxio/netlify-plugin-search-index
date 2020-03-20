// sample function
const Fuse = require('./fuse');
let searchIndex = require('./searchIndex.json'); // eslint-disable-line node/no-missing-require
searchIndex = Object.entries(searchIndex).map(([k, v]) => {
  return {
    path: k,
    ...v
  };
});
var options = {
  shouldSort: true,
  threshold: 0.6,
  location: 0,
  distance: 100,
  maxPatternLength: 32,
  minMatchCharLength: 1,
  // this should be templated at build time
  keys: [
    { name: 'path', weight: 0.9 },
    { name: 'title', weight: 0.8 },
    { name: 'keywords', weight: 0.5 },
    { name: 'description', weight: 0.4 },
    { name: 'headings', weight: 0.3 },
    { name: 'text', weight: 0.1 },
  ]
};

var fuse = new Fuse(searchIndex, options);

exports.handler = async (event) => {
  const searchTerm =
    event.queryStringParameters.search || event.queryStringParameters.s;
  if (typeof searchTerm === 'undefined') {
    return {
      statusCode: 400,
      body:
        'no search term specified, query this function with /?search=searchTerm or /?s=searchTerm'
    };
  }
  var result = fuse.search(searchTerm);
  return {
    statusCode: 200,
    body: JSON.stringify(result)
  };
};
