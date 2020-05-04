const is = require('hast-util-is-element');
const visit = require('unist-util-visit');
const remove = require('unist-util-remove');

const headings = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];

function childContent(node) {
  let value
  visit(node, 'text', (textNode) => {
    value = textNode.value.trim()
  })
  return (value && value.length) ? value : null
}

function meta() {
  return (tree, file) => {
    file.data.headings = []
    visit(tree, 'element', (node) => {
      if (is(node, headings)) {
        const c = childContent(node)
        if (c && file.data.headings.indexOf(c) === -1) {
          file.data.headings.push(c)
        }
      }
      if (is(node, 'head')) {
        visit(node, (child) => {
          if (is(child, 'meta')) {
            const { name, property, content = '' } = child.properties
            if (name === 'description') {
              file.data.description = content
            } else if (name === 'keywords') {
              const keywords = content.split(',').map(e => e.trim())
              file.data.keywords = keywords
            } else if (property === 'og:image') {
              file.data.image = content
            }
          }
          if (is(child, 'title')) {
            file.data.title = childContent(child)
          }
        })
      }
    })
    return remove(
      tree,
      node => is(node, headings) || is(node, 'head')
    );
  }
}

module.exports = meta