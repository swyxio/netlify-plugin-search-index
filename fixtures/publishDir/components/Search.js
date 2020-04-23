import { html, render } from 'https://unpkg.com/uhtml?module';

import {
  define,
  useState,
} from 'https://unpkg.com/hooked-elements?module';

function renderResult(result) {
  return html`
    <div class="article">
      <h1 class="title">${result.title}</h1>
      <p class="p">${result.description}</p>
      <p class="p serif"><em>> published in ${result.from.pop()}</em></p>
    </div>
    <style>
      .article {
        border-bottom: 1px solid #111;
        padding: 0 8px;
      }
      .title {
        font-size: 24px;
        border-left: 6px solid #111;
        padding-left: 12px;
        margin-bottom: 0;
      }
      .p {
        margin: 8px;
      }
      .serif {
        font-family: serif;
      }

    </style>
  `
}

define('div.search', element => {
  const [searchState, setSearchState] = useState({ loading: false, error: null, results: [] });

  const onSubmit = async (ev) => {
    ev.preventDefault()
    const { target: { searchText: { value } }} = ev

    try {
      setSearchState({
        ...searchState,
        loading: true
      })
      const results = await fetch(`/.netlify/functions/search?search=${value}`)
        .then(x => x.json())
      setSearchState({
        loading: false,
        results,
        error: null
      })
    } catch(e) {
      console.error({ e })
      setSearchState({
        loading: false,
        results: [],
        error: e
      })
    }
  }
  render(element, html `
    <div class="splash">
      <div class="container">
        <a target="_blank" href="https://github.com/sw-yx/netlify-plugin-search-index">Github code here</a>
        <h1 class="main-title">Netlify search plugin demo</h1>
        <p>
          This search bar does not rely on any external service. It queries a JSON search index
          generated at build time, from a Netlify function. Also it's lightweight, it automatically parses your content and implements <a href="https://fusejs.io/" target="_blank">FuseJS</a> weighted search 👏
        </p>
        <form onsubmit=${onSubmit}>
          <div class="search-wrap">
            <input
              class="search-input"
              name="searchText"
              placeholder="Search for tech articles (eg. Animal crossing)"
            />
          </div>
          <div><button class="button">submit</button></div>
        </form>
      </div>
    </div>
    <div class="grid results">
      ${ searchState.results.length ? html`<p style="margin-bottom: 24px">${searchState.results.length} articles found</p>` : ''}
      ${ searchState.results.map(renderResult) }
    </div>
    <style>
      .main-title {
        margin-top: 0;
      }
      .search-wrap {
        margin-bottom: 30px;
      }
      .search-input {
        height: 44px;
        width: 80%;
        line-height: 44px;
        border: none;
        border-radius: 2px;
        box-shadow: 0 2px 2px 0 rgba(0,0,0,0.16), 0 0 0 1px rgba(0,0,0,0.08);
        font: 16px arial,sans-serif;
        padding-left: 16px;
        background: #FFF;
      }

      .button {
        padding: 12px;
        background: #FFF;
        font-size: 16px;
        border: 1px solid hsl(10, 20%, 20%);
      }

      .grid {
        display: grid;
        grid-gap: 3;
        margin: auto;
        padding: 4%;
        max-width: calc(256px * 4 + 44px);
        grid-template-columns: repeat(auto-fit, minmax(256px, 1fr));
      }

      .results {
        padding-top: 4.375rem;
        margin-top: 1em;
      }
    </style>
  `);
})
