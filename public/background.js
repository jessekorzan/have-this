function disable(tab) {
/*
	chrome.tabs.executeScript(tab.id, {
		file: 'remove.js'
	});
*/
    chrome.tabs.getSelected(null, function(tab) {
        let code = 'window.location.reload();';
        chrome.tabs.executeScript(tab.id, {code: code});
    });
    chrome.browserAction.setBadgeText({text: '', tabId: tab.id});

}

function enable(tab) {
    chrome.browserAction.setBadgeText({text: 'ON', tabId: tab.id});
    chrome.browserAction.setBadgeBackgroundColor({color: '#0090ff'});
	chrome.tabs.executeScript(tab.id, {
		file: 'static/js/main.js'
	});
	chrome.tabs.insertCSS(tab.id, {
    	file: 'static/css/main.css'
	});
}

function check(tab) {
    chrome.tabs.getSelected(null, function(tab) {
        var code = 'let _test = document.body.id.search("jk--chrome--extension--body"); _test';
        chrome.tabs.executeScript( null, {code: code},
            function (results) { 
                console.log(results[0]); 
                (!results[0]) ? disable(tab) :  enable(tab);
            }
        );
    });
}

// wait for the extension to get clicked
chrome.browserAction.onClicked.addListener(check);

// send in the screencapture
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        chrome.tabs.captureVisibleTab(
            null,
            {"format":"png"},
            function(dataUrl)
            {
                sendResponse({imgSrc:dataUrl});
            }
        );
        return true;
    }
);