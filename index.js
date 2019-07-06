function capitalize (s) {
  return s.substr(0, 1).toUpperCase() + s.substr(1)
}

function clean (href) {
  return href.replace(window.location.origin, '')
}

function qs (q) {
  return q.split('&').reduce((_, p) => {
    const [ key, val ] = p.split('=')
    _[key] = decodeURIComponent(val) || true
    return _
  }, {})
}

const { origin, base } = (function getQuery () {
  const s = document.currentScript
  const q = s.src.split('?')[1]
  return q && q.length > 1 ? qs(q) : null
})()

function click (cb) {
  return document.body.addEventListener('click', e => {
    if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey || e.defaultPrevented) return

    let a = e.target

    while (a && !(a.href && a.nodeName === 'A')) {
      a = a.parentNode
    }

    if (!a || a.hash) return

    if (
      window.location.origin !== a.origin // external link
      || a.hasAttribute('download')
      || a.target === '_blank'
      || /^(?:mailto|tel):/.test(a.href)
      || a.classList.contains('no-ajax')
    ) return

    e.preventDefault()

    cb(a)

    return
  })
}

const fetchMarkdown = (function createMarkdownFetcher () {
  const cache = new Map()

  return async function fetchMarkdown (url) {
    if (cache.has(url)) return cache.get(url)

    const markdown = await fetch(
      base ? (
        `${base}${url}`
      ) : (
        `https://raw.githubusercontent.com/${origin}/master/${url}`
      )
    ).then(res => res.text())

    cache.set(url, markdown)

    return markdown
  }
})()

const parseMarkdown = (function createMarkdownParser () {
  const cache = new Map()

  return async function parseMarkdown (url, markdown) {
    if (cache.has(url)) return cache.get(url)

    const html = await (markdown.length < 1900 ? (
      fetch(`https://micro-markdown.now.sh/api?md=${encodeURIComponent(markdown)}`)
    ) : (
      fetch(`https://micro-markdown.now.sh/api`, {
        method: 'POST',
        body: encodeURIComponent(markdown)
      })
    )).then(res => res.json())

    cache.set(url, html)

    return html
  }
})()

// window.picosite = (function createEvents () {
//   const evs = {}

//   return {
//     on (ev, cb) {
//       evs[ev] = (evs[ev] || []).concat(cb)
//     },
//     emit (ev) {
//       (evs[ev] || []).map(e => e && e())
//     }
//   }
// })()

window.addEventListener('DOMContentLoaded', e => {
  console.log('picosite')

  document.body.innerHTML = `
    <div class='outer'>
      <div class='container'>
        <div id='root'>
          loading...
  `

  const root = document.getElementById('root')

  const state = {
    pathname: clean(window.location.href)
  }

  async function go(url, pop) {
    try {
      let path = (!url || url === '/') ? '/index.md' : url
      path = /\.md/.test(path) ? path : path + '.md'
      const markdown = await fetchMarkdown(path)
      const { meta, html } = await parseMarkdown(path, markdown)
      document.title = meta.title
      root.innerHTML = html

      if (!pop) {
        document.title = meta.title
        window.history.pushState({}, '', url)
      }

      state.pathname = url
    } catch (e) {
      console.log(e)
      const markdown = await fetchMarkdown('404.md')
      const { meta, html } = await parseMarkdown('404.md', markdown)
      document.title = meta.title
      root.innerHTML = html
      state.pathname = url
    }

    (window.picositeAfterRender || []).map(fn => fn && fn())
  }

  click(a => a && go(clean(a.pathname)))

  window.addEventListener('popstate', e => {
    if (e.target.location.pathname === state.pathname) return // prevent popstate on hashchange
    go(clean(e.target.location.href), true)
    return false
  })

  go(state.pathname)
})
