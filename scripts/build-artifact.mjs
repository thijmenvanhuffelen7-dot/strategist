// Bundelt de app tot één zelfstandig HTML-bestand voor publicatie als claude.ai-pagina.
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs'

const dir = 'dist-artifact/assets'
const files = readdirSync(dir)
const js = readFileSync(`${dir}/${files.find((f) => f.endsWith('.js'))}`, 'utf8').replace(/<\/script/gi, '<\\/script')
const css = readFileSync(`${dir}/${files.find((f) => f.endsWith('.css'))}`, 'utf8').replace(/<\/style/gi, '<\\/style')

const html = `<title>Strategist OS</title>
<script>
  try {
    var t = localStorage.getItem('sos-theme') || 'system';
    var host = document.documentElement.getAttribute('data-theme');
    var sys = host ? host === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    if (t === 'dark' || (t === 'system' && sys)) document.documentElement.classList.add('dark');
  } catch (e) {}
</script>
<style>${css}</style>
<div id="root"></div>
<script type="module">${js}</script>
`
mkdirSync('artifact', { recursive: true })
writeFileSync('artifact/strategist-os.html', html)
console.log(`artifact/strategist-os.html (${(html.length / 1024).toFixed(0)} kB)`)
