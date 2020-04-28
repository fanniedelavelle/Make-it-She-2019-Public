var siteStateList;
var activeDomain, currentUrl;

function updateSiteStateList(site, state) {

    siteStateList[site] = state;
    localStorage.setItem('siteStateList', JSON.stringify(siteStateList));

};


var m, f;

function setStats(stats) {

    if (!stats) return;

    m = stats.stats.male;
    f = stats.stats.female;
    $('#malep').html(Math.round(stats.male));
    $('#femalep').html(Math.round(stats.female));

    male = m || 20;
    female = f || 30;

    if (male == 0.00 && female == 0.00) {

        sendRequestPdf();

    } else {
        $('#loader').hide();
        $('#chartContainer').show();

        var chart = new CanvasJS.Chart("chartContainer", {
            animationEnabled: true,
            title: {
                text: "Mentions of men and women",
            },
            data: [{
                type: "pie",
                startAngle: 240,
                yValueFormatString: "##0.00\"%\"",
                indexLabelFontSize: 13,
                yValueFormatString: "##0.00\"%\"",
                indexLabel: "{label} {y}",
                dataPoints: [
                    { y: Math.round(male), label: "Men", color: "purple" },
                    { y: Math.round(female), label: "Women", color: "green" }
                ]
            }]
        });
        chart.render();

    }

};



document.addEventListener('DOMContentLoaded', () => {

    siteStateList = JSON.parse(localStorage.getItem('siteStateList')) || {};
    activeDomain = localStorage.getItem('activeDomain');

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {


        chrome.tabs.sendMessage(tabs[0].id, { from: 'popup', action: 'getStats' }, setStats);

    });

    // On / Off Button

    if (siteStateList[activeDomain] !== true) {

        $('#on-off').switchButton({ checked: false, labels_placement: "left" });
        $('#content').hide();
        $('#disabled').show();

    } else {

        $('#on-off').switchButton({ checked: true, labels_placement: "left" });
        $('#content').show();
        $('#disabled').hide();

    }

    $('#on-off').bind('change', function (event) {

        var enabled = $('#on-off')[0].checked;

        if (enabled) {

            $('#content').show();
            $('#disabled').hide();
            updateSiteStateList(activeDomain, true);
            chrome.browserAction.setIcon({ path: "icon_on.png" });

            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {

                chrome.tabs.sendMessage(tabs[0].id, { from: 'popup', activate: true });
                setTimeout(function () {

                    chrome.tabs.sendMessage(tabs[0].id, { from: 'popup', action: 'getStats' }, setStats);

                }, 100);

            });

        } else {

            $('#content').hide();
            $('#disabled').show();
            updateSiteStateList(activeDomain, false);
            chrome.browserAction.setIcon({ path: "icon_off.png" });

            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {

                chrome.tabs.sendMessage(tabs[0].id, { from: 'popup', activate: false });

            });

        }

    });



    // Tweet

    var link = '';
    var queryInfo = {
        active: true,
        currentWindow: true
    };

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {

        $('#tweetB').click(function (event) {

            m = m || 0;
            f = f || 0;

            let tweetText = Math.round(m) + "% mentions of men vs " + Math.round(f) + "% women on " + tabs[0].url + " Let's bridge the gender gap!";
            let tweetUrl = "https://twitter.com/intent/tweet?text=" + encodeURIComponent(tweetText) + "&url=https://www.makeitshe.org/&via=makeitshe";

            chrome.tabs.create({
                active: true,
                url: tweetUrl
            });

        });

        $('#fbShare').click(function (event) {

            m = m || 0;
            f = f || 0;
 
            let fbText = Math.round(m) + "% mentions of men vs " + Math.round(f) + "% women on " + tabs[0].url + " Let's bridge the gender gap!";
            let fbUrl = "https://www.facebook.com/sharer/sharer.php?u=" + "https://www.makeitshe.org/&quote="+ fbText;

            chrome.tabs.create({
                active: true,
                url: fbUrl
            });

        });

    });

});



$('#report-error').click(function () {
    var subject = document.getElementById("sender-email");
    var message = document.getElementById("email-message");

    subject.value = "Error report";
    message.placeholder = "Describe the error";
    message.value = null;
    $('#content').hide();
    $('#email-content').show();
});
$('#btn-back').click(function () {
    $('#content').show();
    $('#email-content').hide();
});

