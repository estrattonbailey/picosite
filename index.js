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
  version,
  repo,
  base,
  theme = 'default'
} = (function getQuery () {
  const s = document.currentScript
  const q = s.src.split('?')[1]
  return q && q.length > 1 ? qs(q) : {}
})()

if (!repo) {
  throw new Error('picosite repo was undefined')
}

if (!version) {
  throw new Error('picosite version was undefined')
}

const fetchMarkdown = (function createMarkdownFetcher () {
  const cache = new Map()

  function get (url) {
    return fetch(url)
      .then(res => {
        if (!res.ok) {
          throw '404'
        }

        return res
      })
  }

  return async function fetchMarkdown (url) {
    url = (!url || url === '/') ? '/index.md' : '/' + url
    url = /\.md/.test(url) ? url : url + '.md'
    url = url.replace('//', '/')

    if (cache.has(url)) return cache.get(url)

    return get(
      base ? (
        `${base}${url}`
      ) : (
        `https://raw.githubusercontent.com/${repo}/master/${url}`
      )
    )
      .then(res => res.text())
      .then(markdown => {
        cache.set(url, markdown)

        return markdown
      })
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
  console.log(`picosite v${version}`)

  await window.picosite.emit('init', window.picosite)

  if (theme !== 'none') {
    try {
      const link = document.createElement('link')
      link.href = `https://unpkg.com/picosite@${version}/themes/${theme}.css`
      link.rel = 'stylesheet'
      document.head.insertBefore(link, document.getElementsByTagName('style')[0])
    } catch (e) {}
  }

  document.body.innerHTML = `
    <div class='outer'>
      <div class='container'>
        <div id='root'>
          <style>
            .loader,
            .loader:after {
              border-radius: 50%;
              width: 40px;
              height: 40px;
            }
            .loader {
              font-size: 10px;
              position: relative;
              text-indent: -9999em;
              border-top: 4px solid rgba(255, 255, 255, 0.2);
              border-right: 4px solid rgba(255, 255, 255, 0.2);
              border-bottom: 4px solid rgba(255, 255, 255, 0.2);
              border-left: 4px solid #4A5964;
              -webkit-transform: translateZ(0);
              -ms-transform: translateZ(0);
              transform: translateZ(0);
              -webkit-animation: load8 0.5s infinite linear;
              animation: load8 0.5s infinite linear;
            }
            @-webkit-keyframes load8 {
              0% {
                -webkit-transform: rotate(0deg);
                transform: rotate(0deg);
              }
              100% {
                -webkit-transform: rotate(360deg);
                transform: rotate(360deg);
              }
            }
            @keyframes load8 {
              0% {
                -webkit-transform: rotate(0deg);
                transform: rotate(0deg);
              }
              100% {
                -webkit-transform: rotate(360deg);
                transform: rotate(360deg);
              }
            }
          </style>
          <div class='loader'></div>
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
      const markdown = await fetchMarkdown('404.md')
      const { meta, html } = md(markdown)
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
