
var turn_on = false; // Default
var word_dict = window.word_dict;
var all_words = Object.assign( {} word_dict );

var regex_word = new RegExp( "\\b" + Object.keys( word_dict ).join("\\b|\\b"), "gi" );

var m_count = 0, f_count = 0;
var m_percent = 0, f_percent = 0;
var processed = false;
var turnMr = false;

var all_male_words = Object.keys( word_dict );
var all_female_words = Object.values( word_dict );

//

for ( var i = 0; i < all_male_words.length; i ++ ) {

    all_male_words[ i ] = all_male_words[ i ].toLowerCase();

}

for ( var i = 0; i < all_female_words.length; i ++ ) {

    all_female_words[ i ] = all_female_words[ i ].toLowerCase();

}

//

function applyContent () {

    if ( processed ) return;

    $('body :not(script) :not(iframe)').contents().filter( function () {

        return this.nodeType === 3 && this.id !== 'adContent' && this.id !== 'dockedBanner' && this.id !== 'google_image_div';

    }).replaceWith( function () {

        var str = this.nodeValue;
        var temp_words = str.split(/('|:|;|\/|\s+)/);
        var words = [];

        for ( var i = 0; i < temp_words.length; i ++ ) {

            var current_word = temp_words[i].trim().replace( /[.,\/#!$%\^&\*;:{}=\_`'"?~()]/g, "" );

            if ( current_word != '' ) {

                words[ words.length ] = current_word;

            }


        }

        // Count Male/Female Words

        for ( var i = 0; i < words.length; i ++ ) {

            if ( all_male_words.indexOf( words[ i ].toLowerCase() ) >= 0 ) {

                m_count ++;

            }

            if ( all_female_words.indexOf( words[ i ].toLowerCase() ) >= 0 ) {

                f_count ++;

            }

    m_percent = Math.round( m_count / (m_count + f_count) * 100 );
    f_percent = Math.round( f_count / (m_count + f_count) * 100 );

    processed = true;

};

//

chrome.runtime.onMessage.addListener( function ( msg, sender, sendResponse ) {

    if ( ( msg.from === 'popup' ) && ( msg.action === 'getStats' ) ) {

        var stats = {
            male: m_percent.toFixed(2),
            female: f_percent.toFixed(2)
        };

        sendResponse( stats );
        return;

    }

    if ( msg.activate ) {

        applyContent();

    } else {

        $('.makeitshe').each( function ( index, el ) {

            var original_html = $( '.tooltiptext', $( this ) ).html();
            el.outerHTML = original_html;

        });

        processed = false;

    }

});