$('#send-ref-mail').click(function () {
    var subject = document.getElementById("sender-email");
    var message = document.getElementById("email-message");

    subject.value = "Here's a gender-biased website";
    message.value = currentUrl;
    $('#content').hide();
    $('#email-content').show();
});

$('#go-to-twitter').click(function(){
    var newURL = "https://twitter.com/Makeitshe";
    chrome.tabs.create({ url: newURL });
});

$('#generate-pdf-content').click(function () {

    $('#content').hide();
    $('#pdf-content').show();
    $(this).hide();
    $('#back-dashboard').show();
    $('body').css({
        width: 'auto',
        minWidth: 280
    });
});

function sendRequestPdf() {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {

        chrome.tabs.sendMessage(tabs[0].id, { from: 'popup', activate: true });
        setTimeout(function () {

            chrome.tabs.sendMessage(tabs[0].id, { from: 'popup', action: 'getUrl' }, getPdfContent);

        }, 100);

    });
}

function getPdfContent(content) {
    // If absolute URL from the remote server is provided, configure the CORS
    // header on that server.
    var url = content.content.url;
    var all_male_words = content.content.all_male_words;
    var all_female_words = content.content.all_female_words;
    var name_dict = content.content.name_dict;
    var word_dict = content.content.word_dict;
    var m_count = 0, f_count = 0;
    var m_percent = 0, f_percent = 0;
    var values_name = "";

    $('#loader').show();

    for (var i = 0; i < all_male_words.length; i++) {

        all_male_words[i] = all_male_words[i].toLowerCase();

    }

    for (var i = 0; i < all_female_words.length; i++) {

        all_female_words[i] = all_female_words[i].toLowerCase();

    }

    var pdfjsLib = window['pdfjs-dist/build/pdf'];

    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@2.1.266/build/pdf.worker.js';

    pdfjsLib.getDocument(url).then(function (pdf) {
        var pdfDocument = pdf;
        var pagesPromises = [];

        for (var i = 0; i < pdf.numPages; i++) {
            // Required to prevent that i is always the total of pages
            (function (pageNumber) {
                pagesPromises.push(getPageText(pageNumber, pdfDocument));
            })(i + 1);
        }

        Promise.all(pagesPromises).then(function (pagesText) {
            // Remove loading
            $("#loading-info").remove();

            // Render text
            var temp_words = '';
            for (var i = 0; i < pagesText.length; i++) {

                $("#pdf-text").append("<div><h3>Page " + (i + 1) + "</h3><p>" + pagesText[i] + "</p><br></div>")
                temp_words += pagesText[i] + '';
            }

            var words = [];
            temp_words = temp_words.split(/('|:|;|\/|\s+)/);


            for (var i = 0; i < temp_words.length; i++) {

                var current_word = temp_words[i].trim().replace(/[.,\/#!$%\^&\*;:{}=\_`'"?~()]/g, "");

                if (current_word != '') {

                    words[words.length] = current_word;

                }

            }

            // Delete surname after Mr, Ms, M, Mme, Lady, Lord

            for (var i = 0; i < words.length; i++) {

                var w = words[i].replace(/[!?,.;`' ]/, '');

                if (w === 'Mr' || w === 'Ms' || w === 'M' || w === 'Mme' || w === 'Lady' || w === 'Lord') {

                    words.slice(i + 1, 1);

                }

            }

            //Delete surname after female name

            for (var i = 0; i < words.length; i++) {

                if (values_name.indexOf(words[i].toUpperCase()) !== -1 || name_dict[words[i]] && name_dict[words[i + 1]]) {

                    words.slice(i + 1, 1);

                }

            }


            // Count Male/Female Words

            for (var i = 0; i < words.length; i++) {

                if (all_male_words.indexOf(words[i].toLowerCase()) >= 0) {

                    m_count++;

                }

                if (all_female_words.indexOf(words[i].toLowerCase()) >= 0) {

                    f_count++;

                }

            }
            m_percent = Math.round(m_count / (m_count + f_count) * 100);
            f_percent = Math.round(f_count / (m_count + f_count) * 100);
            m = m_percent;
            f = f_percent;
            $('#loader').hide();
            $('#chartContainer').show();
            var chart = new CanvasJS.Chart("chartContainer", {
                animationEnabled: true,
                title: {
                    text: "Mentions of men and women",
                },
                data: [{
                    type: "pie",
                    startAngle: 240,
                    yValueFormatString: "##0.00\"%\"",
                    indexLabelFontSize: 15,
                    yValueFormatString: "##0.00\"%\"",
                    indexLabel: "{label} {y}",
                    dataPoints: [
                        { y: Math.round(m_percent), label: "Men", color: "purple" },
                        { y: Math.round(f_percent), label: "Women", color: "green" }
                    ]
                }]
            });
            chart.render();


        });

    }, function (reason) {
        // PDF loading error
        console.error(reason);
    });

}


/**
 * Retrieves the text of a specif page within a PDF Document obtained through pdf.js 
 * 
 * @param {Integer} pageNum Specifies the number of the page 
 * @param {PDFDocument} PDFDocumentInstance The PDF document obtained 
 **/
function getPageText(pageNum, PDFDocumentInstance) {
    // Return a Promise that is solved once the text of the page is retrieven
    return new Promise(function (resolve, reject) {
        PDFDocumentInstance.getPage(pageNum).then(function (pdfPage) {
            // The main trick to obtain the text of the PDF page, use the getTextContent method
            pdfPage.getTextContent().then(function (textContent) {
                var textItems = textContent.items;
                var finalString = "";

                // Concatenate the string of the item to the final string
                for (var i = 0; i < textItems.length; i++) {
                    var item = textItems[i];

                    finalString += item.str + " ";
                }

                // Solve promise with the text retrieven from the page
                resolve(finalString);
            });
        });
    });
}

function getPdfContent1(url) {

    // If absolute URL from the remote server is provided, configure the CORS
    // header on that server.
    var url = url.url;
    console.log(url.url);
    // Loaded via <script> tag, create shortcut to access PDF.js exports.
    var pdfjsLib = window['pdfjs-dist/build/pdf'];
    console.log(pdfjsLib);
    // The workerSrc property shall be specified.
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@2.1.266/build/pdf.worker.js';
    var pdfDoc = null,
        pageNum = 1,
        pageRendering = false,
        pageNumPending = null,
        scale = 0.8,
        canvas = document.getElementById('the-canvas'),
        ctx = canvas.getContext('2d');

    /**
     * Get page info from document, resize canvas accordingly, and render page.
     * @param num Page number.
     */
    function renderPage(num) {
        pageRendering = true;
        // Using promise to fetch the page
        pdfDoc.getPage(num).then(function (page) {
            var viewport = page.getViewport({ scale: scale });
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            // Render PDF page into canvas context
            var renderContext = {
                canvasContext: ctx,
                viewport: viewport
            };
            var renderTask = page.render(renderContext);

            // Wait for rendering to finish
            renderTask.promise.then(function () {
                pageRendering = false;
                if (pageNumPending !== null) {
                    // New page rendering is pending
                    renderPage(pageNumPending);
                    pageNumPending = null;
                }
            });
        });

        // Update page counters
        document.getElementById('page_num').textContent = num;
    }

    /**
     * If another page rendering in progress, waits until the rendering is
     * finised. Otherwise, executes rendering immediately.
     */
    function queueRenderPage(num) {
        if (pageRendering) {
            pageNumPending = num;
        } else {
            renderPage(num);
        }
    }

    /**
     * Displays previous page.
     */
    function onPrevPage() {
        if (pageNum <= 1) {
            return;
        }
        pageNum--;
        queueRenderPage(pageNum);
    }
    document.getElementById('prev').addEventListener('click', onPrevPage);

    /**
     * Displays next page.
     */
    function onNextPage() {
        if (pageNum >= pdfDoc.numPages) {
            return;
        }
        pageNum++;
        queueRenderPage(pageNum);
    }
    document.getElementById('next').addEventListener('click', onNextPage);

    /**
     * Asynchronously downloads PDF.
     */
    pdfjsLib.getDocument(url).promise.then(function (pdfDoc_) {
        pdfDoc = pdfDoc_;
        document.getElementById('page_count').textContent = pdfDoc.numPages;

        // Initial/first page rendering
        renderPage(pageNum);
    });

}


$('#back-dashboard').click(function () {
    $('#content').show();
    $('#pdf-content').hide();
    $(this).hide();
    $('#generate-pdf-content').show();
    $('body').css({
        width: 'auto',
        minWidth: 280
    });
});

$('#sender-email').keyup(function () {
    // $('#btn-send-message').attr('href','mailto:makeitshe@gmail.com?subject='+$(this).val()+'&body='+$('#email-message').val());
    $('#btn-send-message').attr('href', 'mailto:ncampowoytuk@gmail.com?subject=' + $(this).val() + '&body=' + $('#email-message').val());
});
$('#email-message').keyup(function () {
    // $('#btn-send-message').attr('href','mailto:makeitshe@gmail.com?subject='+$('#sender-email').val()+'&body='+$(this).val());
    $('#btn-send-message').attr('href', 'mailto:ncampowoytuk@gmail.com?subject=' + $('#sender-email').val() + '&body=' + $(this).val());
});
// $('#btn-send-message').click(function(){
//   Email.send({
//     Host : "smtp.elasticemail.com",
//     Port:2525,
//     Username : "raj.rajuchauhan7@gmail.com",
//     Password : "4ca2f072-a4da-4b53-a1f0-afee2fca44d1",
//     To : 'makeitshe@gmail.com',
//     From : $('#sender-email').val(),
//     Subject : "subject",
//     Body : $('#email-message').val()
// }).then(
//   message => alert(message)
// );

// });

chrome.tabs.query({ 'active': true, 'lastFocusedWindow': true }, function (tabs) {
    currentUrl = tabs[0].url;
    // $('#send-ref-mail').attr('href', 'mailto:makeitshe@gmail.com?subject=Reference Site&body=' + currentUrl);
});


// $('#send-ref-mail').click(function(){

// // alert(currentUrl);

//   Email.send({
//     Host : "smtp.mailtrap.io",
//     Port:2525,
//     Username : "d9536b8bc938e5",
//     Password : "8f4b086356fbc5",
//     To : 'fullstackdev1123@gmail.com',
//     From : 'sandeep7421@gmail.com',
//     Subject : currentUrl,
//     Body : currentUrl
// }).then(
//   message => alert(message)
// );

// });


// function autocomplete(inp, arr) {
//     console.log(inp);
//   /*the autocomplete function takes two arguments,
//   the text field element and an array of possible autocompleted values:*/
//   var currentFocus;
//   /*execute a function when someone writes in the text field:*/
//   inp.addEventListener("input", function(e) {

//     var laststring = this.value.split(' ').pop();

//       var valueSuggestion, a, b, i, val = laststring.toLowerCase();

//       /*close any already open lists of autocompleted values*/
//       closeAllLists();
//       if (!val) { return false;}
//       currentFocus = -1;
//       /*create a DIV element that will contain the items (values):*/
//       a = document.createElement("DIV");
//       a.setAttribute("id", this.id + "autocomplete-list");
//       a.setAttribute("class", "autocomplete-items");
//       /*append the DIV element as a child of the autocomplete container:*/
//       this.parentNode.appendChild(a);
//       /*for each item in the array...*/

//        if(message_suggestions.hasOwnProperty(val)){

//               valueSuggestion=message_suggestions[val];

//               b = document.createElement("DIV");
//               /*make the matching letters bold:*/
//               b.innerHTML = "<strong>" + valueSuggestion + "</strong>";
//               /*insert a input field that will hold the current array item's value:*/
//               b.innerHTML += "<input type='hidden' value='" + valueSuggestion + "'>";
//               /*execute a function when someone clicks on the item value (DIV element):*/
//               b.addEventListener("click", function(e) {
//                   /*insert the value for the autocomplete text field:*/
//                    message  = $('#email-message').val();

//                    var lastIndex = message.lastIndexOf(" ");

//                    message = message.substring(0, lastIndex);

//                    if(message=='')
//                       inp.value = message;
//                    else
//                       inp.value = message+' ';

//                    inp.value += this.getElementsByTagName("input")[0].value;
//                   /*close the list of autocompleted values,
//                   (or any other open lists of autocompleted values:*/
//                   closeAllLists();
//           });


//                  a.appendChild(b);  


//         }else{

//            console.log('Key is not exist in Object!');
//         }
//   });
//   /*execute a function presses a key on the keyboard:*/
//   inp.addEventListener("keydown", function(e) {
//       var x = document.getElementById(this.id + "autocomplete-list");
//       if (x) x = x.getElementsByTagName("div");
//       if (e.keyCode == 40) {
//         /*If the arrow DOWN key is pressed,
//         increase the currentFocus variable:*/
//         currentFocus++;
//         /*and and make the current item more visible:*/
//         addActive(x);
//       } else if (e.keyCode == 38) { //up
//         /*If the arrow UP key is pressed,
//         decrease the currentFocus variable:*/
//         currentFocus--;
//         /*and and make the current item more visible:*/
//         addActive(x);
//       } else if (e.keyCode == 13) {
//         /*If the ENTER key is pressed, prevent the form from being submitted,*/
//         e.preventDefault();
//         if (currentFocus > -1) {
//           /*and simulate a click on the "active" item:*/
//           if (x) x[currentFocus].click();
//         }
//       }
//   });
//   function addActive(x) {
//     /*a function to classify an item as "active":*/
//     if (!x) return false;
//     /*start by removing the "active" class on all items:*/
//     removeActive(x);
//     if (currentFocus >= x.length) currentFocus = 0;
//     if (currentFocus < 0) currentFocus = (x.length - 1);
//     /*add class "autocomplete-active":*/
//     x[currentFocus].classList.add("autocomplete-active");
//   }
//   function removeActive(x) {
//     /*a function to remove the "active" class from all autocomplete items:*/
//     for (var i = 0; i < x.length; i++) {
//       x[i].classList.remove("autocomplete-active");
//     }
//   }
//   function closeAllLists(elmnt) {
//     /*close all autocomplete lists in the document,
//     except the one passed as an argument:*/
//     var x = document.getElementsByClassName("autocomplete-items");
//     for (var i = 0; i < x.length; i++) {
//       if (elmnt != x[i] && elmnt != inp) {
//         x[i].parentNode.removeChild(x[i]);
//       }
//     }
//   }
//   /*execute a function when someone clicks in the document:*/
//   document.addEventListener("click", function (e) {
//       closeAllLists(e.target);
//   });
// }

// $("#email-message").keyup(function(){

//    autocomplete(document.getElementById("email-message"), message_suggestions); 

// });



//  var message_suggestions = {
//    "he": "they",
//     "she": "they",
//     "his": "theirs",
//     "hers": "theirs", 
//     "congressman": "congressperson",
//     "congressmen": "congresspersons",
//     "policeman": "policeperson",
//     "policemen": "policepersons",
//     "chairman": "chairperson",
//     "chairmen": "chairpersons",
//     "fireman": "fireperson",
//     "firemen": "firepersons",
//     "waterman": "waterperson",
//     "watermen": "waterpersons",
//     "nozzleman": "nozzleperson",
//     "nozzlemen": "nozzlepersons",
//     "adman": "adperson",
//     "admen": "adpersons",
//     "agribusinessman": "agribusinessperson",
//     "agribusinessmen": "agribusinesspersons",
//     "aidman": "aidperson",
//     "airmen": "aidpersons",
//     "alderman": "alderperson",
//     "aldermen": "alderpersons",
//   "almsman": "almsperson",
//   "almsmen": "almspersons",
//   "anchorman": "anchorperson",
//   "anchormen": "anchorpersons",
//   "antiman": "antiperson",
//   "antimen": "antipersons",
//   "artilleryman": "artilleryperson",
//   "artillerymen": "artillerypersons",
//   "ashmen": "ashpersons",
//   "assemblyman": "assemblyperson",
//   "assemblymen": "assemblypersons",
//   "ataman": "ataperson",
//   "atamen": "atapersons",
//   "attackman": "attackperson",
//   "attackmen": "attackpersons",
//   "automan": "autoperson",
//   "automae": "autopersons",
//   "axeman": "axeperson",
//   "axemen": "axepersons",
//   "axman": "axperson",
//   "axmen": "axpersons",
//   "backcourtman": "backcourtperson",
//   "backcourtmen": "backcourtpersons",
//   "backwoodsman": "backwoodsperson",
//   "backwoodsmen": "backwoodspersons",
//   "badman": "badperson",
//   "badmen": "badpersons",
//   "bagman": "bagperson",
//   "bagmen": "bagpersons",
//   "bandsman": "bandsperson",
//   "bandsmen": "bandspersons",
//   "bargeman": "bargeperson",
//   "bargemen": "bargepersons",
//   "barman": "barperson",
//   "barmen": "barpersons",
//   "baseman": "baseperson",
//   "basemen": "basepersons",
//   "batman": "batperson",
//   "batmen": "batpersons",
//   "batsman": "batsperson",
//   "batsmen": "batspersons",
//   "bayman": "bayperson",
//   "baymen": "baypersons",
//   "beadsman": "beadsperson",
//   "beadsmen": "beadspersons",
//   "bedesman": "bedesperson",
//   "bedesmen": "bedespersons",
//   "bellman": "bellperson",
//   "bellmen": "bellpersons",
//   "birdman": "birdperson",
//   "birdmen": "birdpersons",
//   "bluesman": "bluesperson",
//   "bluesmen": "bluespersons",
//   "boardman": "boardperson",
//   "boardmen": "boardpersons",
//   "boatman": "boatperson",
//   "boatmen": "boatpersons",
//   "boatsman": "boatsperson",
//   "boatsmen": "boatspersons",
//   "bogyman": "bogyperson",
//   "bogymen": "bogypersons",
//   "bondman": "bondperson",
//   "bondmen": "bondpersons",
//   "bondsman": "bondspersons",
//   "bondsmen": "bondsperson",
//   "boogerman": "boogerperson",
//   "boogermen": "boogerpersons",
//   "boogeyman": "boogeyperson",
//   "boogeymen": "boogeypersons",
//   "boogyman": "boogyperson",
//   "boogymen": "boogypersons",
//   "bookman": "bookperson",
//   "bookmen": "bookpersons",
//   "bowmen": "bowpersons",
//   "brakeman": "brakeperson",
//   "brakemen": "brakepersons",
//   "bushman": "bushperson",
//   "bushmen": "bushpersons",
//   "businessman": "businessperson",
//   "businessmen": "businesspersons",
//   "busman": "busperson",
//   "busmen": "buspersons",
//   "cabman": "cabperson",
//   "cabmen": "cabpersons",
//   "cameraman": "cameraperson",
//   "cameramen": "camerapersons",
//   "carman": "carperson",
//   "carmen": "carpersons",
//   "cattleman": "cattleperson",
//   "cattlemen": "cattlepersons",
//   "cavalryman": "cavalryperson",
//   "cavalrymen": "cavalrypersons",
//   "caveman": "caveperson",
//   "cavemen": "caveperson",
//   "cayman": "cayperson",
//   "caymen": "caypersons",
//   "chainman": "chainperson",
//   "chainmen": "chainpersons",
//   "chairmen": "chairpersons",
//   "chapmen": "chappersons",
//   "chessman": "chessperson",
//   "chessmen": "chesspersons",
//   "choreman": "choreperson",
//   "choremen": "chorepersons",
//   "churchman": "churchperson",
//   "churchmen": "churchpersons",
//   "clansman": "clansperson",
//   "clansmen": "clanspersons",
//   "clergyman": "clergyperson",
//   "clergymen": "clergypersons",
//   "clubman": "clubperson",
//   "clubmen": "clubpersons",
//   "coachman": "coachperson",
//   "coachmen": "coachpersons",
//   "coastguardman": "coastguardperson",
//   "coastguardmen": "coastguardpersons",
//   "coastguardsman": "coastguardsperson",
//   "coastguardsmen": "coastguardspersons",
//   "cochairman": "cochairperson",
//   "cochairmen": "cochairpersons",
//   "colorman": "colorperson",
//   "colormen": "colorpersons",
//   "committeeman": "committeeperson",
//   "committeemen": "committeepersons",
//   "cornerman": "cornerperson",
//   "cornermen": "cornerpersons",
//   "corpsman": "corpsperson",
//   "corpsmen": "corpspersons",
//   "councilman": "councilperson",
//   "councilmen": "councilpersons",
//   "counterman": "counterperson",
//   "countermen": "counterpersons",
//   "countryman": "countryperson",
//   "countrymen": "countrypersons",
//   "cowman": "cowperson",
//   "cowmen": "cowpersons",
//   "cracksman": "cracksperson",
//   "cracksmen": "crackspersons",
//   "craftsman": "craftsperson",
//   "craftsmen": "craftspersons",
//   "cragsman": "cragsperson",
//   "cragsmen": "cragspersons",
//   "crewman": "crewperson",
//   "crewmen": "crewpersons",
//   "crossbowman": "crossbowperson",
//   "crossbowmen": "crossbowpersons",
//   "dairyman": "dairyperson",
//   "dairymen": "dairypersons",
//   "dalesmen": "dalespersons",
//   "damen": "dapersons",
//   "daysman": "daysperson",
//   "daysmen": "dayspersons",
//   "deathsman": "deathsperson",
//   "deathsmen": "deathspersons",
//   "decumen": "decupersons",
//   "everyman": "everyperson",
//   "everymen": "everypersons",
//   "exciseman": "exciseperson",
//   "excisemen": "excisepersons",
//   "expressman": "expressperson",
//   "expressmen": "expresspersons",
//   "firmen": "firpersons",
//   "fisherman": "fisherperson",
//   "fishermen": "fisherpersons",
//   "footman": "footperson",
//   "footmen": "footpersons",
//   "frontman": "frontperson",
//   "frontmen": "frontpersons",
//   "funnyman": "funnyperson",
//   "funnymen": "funnypersons",
//   "guardsman": "guardsperson",
//   "guardsmen": "guardspersons",
//   "highwayman": "highwayperson",
//   "highwaymen": "highwaypersons",
//   "horseman": "horseperson",
//   "horsemen": "horsepersons",
//   "hotelman": "hotelperson",
//   "hotelmen": "hotelpersons",
//   "houseman": "houseperson",
//   "housemen": "housepersons",
//   "iceman": "iceperson",
//   "icemen": "icepersons",
//   "jazzman": "jazzperson",
//   "jazzmen": "jazzpersons",
//   "journeyman": "journeyperson",
//   "journeymen": "journeypersons",
//   "kinsman": "kinsperson",
//   "kinsmen": "kinspersons",
//   "landman": "landperson",
//   "landmen": "landpersons",
//   "lobsterman": "lobsterperson",
//   "lobstermen": "lobsterpersons",
//   "madman": "madperson",
//   "madmen": "madpersons",
//   "mailman": "mailperson",
//   "mailmen": "mailpersons",
//   "marksman": "marksperson",
//   "marksmen": "markspersons",
//   "meatman": "meatperson",
//   "meatmen": "meatpersons",
//   "merchantman": "merchantperson",
//   "merchantmen": "merchantpersons",
//   "merman": "merperson",
//   "mermen": "merpersons",
//   "messman": "messperson",
//   "messmen": "messpersons",
//   "middleman": "middleperson",
//   "middlemen": "middlepersons",
//   "midshipman": "midshipperson",
//   "midshipmen": "midshippersons",
//   "militiaman": "militiaperson",
//   "militiamen": "militiapersons",
//   "milkman": "milkperson",
//   "milkmen": "milkpersons",
//   "minuteman": "minuteperson",
//   "minutemen": "minutepersons",
//   "missileman": "missileperson",
//   "missilemen": "missilepersons",
//   "moneyman": "moneyperson",
//   "moneymen": "moneypersons",
//   "motorman": "motorperson",
//   "motormen": "motorpersons",
//   "newsman": "newsperson",
//   "newsmen": "newspersons",
//   "newspaperman": "newspaperperson",
//   "newspapermen": "newspaperpersons",
//   "nobleman": "nobleperson",
//   "noblemen": "noblepersons",
//   "nonman": "nonperson",
//   "nonmen": "nonpersons",
//   "ottomen": "ottopersons",
//   "outdoorsman": "outdoorsperson",
//   "outdoorsmen": "outdoorspersons",
//   "overman": "overperson",
//   "pivotman": "pivotperson",
//   "placeman": "placeperson",
//   "plainclothesman": "plainclothesperson",
//   "plainsman": "plainsperson",
//   "plantsman": "plantsperson",
//   "plowman": "plowperson",
//   "pointman": "pointperson",
//   "postman": "postperson",
//   "potman": "potperson",
//   "poultryman": "poultryperson",
//   "prefreshman": "prefreshperson",
//   "quarryman": "quarryperson",
//   "radioman": "radioperson",
//   "raftsman": "raftsperson",
//   "ragman": "ragperson",
//   "ranchman": "ranchperson",
//   "reinsman": "reinsperson",
//   "repairman": "repairperson",
//   "rifleman": "rifleperson",
//   "rodsman": "rodsperson",
//   "roundsman": "roundsperson",
//   "routeman": "routeperson",
//   "safetyman": "safetyperson",
//   "sagaman": "sagaperson",
//   "salaryman": "salaryperson",
//   "salesman": "salesperson",
//   "sandman": "sandperson",
//   "schoolman": "schoolperson",
//   "seaman": "seaperson",
//   "seedsman": "seedsperson",
//   "selectman": "selectperson",
//   "shopman": "shopperson",
//   "showman": "showperson",
//   "sideman": "sideperson",
//   "signalman": "signalperson",
//   "skyman": "skyperson",
//   "snowman": "snowperson",
//   "spaceman": "spaceperson",
//   "spokesman": "spokesperson",
//   "sportfisherman": "sportfisherperson",
//   "sportsman": "sportsperson",
//   "statesman": "statesperson",
//   "stickman": "stickperson",
//   "stillman": "stillperson",
//   "stockman": "stockperson",
//   "outmen": "outpersons",
//   "overmen": "overpersons",
//   "pivotmen": "pivotpersons",
//   "placemen": "placepersons",
//   "plainclothesmen": "plainclothespersons",
//   "plainsmen": "plainspersons",
//   "plantsmen": "plantspersons",
//   "plowmen": "plowpersons",
//   "pointmen": "pointpersons",
//   "policemen": "policepersons",
//   "postmen": "postpersons",
//   "potmen": "potpersons",
//   "poultrymen": "poultrypersons",
//   "prefreshmen": " prefreshpersons",
//   "pullmen": "pullpersons",
//   "quarrymen": "quarrypersons",
//   "radiomen": "radiopersons",
//   "raftsenn": "raftspersons",
//   "ragmen": "ragpersons",
//   "ranchmen": "ranchpersons",
//   "reedmen": "reedpersons",
//   "reinsmen": "reinspersons",
//   "remen": "repersons",
//   "repairmen": "repairpersons",
//   "riflemen": "riflepersons",
//   "rodmen": "rodpersons",
//   "rodsmen": "rodspersons",
//   "romen": "ropersons",
//   "roundsmen": "roundspersons",
//   "routemen": "routepersons",
//   "safetymen": "safetypersons",
//   "sagamen": "sagapersons",
//   "salarymen": "salarypersons",
//   "salesmen": "salespersons",
//   "sandmen": "sandpersons",
//   "schoolmen": "schoolpersons",
//   "seamen": "seapersons",
//   "seedsmen": "seedspersons",
//   "selectmen": "selectpersons",
//   "shipmen": "shippersons",
//   "shopmen": "shoppersons",
//   "showmen": "showpersons",
//   "sidemen": "sidepersons",
//   "signalmen": "signalpersons",
//   "skymen": "skypersons",
//   "snowmen": "snowpersons",
//   "sockmen": "sockpersons",
//   "soundmen": "soundman",
//   "spacemen": "spaceman",
//   "spokesmen": "spokesman",
//   "sportfishermen": "sportfisherman",
//   "sportsmen": "sportsman",
//   "statesmen": "statesman",
//   "stickmen": "stickman",
//   "stockmen": "stockman",
//   "strongman": "strongwoman",
//   "superman": "superperson",
//   "supermen": "superpersons",
//   "supersalesman": "supersalesperson",
//   "supersalesmen": "supersalespersons",
//   "vanman": "vanperson",
//   "vanmen": "vanpersons",
//   "venireman": "venireperson",
//   "veniremen": "venirepersons",
//   "workingman": "workingperson",
//   "workingmen": "workingpersons",
//   "workman": "workperson",
//   "workmen": "workpersons",
//   "yachtman": "yachtperson",
//   "yachtmen": "yachtpersons",
//   "yachtsman": "yachtsperson",
//   "yachtsmen": "yachtspersons",
//   "yardman": "yardperson",
//   "yardmen": "yardpersons "

// };


