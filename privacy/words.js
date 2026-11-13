// privacy/words.js -- RAVI's Privacy and Terms, the one copy (plan 2 M9 block 10; Mako's yes
// 2026-11-12). App settings' About menus and the page privacy/ both draw these words, so they
// cannot drift apart. Each entry is a row: t its short title, p its paragraphs (plain text, or
// a link written as <a href>). Every line of Privacy is checked against the code it describes:
// server/live (accounts.js WHAT IS KEPT, board.js, decks.js, offers.js, reports.js, finishes.js,
// alerts.js) and account.js's Your data. Change a line here when that code changes, and move
// the day. Wording after Basecamp's open-source policies (github.com/basecamp/policies, CC BY 4.0).
// Plain words, not legal advice.
(function(){
  var FB = '<a href="../feedback/">Feedback</a>';
  window.RAVI_LEGAL = {
    day: "2026-11-12",
    privacy: [
      { t: "What RAVI keeps", p: [
        "Every phone gets an account the first time RAVI opens. It keeps your decks, collection, games, trades, follows and hub picks, so they can move to another phone.",
        "It keeps the profile you fill in: a display name, a username, a line about you, a home area and a picture. It keeps your Riot ID if you add it, and a name for each passkey and phone you sign in with.",
        "An alert you turn on keeps this phone's push address, so the alert can reach it."
      ] },
      { t: "What RAVI never has", p: [
        "Never a password or an email. You sign in with a passkey: your phone keeps the secret, and RAVI keeps only the public half. A recovery code is kept only as a one-way stamp of itself.",
        "RAVI has no ads and no trackers. Nothing about you is sold, or passed on for marketing."
      ] },
      { t: "What other players see", p: [
        "Nothing until you share it. A binder marked For trade and a shared Wishlist show on the Exchange: each card, its printing and how many. A deck set to Link or Public shows its cards, name and note. Each comes with your display name, username and picture.",
        "Once an offer is accepted, the two of you see each other's Riot ID. A like on a deck adds to its count and never shows who liked it. The Tier list's Local view counts the legend played at a placing, never who sent it in."
      ] },
      { t: "On this phone", p: [
        "RAVI saves your settings and a copy of your things in the app's own storage on this phone. That copy stays until you remove RAVI or clear its storage."
      ] },
      { t: "Who else is involved", p: [
        "Cloudflare runs RAVI's server and GitHub serves its pages. Their computers may be outside Canada, and both see your phone's internet address, as any website does. RAVI itself keeps an address only as a one-way stamp, for the day's limits.",
        "Alerts travel through Apple's or Google's push service. The Feedback form is Tally's, and what you type there goes to Tally. Card pictures load from Riot's and TCGplayer's servers. A link out, to a store, a map or Ko-fi, follows that site's own rules."
      ] },
      { t: "Reports and blocks", p: [
        "A report is the reason you picked and the player it is about. Only Mako, who builds RAVI, sees it, and it is never a rating. Reports not acted on are removed after a while. A blocked player is not told."
      ] },
      { t: "Download or delete it", p: [
        "Your data, in your account, gives you a file of everything RAVI's server keeps for you. Delete account removes all of it at once. An account never saved and unused for 90 days is deleted."
      ] },
      { t: "Age", p: [
        "RAVI is for players 13 and older."
      ] },
      { t: "Changes and questions", p: [
        "RAVI is built by Mako at Beifong's Hit-House in Victoria, BC. When these words change, the day under them changes with them. Questions about your data go through " + FB + "."
      ] }
    ],
    terms: [
      { t: "Using RAVI", p: [
        "RAVI is free. Using it means you agree to these terms, and that you are 13 or older."
      ] },
      { t: "As it is", p: [
        "RAVI is a community project, offered as it is. Nobody promises it is always up, right or free of mistakes. Event times, rules and prices come from other sources and can be late or wrong: check with the store, or Riot's own documents, before you count on them.",
        "As far as the law allows, Mako and Beifong's Hit-House are not liable for a loss that comes from using it."
      ] },
      { t: "Riot Games", p: [
        "RAVI is a fan project. Riot Games does not make, endorse or sponsor it. Riftbound and its cards, art and symbols belong to Riot Games."
      ] },
      { t: "Prices and trades", p: [
        "A price in RAVI is a public market benchmark, never an offer from any store. A trade is between the two players: RAVI never handles money or cards and does not check who anyone is. Trade in person, at an event, on your own judgment."
      ] },
      { t: "What you share", p: [
        "Your name, picture, decks and notes stay yours. Sharing one lets RAVI show it to other players. Keep it fit for a room of all ages: nothing hateful, sexual or against the law, and nothing that is someone else's.",
        "Players can report what they see. Mako may hide or remove a picture or a shared deck, and may close an account that keeps at it."
      ] },
      { t: "Playing fair", p: [
        "Claim only your own Riot ID. Do not pose as another player, copy other players' details in bulk, or try to break or overload RAVI."
      ] },
      { t: "Leaving and changes", p: [
        "You can stop at any time and delete your account. RAVI may change, or end. When these terms change, the day under them changes with them."
      ] },
      { t: "The law", p: [
        "These terms follow the laws of British Columbia, Canada."
      ] }
    ]
  };
  var CHEV = '<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 15 12 9 18 15"/></svg>';
  var MON = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  // the day as words: 12 November 2026
  window.RAVI_LEGAL.dayWords = function(){
    var d = window.RAVI_LEGAL.day.split("-");
    return Number(d[2]) + " " + MON[Number(d[1]) - 1] + " " + d[0];
  };
  // one press group of rows that open their words in place (STYLE.md section 7, an explanation
  // menu; as Top cut's How it's worked out). kind: "privacy" or "terms"; open: every row starts open.
  window.RAVI_LEGAL.rows = function(kind, open){
    var list = window.RAVI_LEGAL[kind] || [], h = '<div class="doors glass" data-k="open">', i, id;
    for (i = 0; i < list.length; i++) {
      id = "lg" + kind.charAt(0) + i;
      h += '<button type="button" class="door" aria-expanded="' + (open ? "true" : "false") + '" aria-controls="' + id + '" data-k="open"><span class="t">' + list[i].t + '</span><span class="sp"></span>' + CHEV + '</button>' +
        '<div class="lgb" id="' + id + '"' + (open ? "" : " hidden") + '><p>' + list[i].p.join("</p><p>") + '</p></div>';
    }
    return h + '</div><p class="pnote lgday">Last changed ' + window.RAVI_LEGAL.dayWords() + '.</p>';
  };
  // a tap on a row opens or closes its words (the page script adds .reveal after the tap, never on a render)
  window.RAVI_LEGAL.bind = function(el){
    el.addEventListener("click", function(e){
      var b = e.target.closest ? e.target.closest(".door[aria-controls]") : null;
      if (!b) { return; }
      var x = document.getElementById(b.getAttribute("aria-controls")), on = b.getAttribute("aria-expanded") !== "true";
      b.setAttribute("aria-expanded", on ? "true" : "false");
      if (x) { x.hidden = !on; if (on) { x.classList.remove("reveal"); void x.offsetWidth; x.classList.add("reveal"); } }
    });
  };
})();
