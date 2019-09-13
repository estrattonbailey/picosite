window.picosite = {
  base: undefined,
  pathname: clean(window.location.href)
}

async function loadScript (src) {
  return new Promise(r => {
    const s = document.createElement('script')
    s.onload = r
    s.src = src
    document.body.prepend(s)
  })
}

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

const {
  origin,
  theme = 'default'
} = (function getQuery () {
  const s = document.currentScript
  const q = s.src.split('?')[1]
  console.log({ q })
  return q && q.length > 1 ? qs(q) : {}
})()

if (!origin) {
  throw new Error('picosite origin was undefined')
}

const fetchMarkdown = (function createMarkdownFetcher () {
  const cache = new Map()

  return async function fetchMarkdown (url) {
    url = (!url || url === '/') ? '/index.md' : url
    url = /\.md/.test(url) ? url : url + '.md'

    if (cache.has(url)) return cache.get(url)

    const markdown = await fetch(
      window.picosite.base ? (
        `${window.picosite.base}${url}`
      ) : (
        `https://raw.githubusercontent.com/${origin}/master/${url}`
      )
    ).then(res => res.text())

    cache.set(url, markdown)

    return markdown
  }
})()

const evs = {}
window.picosite.on = function on (ev, cb) {
  evs[ev] = (evs[ev] || []).concat(cb)
}
window.picosite.emit = function emit (ev, ...args) {
  return Promise.all((evs[ev] || []).map(e => e && e(...args)))
}
window.picosite.prefetch = fetchMarkdown

function click (cb) {
  return document.body.addEventListener('click', e => {
    if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey || e.defaultPrevented) return

    let a = e.target

    while (a && !(a.href && a.nodeName === 'A')) {
      a = a.parentNode
    }

    if (!a || a.hash) {
      window.picosite.emit('hash', e)
      return
    }

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

const reg = /[+-]{3}([\s\S]*)[+-]{3}([\s\S]*)/

function md (raw) {
  if (reg.test(raw)) {
    const [ nah, fm, content ] = raw.match(/[+-]{3}([\s\S]*)[+-]{3}([\s\S]*)/)

    return {
      meta: jsyaml.safeLoad(fm),
      html: marked(content)
    }
  } else {
    return {
      meta: {},
      html: marked(raw)
    }
  }
}

window.addEventListener('DOMContentLoaded', async e => {
  console.log('picosite')

  await window.picosite.emit('init', window.picosite)

  if (theme !== 'none') {
    await new Promise(r => {
      const link = document.createElement('link')
      link.href = `https://unpkg.com/picosite@0.2.1/themes/${theme}.css`
      link.href = `http://localhost:8080/${theme}.css`
      link.rel = 'stylesheet'
      link.onload = r
      document.head.appendChild(link)
    })
  }

  document.body.innerHTML = `
    <div class='outer'>
      <div class='container'>
        <div id='root'>
          loading...
  `

  const root = document.getElementById('root')

  async function go(url, pop, first) {
    if (!first) await window.picosite.emit('before', url)

    try {
      const markdown = await fetchMarkdown(url)
      const { meta, html } = md(markdown)
      document.title = meta.title
      root.innerHTML = html

      if (!pop) {
        document.title = meta.title || document.title || 'picosite'
        window.history.pushState({}, '', url)
      }

      window.picosite.pathname = url
    } catch (e) {
      console.error(e)
      const markdown = await fetchMarkdown('404.md')
      const { meta, html } = md('404.md', markdown)
      document.title = meta.title || document.title || '404 | picosite'
      root.innerHTML = html
      window.picosite.pathname = url
    }

    window.picosite.emit('after', url)
  }

  click(a => a && go(clean(a.pathname)))

  window.addEventListener('popstate', e => {
    if (e.target.location.pathname === window.picosite.pathname) return // prevent popstate on hashchange
    go(clean(e.target.location.href), true)
    return false
  })

  await loadScript('https://unpkg.com/js-yaml@3.13.1/dist/js-yaml.min.js')
  await loadScript('https://unpkg.com/marked@0.7.0/marked.min.js')

  go(window.picosite.pathname, false, true)
})
