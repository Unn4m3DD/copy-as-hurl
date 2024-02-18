/**
 * Returns a request "component"
 * @param {chrome.devtools.network.HAREntry['request']} request a request
 */
const RequestComponent = (request) => `
<div class="flex flex-row items-center odd:bg-gray-100 p-2">
  <div class="flex items-center space-x-2 w-20">
    <div
      class="flex items-center rounded-full border px-2.5 py-0.5 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-xs"
    >
      ${request.method}
    </div>
  </div>
  <div
    class="text-sm text-gray-500 dark:text-gray-400 w-full line-clamp-1"
  >
    ${request.url}
  </div>
  <button
    class="w-40 h-9 flex items-center justify-center rounded-md text-sm font-medium bg-gray-700 text-white hover:bg-gray-600 focus:bg-gray-800 transition-all duration-100"
  >
    Copy as Hurl
  </button>
</div>`;

/**
 * Returns a request "component"
 * @param {chrome.devtools.network.HAREntry['request']} request a request
 */

function getHurlTemplate(request) {
  const url = new URLSearchParams(request.url.split('?')[1]);
  toast();
  writeText(
    `
${request.method} ${request.url.split('?')[0]}
${
  includeHeaders
    ? Array.from(request.headers)
        .filter((e) => !e.name.startsWith(':'))
        .map((e) => `${e.name}:${e.value}`)
        .join('\n')
    : ''
}
${url.size > 0 ? `[QueryStringParams]` : ''}
${Array.from(url.entries())
  .map((e) => `${e[0]}:${e[1]}`)
  .join('\n')}
${request.postData?.params?.length > 0 ? `[FormParams]` : ``}
${request.postData?.params?.map((e) => `${e.name}:${e.value}`).join('\n') ?? ''}

${includeCookies && request.cookies.length > 0 ? `[Cookies]` : ``}
${
  includeCookies
    ? request.cookies.map((e) => `${e.name}:${e.value}`).join('\n') ?? ''
    : ''
}
${request.postData?.text ?? ''}
`
      .replaceAll(/\n+/g, '\n')
      .replaceAll(/\n\[/g, '\n\n[')
  );
}
let searchTerm = '';
let includeHeaders = false;
let includeCookies = false;
function render() {
  chrome.devtools.network.getHAR((resources) => {
    const requests = resources.entries
      .map((resource) => {
        return resource.request;
      })
      .filter((e) => e.url.includes(searchTerm));
    const result = requests.map((e) => RequestComponent(e)).join('\n');
    document.getElementById('request-container').innerHTML = result;
    setTimeout(() => {
      Array.from(document.getElementById('request-container').children).forEach(
        (node, i) => {
          node.children[2].addEventListener('click', () => {
            getHurlTemplate(requests[i]);
          });
        }
      );
    }, 100);
  });
}
render();
chrome.devtools.network.onRequestFinished.addListener(() => render());
document.getElementById('search-input').addEventListener('input', (e) => {
  searchTerm = e.target.value;
  render();
});
document.getElementById('include-headers').addEventListener('change', (e) => {
  includeHeaders = e.target.checked;
});
document.getElementById('include-cookies').addEventListener('change', (e) => {
  includeCookies = e.target.checked;
});
function writeText(text) {
  const el = document.createElement('textarea');
  el.value = text;
  document.body.append(el);
  el.select();
  document.execCommand('copy');
  el.remove();
}
function toast() {
  let toastElement = document.getElementById('toast');
  toastElement.className = 'show';

  setTimeout(() => {
    toastElement.className = toastElement.className.replace('show', '');
  }, 2500);
}
