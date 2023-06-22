const iframe = document.createElement('iframe')
iframe.src = chrome.runtime.getURL('sandbox.html')

document.body.appendChild(iframe)

iframe.contentWindow?.postMessage('code_to_be_evaluated', '*')
