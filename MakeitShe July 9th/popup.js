var siteStateList;
var activeDomain;

function updateSiteStateList ( site, state ) {

    siteStateList[ site ] = state;
    localStorage.setItem( 'siteStateList', JSON.stringify( siteStateList ) );

};

//

var m, f;

function setStats ( stats ) {

    if ( ! stats ) return;

    m = stats.male;
    f = stats.female;
    $('#malep').html( Math.round( stats.male ));
    $('#femalep').html( Math.round( stats.female ));

};

document.addEventListener('DOMContentLoaded', () => {

    siteStateList = JSON.parse( localStorage.getItem('siteStateList') ) || {};
    activeDomain = localStorage.getItem( 'activeDomain' );

    chrome.tabs.query({ active: true, currentWindow: true }, function ( tabs ) {

        chrome.tabs.sendMessage( tabs[0].id, { from: 'popup', action: 'getStats' }, setStats );

    });

    // On / Off Button

    if ( siteStateList[ activeDomain ] !== true ) {

        $('#on-off').switchButton({ checked: false, labels_placement: "left" });
        $('#content').hide();
        $('#disabled').show();

    } else {

        $('#on-off').switchButton({ checked: true, labels_placement: "left" });
        $('#content').show();
        $('#disabled').hide();

    }

    $('#on-off').bind( 'change', function ( event ) {

        var enabled = $('#on-off')[0].checked;

        if ( enabled ) {

            $('#content').show();
            $('#disabled').hide();
            updateSiteStateList( activeDomain, true );
            chrome.browserAction.setIcon({ path: "icon_on.png" });

            chrome.tabs.query( { active: true, currentWindow: true }, function ( tabs ) {

                chrome.tabs.sendMessage( tabs[0].id, { from: 'popup', activate: true } );
                setTimeout( function () {

                    chrome.tabs.sendMessage( tabs[0].id, { from: 'popup', action: 'getStats' }, setStats );

                }, 100 );

            });

        } else {

            $('#content').hide();
            $('#disabled').show();
            updateSiteStateList( activeDomain, false );
            chrome.browserAction.setIcon({ path: "icon_off.png" });

            chrome.tabs.query( { active: true, currentWindow: true }, function ( tabs ) {

                chrome.tabs.sendMessage( tabs[0].id, { from: 'popup', activate: false } );

            });

        }

    });

    // Tweet

    var link = '';
    var queryInfo = {
        active: true,
        currentWindow: true
    };

    chrome.tabs.query( { active: true, currentWindow: true }, function ( tabs ) {

        $('#tweetB').click( function ( event ) {

            m = m || 0;
            f = f || 0;

            tweetText = Math.round( m ) + "% mentions of men vs " + Math.round( f ) + "% women on this page. Let's bridge the gender gap!";
            tweetUrl = "https://twitter.com/intent/tweet?text=" + encodeURIComponent( tweetText ) + "&url=" + tabs[0].url + "&via=makeitshe";

            chrome.tabs.create({
                active: true,
                url: tweetUrl
            });

        });

    });
    
});
