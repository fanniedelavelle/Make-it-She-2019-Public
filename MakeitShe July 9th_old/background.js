
var activeTabDomain = false;
var siteStateList = JSON.parse( localStorage.getItem('siteStateList') ) || {};

chrome.tabs.onActivated.addListener( function ( tab ) {

    chrome.tabs.get( tab.tabId, function ( tabInfo ) {

        siteStateList = JSON.parse( localStorage.getItem('siteStateList') ) || {};
        activeTabDomain = tabInfo.url.split('//')[1].split('/')[0];
        localStorage.setItem( 'activeDomain', activeTabDomain );
        chrome.extension.sendMessage({ event: 'changedDomain', domain: activeTabDomain });
        var activated = siteStateList[ activeTabDomain ] === true;

        if ( activated ) {

            chrome.browserAction.setIcon({ path: "icon_on.png" });

        } else {

            chrome.browserAction.setIcon({ path: "icon_off.png" });

        }

        chrome.tabs.sendMessage( tab.tabId, {
            from: 'content',
            activate: activated
        });

    });

});

chrome.tabs.onUpdated.addListener( function ( tabId ) {

    chrome.tabs.get( tabId, function ( tabInfo ) {

        siteStateList = JSON.parse( localStorage.getItem('siteStateList') ) || {};
        activeTabDomain = tabInfo.url.split('//')[1].split('/')[0];
        localStorage.setItem( 'activeDomain', activeTabDomain );
        chrome.extension.sendMessage({ event: 'changedDomain', domain: activeTabDomain });
        var activated = siteStateList[ activeTabDomain ] === true;

        if ( activated ) {

            chrome.browserAction.setIcon({ path: "icon_on.png" });

        } else {

            chrome.browserAction.setIcon({ path: "icon_off.png" });

        }

        chrome.tabs.sendMessage( tabId, {
            from: 'content',
            activate: activated
        });

    });

});

//

chrome.runtime.onMessage.addListener( function ( msg, sender,sendResponse ) {

});
