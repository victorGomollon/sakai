var oldloc;
var requirementType = 0;
var mmactive = false;
var insist = false;
var delbutton;
var mm_testing = 0;
var editrow;
var delete_orphan_enabled = true;
// for generating ids
var nextid = 0;
const ONE_KB = 1024;

// in case user includes the URL of a site that replaces top,
// give them a way out. Handler is set up in the html file.
// Unload it once the page is fully loaded.

$(window).load(function () {

  window.onbeforeunload = null;
  fixupHeights();
  // Show expand collapse all if needed
  if ($('.collapsibleSectionHeader').length) {
    $('#expandCollapseButtons').show();
  }
  $('.defaultClosed').each(function () {
    setCollapsedStatus($(this).prev(), true);
  });

  // Scroll the last-answered question into view
  const questionToScrollTo = sessionStorage.getItem('question-submit-return-id');
  if (questionToScrollTo) {
    sessionStorage.removeItem('question-submit-return-id');
    document.getElementById(questionToScrollTo).scrollIntoView(true);
  }

  // Print the current page
  document.getElementById('print-view').addEventListener('click', function(event) {
    event.preventDefault();
    window.print();
  });

  // Print all pages
  const printAllButton = document.getElementById('print-all');

  if (printAllButton) {
    printAllButton.addEventListener('click', function() {
      const url = printViewWithParameter(window.location.href);
      const win = window.open(url, '_blank');
      win.focus();
      win.print();
      return false;
    });
  }
});

function fixAddBefore(href) {

  const re = /(&|\?)addBefore=[^&]*(&|$)/;
  const res = re.exec(href);
  const n = res[1] + 'addBefore=' + (addAboveItem === null ? "" : addAboveItem) + res[2];
  return href.replace(re, n);
}

function msg(s) {

  const m = document.getElementById(s);
  return m === null ? s : m.innerHTML;
}

function checkgroups(elt, groups) {

  const groupar = groups.split(",");
  elt.find('input').prop('checked', false);
  for (let i = 0; i < groupar.length; i++) {
    const inp = elt.find('input[value="' + groupar[i] + '"]');
    if (inp !== null) {
      inp.prop('checked', true);
    }
  }
}

function safeParseInt(s) {

  if (s.length > 10) return Infinity;
  if (!/^[0-9.]+$/.test(s)) return NaN;
  if (parseInt(s) <= 0) return NaN;
  return parseInt(s);
}

function formatFileSize(bytes) {
  if(bytes == 0) return '0 Bytes';
  var k = 1000,
  sizes = ['Bytes', 'KB', 'MB', 'GB'],
  i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// get the right error message. called when ifFinite(i) returns false
// that happens if it is not a number or is too big
function intError(i) {

  if (isNaN(i)) return msg("simplepage.integer-expected");
  return msg('simplepage.integer-too-big');
}

var blankRubricRow;

// Note from Chuck S. - Is there a strong reason to do this before ready()?
// $(function () {
$(document).ready(function () {
  
  maxFileUploadSize = $("#mm-max-file-upload-size").text();
  accumulatedFileSize = 0;
  // if we're in morpheus, move breadcrums into top bar, and generate an H2 with the title

  $("div.multimediaType iframe, div.multimediaType object, div.multimediaType embed, div.multimediaType video").each(function () {

    const width = $(this).attr("width");
    const height = $(this).attr("height");
    if ($(this).attr('defaultsize') === 'true' ||
          (typeof width !== 'undefined' && width !== '' &&
          (typeof height === 'undefined' || height ==''))) {
      $(this).height($(this).width() * 0.75);
    }
  });

  $("div.multimediaType img").each(function () {

    const width = $(this).attr("width");
    const height = $(this).attr("height");
    // if just width specified, we're fine. it will scale. But if height is specified narrow windows
    // will give us the wrong aspect ration
    if (typeof height !== 'undefined' && height !== '') {
      if (typeof width !== 'undefined' && width !== '') {
        // both specified. use specified aspect ratio
        if ($(this).width() != width) {
          $(this).height($(this).width() * (height / width));
        }
      } else {
        const aspect = $(this)[0].naturalHeight / $(this)[0].naturalWidth;
        // -1 to avoid triggering because of rounding
        if ($(this).width() *  aspect < (height-1)) {
        // width has been reduced because of max-width 100%
          $(this).height($(this).width() * aspect);
        }
      }
    }
  });

  $('.is-linked').click(e => e.preventDefault());

  $('.is-linked').each(function () {

    box = $(this).children().first();
    box.attr('title', $(this).children().nextAll('.tooltip-content').html())
    box.tooltip();
  });

  document.querySelectorAll('.question-submit').forEach(el => {
    el.addEventListener("click", e => {
      // Store the question the student just answered and jump to it on new page load
      const qEl = e.target.parentElement.closest('[id]');
      qEl && sessionStorage.setItem('question-submit-return-id', qEl.id);
    });
  });

  $("input[type=checkbox].checklist-checkbox").on("change", function () {

    $(this).next("span").addClass("savingChecklistItem");
    $(this).parent().nextAll(".saveChecklistSaving").show();
    $("#saveChecklistForm-checklistId").val($(this).closest(".checklistItemForm").find(".checklistId").val()).change();
    $("#saveChecklistForm-checklistItemIdInput").val($(this).val()).change();
    $("#saveChecklistForm-checklistItemDone").val($(this).is(':checked')).change();
  });

  //Only number allowed for announcements height
  $("#announcements-height").keypress(function (e) {
    //if the letter is not digit then display error
    if (e.which !== 13 && e.which != 8 && e.which != 0 && (e.which < 48 || e.which > 57)) {
      //display error message
      $("#announcementsHeightErrmsg").html(msg("simplepage.height-error-message")).show().fadeOut("slow");
      return false;
    }
  });

  $(".sectionHeader").on("click", function () {

    const section = $(this).next("div.section");
    if (section.hasClass("collapsible")) {
      section.slideToggle();
      setCollapsedStatus($(this), null); // toggle
      doIndents();
    }
  });

  $("#collapsible").on("change", function () {

    if (this.checked) {
      $("#defaultClosedSpan").show();
    } else {
      $("#defaultClosed").prop('checked', false);
      $("#defaultClosedSpan").hide();
    }
  });

  $("#sectionTitle").keyup(function () {

    if ($("#sectionTitle").val()) {
      $("#collapsible").removeProp('disabled');
    } else {
      $("#collapsible").prop('checked', false);
      $("#collapsible").prop('disabled', true);
      $("#defaultClosed").prop('checked', false);
      $("#defaultClosedSpan").hide();
    }
  });

  $("#expandAllSections").on("click", function () {

    $(".sectionHeader").each(function () {

      const section = $(this).next("div.section");
      if (section.hasClass("collapsible")) {
        section.slideDown();
        setCollapsedStatus($(this), false);
      }
    });
    $("#expandAllSections").hide();
    $("#collapseAllSections").show();
    doIndents();
  });

  $("#collapseAllSections").on("click", function () {

    $(".sectionHeader").each(function () {

      const section = $(this).next("div.section");
      if (section.hasClass("collapsible")) {
        section.slideUp();
        setCollapsedStatus($(this), true);
      }
    });
    $("#collapseAllSections").hide();
    $("#expandAllSections").show();
  });

  $("a.oembed").each(function () {
    $(this).oembed(null, {maxWidth: $(this).attr("maxWidth"), maxHeight: $(this).attr("maxHeight")});
  });

  //Only number allowed for forum-summary height
  $("#forum-summary-height").keypress(function (e) {
    //if the letter is not digit then display error
    if (e.which !== 13 && e.which != 8 && e.which != 0 && (e.which < 48 || e.which > 57)) {
      //display error message
      $("#forumSummaryHeightErrmsg").html(msg("simplepage.height-error-message")).show().fadeOut("slow");
      return false;
    }
  });
  // We don't need to run all of this javascript if the user isn't an admin
  if ($("#subpage-dialog").length > 0) {
    //Only number allowed for twitter height
    $("#widget-height").keypress(function (e) {
      //if the letter is not digit then display error
      if (e.which !== 13 && e.which != 8 && e.which != 0 && (e.which < 48 || e.which > 57)) {
        //display error message
        $("#heightErrmsg").html(msg("simplepage.height-error-message")).show().fadeOut("slow");
        return false;
      }
    });

    document.querySelector("#delete-confirm-delete-button")?.addEventListener("click", e => {

      insist = true;
      delbutton.click();
      const deleteEl = document.querySelector("#delete-confirm");
      bootstrap.Modal.getOrCreateInstance(deleteEl).hide();
    });

    //Trigger the anchor when these buttons are clicked
    document.querySelectorAll('#bulk-edit-pages-button, #reorder-button').forEach(function(button) {
        button.addEventListener('click', function(event) {
            event.preventDefault();
            // Simulate a click on the anchor
            let anchor = this.querySelector('a');
            if (anchor) {
                window.location.href = anchor.getAttribute('href');
            }
        });
    });

    /* RU Rubrics ********************************************* */
    blankRubricRow = $("#peer-eval-input-cloneable").html();

    $(".resizable").resizable();

    $("#select-resource-group").hide();

    $('.subpage-link').click(function () {
      oldloc = $(this);
      if ($(this).hasClass("add-at-end")) {
        addAboveItem = '';
      }
      $('#subpage-add-before').val(addAboveItem);
      if (typeof $('#subpage-choose').attr('href') !== 'undefined') {
        $('#subpage-choose').attr('href', fixAddBefore($('#subpage-choose').attr('href')));
      }
      return false;
    });

    $('.layout-link').click(function () {

      oldloc = $(this);
      $('li').removeClass('editInProgress');
      return false;
    });

    $('#edit-title').click(function () {

      oldloc = $(".dropdown a");
      $('#edit-title-error-container').hide();
      if ($("#page-points").val() === '') {
        $("#page-gradebook").prop("checked", false);
        $("#page-points").prop("disabled", true);
      } else {
        $("#page-gradebook").prop("checked", true);
      }

      localDatePicker({
        input: '#release_date',
        useTime: 1,
        parseFormat: 'YYYY-MM-DD HH:mm:ss',
        val: $("#currentReleaseDate").text(),
        ashidden: { iso8601: 'releaseDateISO8601' }
      });

      if ($("#currentReleaseDate").text() === '') {
        $("#page-releasedate").prop('checked', false);
      }

      return false;
    });

    $(".edit-calendar").click(function () {

      oldloc = $(this);
      var row = $(this).closest('div.item');
      $("#change-assignment-p").hide();
      $("#change-quiz-p").hide();
      $("#change-forum-p").hide();
      $("#change-resource-p").hide();
      $("#change-resource-version-p").hide();
      $("#change-blti-p").hide();
      $("#change-page-p").hide();
      $(".pageItem").hide();
      $("#newwindowstuff").hide();
      $("#formatstuff").hide();
      $("#edit-height").hide();
      $("#prereqstuff").hide();
      $(".reqCheckbox").hide();
      $("#pathdiv").hide();
      $("#editgroups").hide();
      $("#resource-group-inherited").hide();
      $("#assignment-points").hide();
      $("#assignment-points-label").hide();
      $("#name").val($(".calendar-name").text());
      $("#description").val($(".calendar-description").text());
      $("select[name=indent-level-selection]").val($(".calendar-indentLevel").text());
      $("#customCssClass").val($(".calendar-custom-css-class").text());
      $("#item-id").val(row.find(".calendar-item-id").text());

      const groups = row.find(".calendar-item-groups").text();
      const grouplist = $("#grouplist");
      if ($('#grouplist input').size() > 0) {
        $("#editgroups-student").show();
        $("#grouplist").show();
        if (groups !== null) {
          checkgroups(grouplist, groups);
        }
      }

      $("#edit-item-error-container").hide();
      return false;
    });

    $("#releaseDiv input").change(function () {
      $("#page-releasedate").prop('checked', true);
    });

    $('#announcements-link').click(function () {

      oldloc = $(this);
      $('div.item').removeClass('editInProgress');
      var position =  $(this).position();
      $("#announcements-error-container").hide();
      $("#announcementsEditId").val("-1");
      $("#announcements-height").val("");
      $("#announcementsNumberDropdown-selection").val("5");
      $("#announcements-add-before").val(addAboveItem);
      return false;
    });

    $(".edit-announcements").click(function () {

      oldloc = $(this);
      var row = $(this).closest('div.item');
      var itemId = row.find(".announcementsId").text();
      $('#announcementsEditId').val(itemId);
      var height = row.find(".announcementsWidgetHeight").text().replace(/'/g,"");
      $('#announcements-height').val(height);
      var number = row.find(".numberOfAnnouncements").text();
      $("#announcementsNumberDropdown-selection").val(number);
      $('.edit-col').addClass('edit-colHidden');
      $(this).closest('div.item').addClass('editInProgress');
      $('#announcements-error-container').hide();
      //Change the text of the add button to 'Update Item'
      $("#announcements-add-item").attr("value", msg("simplepage.edit"));
      //display delete link
      $("#announcements-delete-span").show();
      return false;
    });

    $('#delete-orphan-link').click(function () {

      if (delete_orphan_enabled) {
        delete_orphan_enabled = false;
        $('#delete-orphan').click();
      }
      return false;
    });

    $('#export-cc-submit').click(function () {

      // Get the checkbox value for bank option.
      const exportCCBank = document.getElementById('export-cc-bank').checked;
      // Get the selected CC version.
      const exportCCVersion = document.querySelector('input[name="export-cc"]:checked').value;
      const exportCCLink = document.getElementById('export-cc-link');
      const exportCCUrl = new URL(exportCCLink.href);
      // Update the request parameters with the selected options.
      exportCCUrl.searchParams.set('version', exportCCVersion);
      exportCCUrl.searchParams.set('bank', exportCCBank ? 1 : 0);
      // Replace the link
      exportCCLink.href = exportCCUrl.href;
      exportCCLink.click();
      return false;
    });

    $('#import-cc-submit').click(function () {

      $("#import-cc-loading").show();
      return true;
    });

    // This code must be read together with the SimplePageItem.MULTIMEDIA
    // display code in ShowPageProducer.java (To find it search for
    // multimediaDisplayType) and with the code in SimplePageBean that
    // handles the submit from this dialog, addMultimedia.

    $('#mm-add-item').click(function () {

      // mm-display-type is 1 -- embed code, 2 -- av type, 3 -- oembed, 4 -- iframe

      let url = $('#mm-url').val();
      if (url !== '' && $('#mm-is-mm').val() === 'true') {
        if (mm_testing === 0) {
          // initial submit for URL. see what we've got
          if (url.indexOf('<') >= 0) {
            // < in the field, it's embed. just show it after filtering
            $('#mm-test-embed-results').show();
            $('#mm-test-embed-contents').html(filterHtml(url));
            mm_testing = 3;
            $('.mm-test-reset').show();
            $('#mm-display-type').val(1);
            return false;
          }
          // not embed. Treat as a url
          // first normalize it

          if (document.URL.indexOf("https:") === 0 && url.trim().match('^http:')) {
            // using https: to display and URL starts with http, use warning
            alert('Please use URLs starting with https:. URLs starting with http: will not work with some browsers, e.g. Firefox.');
          }
          url = url.trim();
          if (!url.match('^http:') && !url.match('^https:') && !url.match('^/')) {
            // assume it's a hostname or hostname/path
            url = 'https://' + url;
            $('#mm-url').val(url);
            $('#mm-test-addedhttps').show();
            $('#mm-test-added-url').text(url);
          }

          // see what we've got
          mimeType = getMimeType(url);
          $('#mm-mime-type').val(mimeType);

          // for video or audio MIME types, the normal ShowPage code can handle it.

          // youtube returns application/youtube, so it gets handled here
          if (!mimeType.match('^text/html') && !mimeType.match('^application/xhtml+xml')) {
              $('#mm-display-type').val(2);
              // just submit
              return true;
          }

          // not video or audio, try oembed. If that doesn't work, IFRAME

          // create the test link from prototype, because oembed will remove it
          const testlink = $('#mm-test-prototype').clone();
          testlink.attr('id', 'mm-test-link');
          $('#mm-test-prototype').after(testlink);
          testlink.attr('href', url);
          $('#mm-test-oembed-results').show();
          testlink.show();
          testlink.oembed(null, {maxWidth:300});

          mm_testing = 1;
          $('#mm-display-type').val(3);
          $('.mm-test-reset').show();
          $('#mm-test-tryother').show();
          return false;
        }
        // for a URL we always return when mm_testing = 0
        // with mm_testing = 3, we handle submit normally
        // with mm_testing = 1, we handle submit normally, but
        //  there's another button to try the other alterantive
      }
      // for file upload set up the names
      if ($('.mm-file-input-names').size() > 0) {
        let names = '';
        $('.mm-file-input-names').each(function () {
          names = names + $(this).val().replace(/\s/g," ") + "\n";
        });
        // it's not really HTML, but I don't want any processing done on it
        $('#mm-names').html(names);
      };
      // prevent double click
      if (!mmactive) {
          return false;
      }
      mmactive = false;
      $('#mm-loading').show();
      // actually do the submit
      return true;
    });

    // for a normal url, after we show oembed, this
    // button lets us try an iframe
    $('#mm-test-tryother').click(function () {
      const url = $('#mm-url').val();
      if (mm_testing === 1) {
        $('#mm-test-oembed-results').hide();
        $('#mm-test-iframe-results').show();
        $('#mm-test-iframe-iframe').attr('src', url);
        mm_testing = 3;
        $('#mm-display-type').val(4);
        // try other already shown
        // start over already shown
      } else {
        // go back to oembed
        const testlink = $('#mm-test-prototype').clone();
        $('#mm-test-oembed-results .oembedall-container').remove();
        $('#mm-test-iframe-results').hide();
        $('#mm-test-prototype').after(testlink);
        testlink.attr('href', url);
        $('#mm-test-oembed-results').show();
        testlink.show();
        testlink.oembed(null, {maxWidth:300});
        $('#mm-display-type').val(3);

        mm_testing = 1;
        // try other and start over already shown
      }
      return false;
    });

    $(".edit-forum-summary").click(function () {

      oldloc = $(this);
      const row = $(this).closest('div.item');
      const itemId = row.find(".forumSummaryId").text();
      $('#forumSummaryEditId').val(itemId);
      const height = row.find(".forumSummaryWidgetHeight").text().replace(/'/g,"");
      $('#forum-summary-height').val(height);
      const number = row.find(".numberOfConversations").text();
      $("#forumNumberDropdown-selection").val(number);
      $('.edit-col').addClass('edit-colHidden');
      $(this).closest('div.item').addClass('editInProgress');
      $('#forum-summary-error-container').hide();
      //Change the text of the button to 'Update Item'
      $("#forum-summary-add-item").attr("value", msg("simplepage.edit"));
      //display delete link
      $("#forum-summary-delete-span").show();
      return false;
    });

    $('.mm-test-reset').click(function () {

      mm_test_reset();
      return false;
    });

    $("#page-gradebook").click(function () {

      if ($("#page-gradebook").prop("checked")) {
        if ($("#page-points").val() === '') {
          $("#page-points").val('1');
        }
        $("#page-points").prop("disabled", false);
      } else {
        $("#page-points").val('');
        $("#page-points").prop("disabled", true);
      }
    });

    // link to resource helper. add name if user has typed one
    $('#mm-choose').click(function () {

      $(this).attr('href', $(this).attr('href').replace(/&name=[a-z]*/, "&name=" + encodeURIComponent($('#mm-name').val())));
      return true;
    });

    //  $('#remove-page-submit').click(function () {
    //    if ($("#remove-page-submit").attr("src") != null) {
    //        window.location.href= $("#remove-page-submit").attr("src");
    //        return false;
    //    }
    //    return true;
    //  });

    $(".edit-youtube").click(function () {

      oldloc = $(this);
      $('div.item').removeClass('editInProgress');
      $("#editgroups-youtube").after($("#grouplist"));
      $("#grouplist").hide();
      $("#editgroups-youtube").hide();

      const row = $(this).closest('div.item');

      const groups = row.find(".item-groups").text();
      const grouplist = $("#grouplist");
      if ($('#grouplist input').size() > 0) {
        $("#editgroups-youtube").show();
        $("#grouplist").show();
        if (groups !== null) {
          checkgroups(grouplist, groups);
        }
      }

      if (row.find(".prerequisite-info").text() === 'true') {
        $('#youtube-prerequisite').prop('checked',true);
      } else {
        $('#youtube-prerequisite').prop('checked', false);
      }

      const itemid = row.find(".mm-item-id").text();

      $("#youtubeEditId").val(row.find(".youtube-id").text());
      $("#youtubeURL").val(row.find(".youtube-url").text());
      $("#youtubeHeight").val(row.find(".mm-height").text());
      $("#youtubeWidth").val(row.find(".mm-width").text());
      $("#description4").val(row.find(".description").text());
      $('.edit-col').addClass('edit-colHidden');
      $(this).closest('div.item').addClass('editInProgress');
      $("#grouplist").hide();
      return false;
    });

    $("#editgroups-youtube").click(function () {

      $("#editgroups-youtube").hide();
      $("#grouplist").show();
    });

    $('.edit-movie').click(function () {

      oldloc = $(this);
      $('div.item').removeClass('editInProgress');
      $("#expert-movie").hide();
      $("#expert-movie-toggle-div").show();
      $("#editgroups-movie").after($("#grouplist"));
      $("#grouplist").hide();
      $("#editgroups-movie").hide();

      const row = $(this).closest('div.item');

      const findObject = row.find('object').find('object');
      row.find(".path-url").attr("href", findObject.attr("data"));
      $("#movie-path").html(row.find(".item-path").html());

      // only show caption option for HTML5 video
      if (row.find(".allow-caption").size() > 0) {
        $("#change-caption-movie-p").show();
          if (row.find(".has-caption").size() > 0) {
            $("#change-caption-movie").text(msg("simplepage.change_caption"));
          } else {
            $("#change-caption-movie").text(msg("simplepage.add_caption"));
          }
      } else {
          $("#change-caption-movie-p").hide();
      }

      const groups = row.find(".item-groups").text();
      const grouplist = $("#grouplist");
      if ($('#grouplist input').size() > 0) {
        $("#editgroups-movie").show();
        $("#grouplist").show();
        if (groups !== null) {
          checkgroups(grouplist, groups);
        }
      }

      const itemid = row.find(".mm-item-id").text();

      $("#movieEditId").val(row.find(".movie-id").text());
      $("#movie-height").val(row.find(".mm-height").text());
      $("#movie-width").val(row.find(".mm-width").text());
      $("#description3").val(row.find(".description").text());
      if (row.find(".movie-prerequisite").text() === 'true') {
        $('#movie-prerequisite').prop('checked', true);
      } else {
        $('#movie-prerequisite').prop('checked', false);
      }
      $("#mimetype4").val(row.find(".mm-type").text());
      $('.edit-col').addClass('edit-colHidden');
      $(this).closest('div.item').addClass('editInProgress');
      $("#grouplist").hide();
      return false;
    });

    $(".edit-comments").click(function () {

      oldloc = $(this);
      $('div.item').removeClass('editInProgress');
      $("#editgroups-comments").after($("#grouplist"));
      $("#grouplist").hide();
      $("#editgroups-comments").hide();

      const row = $(this).parent().parent().parent();
      editrow = row;

      const groups = row.find(".item-groups").text();
      const grouplist = $("#grouplist");
      if ($('#grouplist input').size() > 0) {
        $("#editgroups-comments").show();
        $("#grouplist").show();
        if (groups !== null) {
          checkgroups(grouplist, groups);
        }
      }

      const itemId = row.find(".comments-id").text();
      $("#commentsEditId").val(itemId);

      const anon = row.find(".commentsAnon").text();
      if (anon === "true") {
        $("#comments-anonymous").prop("checked", true);
        $("#comments-anonymous").attr("defaultChecked", true);
      } else {
        $("#comments-anonymous").prop("checked", false);
      }

      const required = row.find(".commentsitem-required").text();
      if (required === "true") {
        $("#comments-required").prop("checked", true);
      } else {
        $("#comments-required").prop("checked", false);
      }

      var prerequisite = row.find(".commentsitem-prerequisite").text();
      if (prerequisite === "true") {
        $("#comments-prerequisite").prop("checked", true);
      } else {
        $("#comments-prerequisite").prop("checked", false);
      }

      const commentsConditionPicker = document.getElementById("comments-condition-picker");
      if (commentsConditionPicker) {
        commentsConditionPicker?.setAttribute("item-id", itemId);
      } else {
        console.error("comments-condition-picker not found");
      }

      const grade = row.find(".commentsGrade").text();
      if (grade === "true") {
        $("#comments-graded").prop("checked", true);
        $("#comments-graded").attr("defaultChecked", true);
      } else {
        $("#comments-graded").prop("checked", false);
      }

      $("#comments-max").val(row.find(".commentsMaxPoints").text());
      if ($("#comments-max").val() === "null") {
        $("#comments-max").val("");
      }

      $('.edit-col').addClass('edit-colHidden');
      $(this).closest('div.item').addClass('editInProgress');
      $("#grouplist").hide();
      return false;
    });

    $("#editgroups-comments").click(function () {

      $("#editgroups-comments").hide();
      $("#grouplist").show();
    });

    $(".edit-student").click(function () {

      oldloc = $(this);
      $('div.item').removeClass('editInProgress');
      $("#editgroups-student").after($("#grouplist"));
      $("#grouplist").hide();
      $("#editgroups-student").hide();
      $("#student-group-show").hide();
      $("#student-group-errors-container").hide();

      var row = $(this).parent().parent().parent();
      editrow = row;

      let groups = row.find(".item-groups").text();
      let grouplist = $("#grouplist");
      if ($('#grouplist input').size() > 0) {
        $("#editgroups-student").show();
        $("#grouplist").show();
        if (groups !== null) {
          checkgroups(grouplist, groups);
        }
      }

      groups = row.find(".student-owner-groups").text();
      grouplist = $("#student-grouplist");
      if ($('#student-grouplist input').size() > 0) {
        $("#student-grouplist").show();
        if (groups !== null) {
          checkgroups(grouplist, groups);
        }
      }
      const groupOwned = row.find(".student-group-owned").text();
      $("#student-group-owned").prop("checked",(groupOwned === "true"));
      if (groupOwned === "true") {
        $("#student-group-show").show();
      }

      const groupOwnedIndividual = row.find('.student-owned-eval-individual').text();
      $("#student-group-owned-eval-individual").prop("checked",(groupOwnedIndividual === "true"));
      const seeOnlyOwn = row.find('.student-owned-see-only-own').text();
      $("#student-group-owned-see-only-own").prop("checked",(seeOnlyOwn === "true"));

      const itemId = row.find(".student-id").text();

      $("#studentEditId").val(itemId);

      const anon = row.find(".studentAnon").text();
      if (anon === "true") {
        $("#student-anonymous").prop("checked", true);
        $("#student-anonymous").attr("defaultChecked", true);
      } else {
        $("#student-anonymous").prop("checked", false);
      }

      var comments = row.find(".studentComments").text();
      if (comments === "true") {
        $("#student-comments").prop("checked", true);
        $("#student-comments").attr("defaultChecked", true);
      } else {
        $("#student-comments").prop("checked", false);
      }

      /* RU Rubrics ********************************************* */
      //Because all Student Content boxes use the same dialog, the settings are applied when Edit is clicked.
      //The following decides whether to have the box already checked when it is first opened.
      const peerReview = row.find(".peer-eval").text();
      const peerEvalCheck = document.getElementById("peer-eval-check");
      if (peerReview === "true") {
        peerEvalCheck.checked = true;
        peerEvalCheck.setAttribute("defaultChecked", true);
      } else {
        peerEvalCheck.checked = false;
      }

      $("#available-rubrics-container").html("");

      const rubric = { rows: [] };
      row.find(".peer-eval-row").each(function () {
        const categoryId = $(".peerReviewId" , $(this)).text();
        const categoryText = $(".peerReviewText" , $(this)).text();
        rubric.rows.push({"id":categoryId , "text":categoryText});
      });
      const peerEvalTitle = row.find(".peer-eval-title").text();
      rubric.title = peerEvalTitle && peerEvalTitle !== "null" ? peerEvalTitle : "";
      buildExistingRubrics(rubric);

      const forcedAnon = row.find(".forcedAnon").text();
      if (forcedAnon === "true") {
        $("#student-comments-anon").prop("checked", true);
        $("#student-comments-anon").attr("defaultChecked", true);
      } else {
        $("#student-comments-anon").prop("checked", false);
      }

      const required = row.find(".studentitem-required").text();
      if (required === "true") {
        $("#student-required").prop("checked", true);
      } else {
        $("#student-required").prop("checked", false);
      }
      const prerequisite = row.find(".studentitem-prerequisite").text();
      if (prerequisite === "true") {
        $("#student-prerequisite").prop("checked", true);
      } else {
        $("#student-prerequisite").prop("checked", false);
      }

      if (!$("#student-comments").prop("checked")) {
        $("#student-comments-anon").prop("disabled", true).prop("checked", false);
        $("#student-comments-graded").prop("disabled", true).prop("checked", false);
        $("#student-comments-max").prop("disabled", true).val("");
      } else {
        $("#student-comments-anon").prop("disabled", false);
        $("#student-comments-graded").prop("disabled", false);
        $("#student-comments-max").prop("disabled", false);
      }

      const studentContentConditionPicker = document.getElementById("student-condition-picker");
      if (studentContentConditionPicker) {
        studentContentConditionPicker.setAttribute("item-id", itemId);
      } else {
        console.error("student-condition-picker not found");
      }

      /* RU Rubrics ********************************************* */
      const peerEvalOpenDate = row.find(".peer-eval-open-date").text();
      const peerEvalDueDate = row.find(".peer-eval-due-date").text();

      localDatePicker({
        input: '#due_date_dummy',
        useTime: 1,
        parseFormat: 'YYYY-MM-DD HH:mm:ss',
        val: peerEvalDueDate,
        ashidden: { iso8601: 'peer_eval_due_dateISO8601' }
      });

      localDatePicker({
        input: '#open_date_dummy',
        useTime: 1,
        parseFormat: 'YYYY-MM-DD HH:mm:ss',
        val: peerEvalOpenDate,
        ashidden: { iso8601: 'peer_eval_open_dateISO8601' }
      });

      //const peerEvalCheck = document.getElementById("peer-eval-check");
      if (!peerEvalCheck.checked) {
        document.getElementById("add-rubric-block").style.display = "none";
        $("#available-rubrics-container input").prop("disabled", true).prop("checked", false);
        $(".student-peer-review-selected").val("");

        $("#peer-eval-open-date").hide();
        $("#peer-eval-due-date").hide();
        $("#peer-eval-allow-self-div").hide();
      } else {
        document.getElementById("add-rubric-block").style.display = "block";
        $("#available-rubrics-container input").prop("disabled", false);

        $("#peer-eval-open-date").show();
        $("#peer-eval-due-date").show();
        $("#peer-eval-allow-self-div").show();
        $("#peer-eval-allow-selfgrade").prop("checked", false);
      }
      const selfEval = row.find(".peer-eval-allow-self").text();

      if (selfEval === "true") {
        $("#peer-eval-allow-selfgrade").prop("checked", true);
        $("#peer-eval-allow-selfgrade").attr("defaultChecked", true);
      } else {
        $("#peer-eval-allow-selfgrade").prop("checked", false);
      }
      let grade = row.find(".studentGrade").text();
      if (grade === "true") {
        $("#student-graded").prop("checked", true);
        $("#student-graded").attr("defaultChecked", true);
      } else {
        $("#student-graded").prop("checked", false);
      }

      $("#student-max").val(row.find(".studentMaxPoints").text());
      if ($("#student-max").val() === "null") {
        $("#student-max").val("");
      }

      $("#gradebook-title").val(row.find(".studentGradebookTitle").text());
      if ($("#gradebook-title").val() === "null") {
        $("#gradebook-title").val("");
      }

      grade = row.find(".studentGrade2").text();
      if (grade === "true") {
        $("#student-comments-graded").prop("checked", true);
        $("#student-comments-graded").attr("defaultChecked", true);
      } else {
        $("#student-comments-graded").prop("checked", false);
      }

      $("#student-comments-max").val(row.find(".studentMaxPoints2").text());
      if ($("#student-comments-max").val() === "null") {
        $("#student-comments-max").val("");
      }

      insist = false;
      $("#student-group-errors").text("");
      $('.edit-col').addClass('edit-colHidden');
      $(this).closest('div.item').addClass('editInProgress');
      $("#grouplist").hide();
      return false;
    });

    $("#update-student").click(function () {

      document.querySelectorAll("#student-form .peer-eval-input-row").forEach(input => {

        input.value = input.previousElementSibling.innerText + ":" + input.value.trim();
      });

      if (!insist && $("#student-group-owned").prop("checked")) {
        let groups = "";
        if ($('#student-grouplist input:checked').size() > 0) {
          $("#student-grouplist input:checked").each(function (index) {
            groups += "," + $(this).attr("value");
          });
          groups = groups.substring(1);
        }
        const errors = getGroupErrors(groups);
        if (errors !== "ok") {
          $("#student-group-errors").text(errors);
          $("#student-group-errors-container").show();
          insist = true;
          return false;
        }
      }
      $("#open_date_string").val($("#peer_eval_open_dateISO8601").val());
      $("#due_date_string").val($("#peer_eval_due_dateISO8601").val());
      return true;
    });

    $("#editgroups-student").click(function () {
      $("#editgroups-student").hide();
      $("#grouplist").show();
    });

    $("#student-group-owned").click(function () {

      $("#student-group-show").show();
      $("#student-grouplist").show();
    });

    $("#student-comments").click(function () {

      if (!$("#student-comments").prop("checked")) {
        $("#student-comments-anon").prop("disabled", true).prop("checked", false);
        $("#student-comments-graded").prop("disabled", true).prop("checked", false);
        $("#student-comments-max").prop("disabled", true).val("");
      } else {
        $("#student-comments-anon").prop("disabled", false);
        $("#student-comments-graded").prop("disabled", false);
        $("#student-comments-max").prop("disabled", false);
      }
    });

    $(".add-before-param").click(function () {

      $(this).attr('href', fixAddBefore($(this).attr('href')));
      return true;
    });

    /* RU Rubrics ********************************************* */
    const peerEvalCheck = document.getElementById("peer-eval-check");
    peerEvalCheck.addEventListener("change", function () {

      if (!peerEvalCheck.checked) {
        document.getElementById("add-rubric-block").style.display = "none";
        $("#available-rubrics-container input").prop("disabled", true).prop("checked", false);
        /*show the dateEvolver */
        $("#peer-eval-open-date").hide();
        $("#peer-eval-due-date").hide();
        $("#peer-eval-allow-self-div").hide();
      } else {
        console.debug("#peer-eval-check is checked");
        document.getElementById("add-rubric-block").style.display = "block";
        $("#available-rubrics-container input").prop("disabled", false);

        $("#peer-eval-open-date").show();
        $("#peer-eval-due-date").show();
        $("#peer-eval-allow-self-div").show();
        $("#peer-eval-allow-selfgrade").prop("checked", false);
      }
    });

    $("#editgroups-movie").click(function () {

      $("#editgroups-movie").hide();
      $("#grouplist").show();
    });

    // IE8 was handling this event oddly.  This is the only pattern I could
    // get to work.
    $("[name='question-select-selection']").bind('click', function () {

      if ($(this).attr("id") === "multipleChoiceSelect") {
        $("#shortanswerDialogDiv").hide();
        $("#multipleChoiceDialogDiv").show();
      } else {
        $("#shortanswerDialogDiv").show();
        $("#multipleChoiceDialogDiv").hide();
      }
    });

    $('.forum-summary-link').click(function () {
      oldloc = $(this);
      $('div.item').removeClass('editInProgress');
      $("#forum-summary-error-container").hide();
      $("#forumSummaryEditId").val("-1");
      $("#forum-summary-height").val("");
      $("#forumNumberDropdown-selection").val("5");
      $("#forum-summary-add-before").val(addAboveItem);
      return false;
    });

    $('.question-link').click(function () {
      const questionConditionPicker = document.getElementById("question-condition-picker");
      if (questionConditionPicker) {
        questionConditionPicker?.classList.add("hidden");
      } else {
        console.error("question-condition-picker not found");
      }

      oldloc = $(this);
      $('div.item').removeClass('editInProgress');

      $("#question-editgroups").after($("#grouplist"));
      $("#question-editgroups").hide();
      const grouplist = $("#grouplist");
      if ($('#grouplist input').size() > 0) {
        $("#question-editgroups").show();
        $("#grouplist").show();
      }

      $('#question-error-container').hide();
      $("#questionEditId").val("-1");
      $("#question-text-area-evolved\\:\\:input").val("");
      $("#question-answer-input").val("");
      $("#question-graded").prop("checked", false);
      $("#question-gradebook-title").val("");
      $("#question-max").val("");
      $("#question-required").prop("checked", false);
      $("#question-prerequisite").prop("checked", false);
      $("#question-show-poll").prop("checked", false);
      $("#multipleChoiceSelect").click();
      $("#multipleChoiceSelect").prop('checked',true);  //the Click above will trigger the right hide/show of things itself, but it will not actually display multipleChoiceSelect as Checked, so we do it explicitly here.
      resetMultipleChoiceAnswers();
      resetShortanswers();

      $("#multipleChoiceSelect").prop("disabled", false);
      $("#shortanswerSelect").prop("disabled", false);
      checkQuestionGradedForm();

      $("#question-correct-text").val("");
      $("#question-incorrect-text").val("");
      $("#update-question").attr("value", msg("simplepage.save_message"));

      $("#question-addBefore").val(addAboveItem);
      $("#grouplist").hide();
      return false;
    });

    $("#question-graded").click(checkQuestionGradedForm);

    $(".edit-question").click(function () {

      oldloc = $(this);

      $("#question-editgroups").after($("#grouplist"));
      $("#question-editgroups").hide();

      const row = $(this).parent().parent().parent();

      const groups = row.find(".item-groups").text();
      const grouplist = $("#grouplist");
      if ($('#grouplist input').size() > 0) {
        $("#question-editgroups").show();
        $("#grouplist").show();
        if (groups !== null) {
          checkgroups(grouplist, groups);
        }
      }

      const itemId = row.find(".question-id").text();
      $("#questionEditId").val(itemId);

      const questionConditionPicker = document.getElementById("question-condition-picker")
      if (questionConditionPicker) {
        questionConditionPicker.classList.remove("hidden");
        questionConditionPicker.setAttribute("item-id", itemId);
      } else {
        console.error("question-condition-picker not found");
      }

      $("#activeQuestion").val(row.find(".raw-question-text").prop("name"));
      let questionText = row.find(".raw-question-text").val();
      CKEDITOR.instances["question-text-area-evolved::input"].setData(questionText);

      resetMultipleChoiceAnswers();
      resetShortanswers();

      // We can't have these disabled when trying to select them (which we do to set the type
      // in the dialog).  They're disabled again later in this function so that users can't
      // change the question type of an already existing question.
      $("#multipleChoiceSelect").prop("disabled", false);
      $("#shortanswerSelect").prop("disabled", false);

      var questionType = row.find(".questionType").text();
      if (questionType === "shortanswer") {
        $("#shortanswerSelect").click();

        var questionAnswers = row.find(".questionAnswer").text().split("\n");
        for (let index = 0; index < questionAnswers.length - 1; index++) {
          let answerSlot;
          if (index === 0) {
            answerSlot = $("#copyableShortanswer").first();
          } else {
            answerSlot = addShortanswer();
          }

          answerSlot.find(".question-shortanswer-answer").val(questionAnswers[index]);
        }
      } else {
        $("#multipleChoiceSelect").click();

        $("#question-answer-input").val("");

        row.find(".questionMultipleChoiceAnswer").each(function (index, el) {

          var id = $(el).find(".questionMultipleChoiceAnswerId").text();
          //SAK-46296
          var text = $(el).find(".raw-questionAnswer-text").val();
          var correct = $(el).find(".questionMultipleChoiceAnswerCorrect").text();

          var answerSlot;
          if (index === 0) {
            answerSlot = $("#copyableMultipleChoiceAnswer").first();
          } else {
            answerSlot = addMultipleChoiceAnswer();
          }

          answerSlot.find(".question-multiplechoice-answer-id").val(id);
          answerSlot.find(".question-multiplechoice-answer").val(text);
          if (correct === "true") {
            answerSlot.find(".question-multiplechoice-answer-correct").prop("checked", true);
          } else {
            answerSlot.find(".question-multiplechoice-answer-correct").prop("checked", false);
          }
        });

        var questionShowPoll = row.find(".questionShowPoll").text();
        if (questionShowPoll === "true") {
          $("#question-show-poll").prop("checked", true);
        } else {
          $("#question-show-poll").prop("checked", false);
        }
      }

      // Don't allow question types to be changed.  Simplifies consistency in grading on the backend.
      $("#multipleChoiceSelect").prop("disabled", true);
      $("#shortanswerSelect").prop("disabled", true);

      var questionGraded = row.find(".questionGrade").text();
      if (questionGraded === "true") {
        $("#question-graded").prop("checked", true);
      } else {
        $("#question-graded").prop("checked", false);
      }

      checkQuestionGradedForm();

      var gradebookTitle = row.find(".questionGradebookTitle").text();
      if (gradebookTitle === "null") {
        $("#question-gradebook-title").val("");
      } else {
        $("#question-gradebook-title").val(gradebookTitle);
      }

      var maxPoints = row.find(".questionMaxPoints").text();
      if (maxPoints === "null") {
        $("#question-max").val("");
      } else {
        $("#question-max").val(maxPoints);
      }

      var questionCorrectText = row.find(".questionCorrectText").text();
      $("#question-correct-text").val(questionCorrectText);

      var questionIncorrectText = row.find(".questionIncorrectText").text();
      $("#question-incorrect-text").val(questionIncorrectText);

      var required = row.find(".questionitem-required").text();
      if (required === "true") {
        $("#question-required").prop("checked", true);
      } else {
        $("#question-required").prop("checked", false);
      }

      var prerequisite = row.find(".questionitem-prerequisite").text();
      if (prerequisite === "true") {
        $("#question-prerequisite").prop("checked", true);
      } else {
        $("#question-prerequisite").prop("checked", false);
      }

      $("#delete-question-div").show();

      $("#delete-question-div").hide();
      $('.edit-col').addClass('edit-colHidden');
      $(this).closest('div.item').addClass('editInProgress');
      $('#question-error-container').hide();
      $("#update-question").attr("value", msg("simplepage.edit"));

      $("#grouplist").hide();
      return false;
    });
    //when edit twitter link is clicked twitterDialog is opened
    $("#edit-twitter").click(function () {

      oldloc = $(this);
      var row = $(this).parent().parent().parent();
      var itemId = row.find(".twitter-id").text();
      $("#twitterEditId").val(itemId);
      $("#twitter-addBefore").val(addAboveItem);
      var username = row.find(".username").text().replace(/'/g,"");
      $("#twitter-username").val(username);
      //remove single quotes from the string
      var height = row.find(".twitterHeight").text().replace(/'/g,"");
      $("#widget-height").val(height);
      var tweetLimit = row.find(".tweetLimit").text().replace(/'/g,"");
      $("#numberDropdown-selection").val(tweetLimit);
      $('.edit-col').addClass('edit-colHidden');
      $(this).closest('div.item').addClass('editInProgress');
      $('#twitter-error-container').hide();
      //Change the text for the button to 'Update Item'
      $("#twitter-add-item").attr("value", msg("simplepage.edit"));
      //make delete twitter link visible
      $("#twitter-delete-span").show();
      return false;
    });

    $("#question-editgroups").click(function () {

      $("#question-editgroups").hide();
      $("#grouplist").show();
    });

    $('.layout-option').click(function () {

      $('.layout-option').each(function () {
        $(this).css('border-color', '#fff');
      });
      $(this).css('border-color', '#025aa5');
      $(this).find("input:radio").prop('checked', true);
    });

    $('#layout-color-scheme-selection').on('change', function () {

      var colorChoice = $(this).val();
      $('.addSectionTitleExample').each(function () {
        this.className='addSectionTitleExample col' + colorChoice + '-header';
      });
      $('.addSectionColumn').each(function () {
        this.className='addSectionColumn col' + colorChoice;
      })
    });

    $('#layout-section-collapsible').on('change', function () {

      $('span.collapsible-section').toggle();
      if (!$(this).is(':checked')) {
        $('#layout-section-start-collapsed').prop('checked', false);
      }
    });

    $('#layout-section-start-collapsed').on('change', function () {

      if ($(this).is(':checked')) {
        $('#layout-section-collapsible').prop('checked', true);
        $('span.collapsible-section').show();
      }
    });

    $('#layout-section-title').on('keyup', function () {

      var sectionTitle = $(this).val();
      var collapsibleInput = $('#layout-section-collapsible');
      $('.addSectionTitleText').text(sectionTitle);
      collapsibleInput.prop('disabled', !sectionTitle);
      $('#layout-section-start-collapsed').prop('disabled', !sectionTitle);
      if (!sectionTitle) {
        $('span.collapsible-section').hide();
      } else if (collapsibleInput.is(':checked')) {
        $('span.collapsible-section').show();
      }
    });

    $('#layout-section-show-borders').on('change', function () {

      if ($(this).is(':checked')) {
        $('.addSectionColumn').each(function () {

          $(this).css('border-color', '#aaa');
          $(this).css('border-style', 'solid');
        });
      } else {
        $('.addSectionColumn').each(function () {

          $(this).css('border-color', '#ddd');
          $(this).css('border-style', 'dashed');
        });
      }
    });

    $('#add-comments-link').click(function () {

      $("#comments-addBefore").val(addAboveItem);
      $("#add-comments").click();
      return false;
    });

    $('#calendar-link').click(function () {

      $("#calendar-addBefore").val(addAboveItem);
      $("#add-calendar").click();
      return false;
    });

    $('#add-student-link').click(function () {
      $("#add-student-addBefore").val(addAboveItem);
      $("#add-student").click();
      return false;
    });

    $('.change-resource-movie').click(function () {
      const deleteEl = document.querySelector("#movie-dialog");
      const modal = bootstrap.Modal.getInstance(deleteEl);
      modal && modal.hide();
      const mmEl = document.querySelector("#add-multimedia-dialog");
      const mmModal = bootstrap.Modal.getOrCreateInstance(mmEl);
      mmModal && mmModal.show();

      mm_test_reset();
      $("#mm-name-section").hide();
      $("#mm-prerequisite").prop('checked',$("#movie-prerequisites").prop('checked'));
      $("#addLink_label").text(msg("simplepage.addLink_label_add_or"));
      $("#mm-file-replace-group").show();
      $("#mm-item-id").val($("#movieEditId").val());
      $("#mm-is-mm").val('true');
      $("#mm-add-before").val(addAboveItem);
      $(".mm-file-group").remove();
      $('.add-another-file').hide();
      $('.add-file-div').removeClass('add-another-file-div');
      var href=$(this).attr("href");
      var editingCaption = (href.indexOf("&caption=true&")>0);
      $("#mm-is-caption").val(editingCaption ? "true" : "false");
      href=fixAddBefore(fixhref(href, $("#movieEditId").val(), "true", "false"));
      $("#mm-choose").attr("href",href);
      $("#add-multimedia-dialog").prev().children(".ui-dialog-title").text($(this).text());

      $(".mm-additional").show();
      $(".mm-additional-website").hide();
      $("#checkingwithhost").hide();
      $("#mm-loading").hide();
      if (editingCaption) {
        $(".mm-url-section").hide();
        $(".mm-prerequisite-section").hide();
      } else {
        $(".mm-prerequisite-section").show();
        $(".mm-url-section").show();
      }
      mmactive = true;
      $("#mm-error-container").hide();
      insist = false;
      // originally I thought it was confusing to start with the focus on some
      // specific item in the dialog. The problem is that JAWS won't announce
      // the dialog unless some item has focus
      //$('.edit-multimedia-input').blur();
      //$('.mm-additional-instructions').blur();
      return false;
    });

    $("#expert-movie-toggle").click(function () {

      $("#expert-movie-toggle-div").hide();
      $("#expert-movie").show();
      return false;
    });

    $("#subpage-button-color-group").hide();
    $("#subpage-button").click(function () {

      if ($(this).is(":checked")) {
        if ($("#subpage-btncolor-forced").is(":visible")) {
          //do nothing, color selector still needs to be hidden.
        } else {
          $("#subpage-button-color-group").show();
        }
      } else {
        $("#subpage-button-color-group").hide();
      }
    });

    $("#subpage-choose-button").tooltip();
    $("#subpage-choose-button").attr("title", $('#subpage-choose').html());
    $("#subpage-choose-button").click(function (e) {

      e.preventDefault();
      window.location = $('#subpage-choose').attr('href');
    });

    $("#item-button").click(function () {

      if ($(this).is(":checked")){
        if ($("#btncolor-forced").is(":visible")){
          //do nothing, color selector still needs hidden.
        } else{
          $("#buttonColorLabel").removeClass("disabled");
          $("#btncolor-selection").removeClass("disabled");
          $("#btncolor-selection").removeProp("disabled");
        }
        //remove button warning regardless
        $("#needbtn").hide();
      } else{
        //if its not checked, make sure "disabled" class is there.

        $("#buttonColorLabel").addClass("disabled");
        $("#btncolor-selection").addClass("disabled");
        $("#needbtn").show();
      }
    });

    $(".edit-link").click(function () {

      oldloc = $(this);
      $('div.item').removeClass('editInProgress');
      $('.edit-col').addClass('edit-colHidden');
      $(this).closest('div.item').addClass('editInProgress');
      $("#require-label2").hide();
      $("#item-required2").hide();
      $(".reqCheckbox").hide();
      $("#assignment-dropdown-selection").hide();
      $("#assignment-points").hide();
      $("#assignment-points").hide();
      $("#grouplist").hide();
      $("#editgroups").hide();
      $("#resource-group-inherited").hide();
      $("#assignment-points").val("");
      $("#assignment-points-label").hide();
      $("#change-assignment-p").hide();
      $("#change-quiz-p").hide();
      $("#change-forum-p").hide();
      $("#change-resource-p").hide();
      $("#change-blti-p").hide();
      $("#change-page-p").hide();
      $("#edit-item-object-p").hide();
      $("#edit-item-settings-p").hide();
      $(".pageItem").hide();
      $("#newwindowstuff").hide();
      $("#formatstuff").hide();
      $("#edit-height").hide();
      $("#pathdiv").hide();
      $("#editgroups").after($("#grouplist"));
      $("#stylingstuff").show();
      $("#prereqstuff").show();
      $("#visibility-header").show();

      var row = $(this).parent().parent().parent();
      var itemid = row.find(".current-item-id2").text();
      var toolNewPage = row.find(".lti-tool-newpage2").text();
      var contentNewPage = row.find(".lti-content-newpage2").text();

      // If data-original-name attr is present, use that instead
      let linkTextTag = row.find(".link-text");
      let linkText =  linkTextTag.attr("data-original-name");
      linkText = linkText || linkTextTag.text();

      $("#name").val(linkText);
      $("#description").val(row.find(".rowdescription").text());

      $("select[name=indent-level-selection]").val(row.find(".indentLevel").text());
      $("#customCssClass").val(row.find(".custom-css-class").text());

      var colorArray = ["none",
                        "ngray",
                        "nblack",
                        "nblue",
                        "nblue2",
                        "nred",
                        "nnavy",
                        "nnavy2",
                        "ngreen",
                        "norange",
                        "ngold",
                        "nteal",
                        "npurple"];
      var classList = row.find(".usebutton").attr('class').split(' ');

      var color = null;
      classList.forEach(function (source) {

        if (colorArray.indexOf(source) != -1 && color === null) {
          color = source;
        }
      });

      if (color !== null) {
        $("select[name=btncolor-selection]").val(color);
      } else {
        $("select[name=btncolor-selection]").val("none");
      }

      var forcedColorSection = row.parent().parent().parent().parent();
      var forcedColumnColor = row.parent().parent().parent();
      var forcedColor = (forcedColorSection.hasClass("hasColor")  && !forcedColumnColor.hasClass("noColor"));

      var prereq = row.find(".prerequisite-info").text();

      if (prereq === "true") {
        $("#item-prerequisites").prop("checked", true);
        $("#item-prerequisites").attr("defaultChecked", true);
      } else {
        $("#item-prerequisites").prop("checked", false);
      }

      const itemRequired = row.find(".required-info").text();
      if (itemRequired === "true") {
        $("#item-required").prop("checked", true);
        $("#item-required").attr("defaultChecked", true);
      } else {
        $("#item-required").prop("checked", false);
      }

      var samewindow = row.find(".item-samewindow").text();
      if (samewindow !== '') {
        if (samewindow === "true") {
            $("#item-newwindow").prop("checked", false);
        } else {
            $("#item-newwindow").prop("checked", true);
        }
        $("#newwindowstuff").show();
      }

      var format = row.find(".item-format").text();
      var req = row.find(".requirement-text").text();
      var type = row.find(".type").text();
                        requirementType = type;
      var editurl = row.find(".edit-url").text();
      var editsettingsurl = row.find(".edit-settings-url").text();

      const commonConditionEditor = document.getElementById("common-condition-editor");
      if (!commonConditionEditor) {
        console.error("common-condition-editor not found");
      }

      const commonConditionPicker = document.getElementById("common-condition-picker");
      if (!commonConditionPicker ) {
        console.error("common-condition-picker not found");
      }

      // Condition picker should be shown if one of this types apply
      const showCommonConditionPicker = [
        "1", // Resource
        "3", // Assignment
        "6", // Assessment
        "8", // Forum
        "b", // LTI Tool
        "page", // Subpage
      ].includes(type);

      if (showCommonConditionPicker) {
        // Show picker
        commonConditionPicker?.classList.remove("hidden");
        commonConditionPicker?.previousElementSibling.classList.remove("hidden");
        commonConditionPicker?.setAttribute("item-id", itemid);
      } else {
        // Hide picker
        commonConditionPicker?.classList.add("hidden");
        commonConditionPicker?.previousElementSibling.classList.add("hidden");
      }

      // Condition editor should be shown if one of this types apply
      const showCommonConditionEditor  = [
        "3", // Assignment
        "6", // Assessment
      ].includes(type);

      if (showCommonConditionEditor) {
        // Show editor
        commonConditionEditor?.classList.remove("hidden");
        commonConditionEditor?.previousElementSibling.classList.remove("hidden");
        commonConditionEditor?.setAttribute("item-id", itemid);
      } else {
        // Hide editor
        commonConditionEditor?.classList.add("hidden");
        commonConditionEditor?.previousElementSibling.classList.add("hidden");
      }

      if (type === 'page') {
        $(".pageItem").show();
        $(".reqCheckbox").hide();

        var sbpgreleasedate = row.find(".subpagereleasedate").text();
        localDatePicker({
          input: '#release_date2',
          useTime: 1,
          parseFormat: 'YYYY-MM-DD HH:mm:ss',
          val: sbpgreleasedate,
          ashidden: { iso8601: 'releaseDate2ISO8601' }
        });
        if (sbpgreleasedate === '') {  //if there is no release date set, don't check the box and se the date-related fields blank
          $("#page-releasedate2").prop('checked', false);
          $("#release_date2").val('');
          $("#releaseDate2ISO8601").val('');
        } else {
          $("#page-releasedate2").prop('checked', true);
          $("#releaseDate2ISO8601").val(sbpgreleasedate);
          $("#release_date2").val(moment(sbpgreleasedate).format('L LT'));
        }

        let pagenext = row.find(".page-next").text();
        if (pagenext === "true") {
          $("#item-next").prop("checked", true);
          $("#item-next").attr("defaultChecked", true);
        } else {
          $("#item-next").prop("checked", false);
        }

        let pagebutton = row.find(".page-button").text();
        if (pagebutton === "true") {
          $("#item-button").prop("checked", true);
          $("#item-button").attr("defaultChecked", true);
          if (!forcedColor) {
            $("#buttonColorLabel").removeClass("disabled");
            $("#btncolor-selection").removeClass("disabled");
            $("#btncolor-selection").removeProp("disabled");
            $("#btncolor-forced").hide();
          } else{
            $("#buttonColorLabel").addClass("disabled");
            $("#btncolor-selection").addClass("disabled");
            $("#btncolor-selection").prop("disabled", true);
            $("#btncolor-forced").show();
          }
          $("#needbtn").hide();
        } else {
          $("#item-button").prop("checked", false);
          $("#buttonColorLabel").addClass("disabled");
          $("#btncolor-selection").addClass("disabled");
          $("#btncolor-selection").prop("disabled", true);
          $("#needbtn").show();
          if (forcedColor){
            $("#btncolor-forced").show();
          }
        }

        let pagehidden = row.find(".page-hidden").text();
        if (pagehidden === "true") {
          $("#hide2").prop("checked", true).attr("defaultChecked", true);
        } else {
          $("#hide2").prop("checked", false);
        }

        $("#change-page-p").show();
        $("#change-page").attr("href", $("#change-page").attr("href").replace("itemId=-1", "itemId=" + itemid));

        let groups = row.find(".item-groups").text();
        let grouplist = $("#grouplist");
        if ($('#grouplist input').size() > 0) {
          $("#editgroups").show();
          $("#grouplist").show();
          if (groups !== null) {
            checkgroups(grouplist, groups);
          }
        }

      } else if (type !== '' && type !== '1') { // empty type or type 1 handled in else
        var groups = row.find(".item-groups").text();
        var grouplist = $("#grouplist");
        if ($('#grouplist input').size() > 0) {
            $("#editgroups").show();
            $("#grouplist").show();
            if (groups !== null) {
              checkgroups(grouplist, groups);
            }
        }

        if (type === '6') {
          $("#change-quiz-p").show();
          $("#change-quiz").attr("href",
                $("#change-quiz").attr("href").replace("itemId=-1", "itemId=" + itemid));
          $("#require-label").text(msg("simplepage.require_submit_assessment"));
          $("#edit-item-object-p").show();
          $("#edit-item-object").attr("href",
            $("#edit-item-object").attr("href").replace(/(itemId=).*?(&)/, '$1' + itemid + '$2'));
          $("#edit-item-text").text(msg("simplepage.edit_quiz"));
          $("#edit-item-settings-p").show();
          $("#edit-item-settings").attr("href",
            $("#edit-item-settings").attr("href").replace(/(itemId=).*?(&)/, '$1' + itemid + '$2'));
          $("#edit-item-settings-text").text(msg("simplepage.edit_quiz_settings"));

        } else if (type === '8'){
          $("#change-forum-p").show();
          $("#change-forum").attr("href",
                $("#change-forum").attr("href").replace("itemId=-1", "itemId=" + itemid));
          $("#require-label").text(msg("simplepage.require_submit_forum"));
          $("#edit-item-object-p").show();
          $("#edit-item-object").attr("href",
            $("#edit-item-object").attr("href").replace(/(itemId=).*?(&)/, '$1' + itemid + '$2'));
          $("#edit-item-text").text(msg("simplepage.edit_topic"));

        } else if (type === 'b'){
          var height = row.find(".item-height").text();
          $("#edit-height-value").val(height);
          $("#edit-height").show();       
          $("#change-blti-p").show();
          $("#change-blti").attr("href",
                $("#change-blti").attr("href").replace("itemId=-1", "itemId=" + itemid));
          $("#require-label").text(msg("simplepage.require_submit_blti"));
          if (format != 'window' && format != 'page'  && format != 'inline' ) format = (contentNewPage == 1) ? 'window' : 'page';
          $(".format").prop("checked", false);
          if ( toolNewPage == '1' ) {  // Always launch in popup
            $("#format-window").prop("checked", true);
            $("#formatstuff").hide();
          } else if ( toolNewPage == '0' ) {  // Never launch in popup
            $("#format-window").prop("checked", false);
            $("#format-window").hide();
            $('label[for="format-window"]').each(function() {
                $(this).hide();
            });
            if ( format == "window" ) format = "page";
            $("#format-" + format).prop("checked", true);
            $("#formatstuff").show();
          } else { // Normal delegate to the tool
            $("#format-" + format).prop("checked", true);
            $("#formatstuff").show();
            $("#format-window").show();
          }

          $("#edit-item-object-p").show();
          fixitemshows();

        } else {
          $("#change-assignment-p").show();
          $("#change-assignment").attr("href",
               $("#change-assignment").attr("href").replace("itemId=-1", "itemId=" + itemid));
          $("#require-label").text(msg("simplepage.require_submit_assignment"));
          $("#edit-item-object-p").show();
          $("#edit-item-object").attr("href",
            $("#edit-item-object").attr("href").replace(/(itemId=).*?(&)/, '$1' + itemid + '$2'));
          $("#edit-item-text").text(msg("simplepage.edit_assignment"));
        }

        if (type === '3' || type === '6') {
          // Points or Assessment

          $("#require-label2").show();
          $("#require-label2").html(msg("simplepage.require_receive") + " ");
          if (type === '3') {
            $("#assignment-points-label").text(" " + msg("simplepage.require_points_assignment"));
          } else if (type === '6') {
            $("#assignment-points-label").text(" " + msg("simplepage.require_points_assessment"));
          }

          $("#item-required2").show();
          $(".reqCheckbox").show();

          $("#assignment-points").show();
          $("#assignment-points-label").show();

          if (req === "false") {
            $("#item-required2").prop("checked", false);
          } else {
            // Need both of these statements, because of a stupid
            // little IE bug.
            $("#item-required2").prop("checked", true);
            $("#item-required2").attr("defaultChecked", true);

            $("#assignment-points").val(req);
          }
        } else if (type === '4') {
          // Pass / Fail
          $(".reqCheckbox").show();
          $("#require-label2").show();
          $("#require-label2").html(msg("simplepage.require_pass_assignment"));
          $("#item-required2").show();

          if (req === "true") {
            // Need both of these statements, because of a stupid
            // little IE bug.
            $("#item-required2").prop("checked", true);
            $("#item-required2").attr("defaultChecked", true);
          } else {
            $("#item-required2").prop("checked", false);
          }
        } else if (type === '2') {
          // Letter Grade
          $(".reqCheckbox").show();
          $("#require-label2").show();
          $("#require-label2").text(msg("simplepage.require_atleast"));
          $("#item-required2").show();
          $("#assignment-dropdown-selection").show();

          if (req === "false") {
            $("#item-required2").prop("checked", false);
          } else {
            // Need both of these statements, because of a stupid
            // little IE bug.
            $("#item-required2").prop("checked", true);
            $("#item-required2").attr("defaultChecked", true);

            $("#assignment-dropdown-selection").val(req);
          }
        } else if (type === '1') {
          // Ungraded
          // Nothing more that we need to do
        } else if (type === '5') {
          // Checkmark
                    $(".reqCheckbox").show();
          $("#require-label2").show();
          $("#require-label2").text(msg("simplepage.require_checkmark"));
          $("#item-required2").show();

          if (req === "true") {
            // Need both of these statements, because of a stupid
            // little IE bug.
            $("#item-required2").prop("checked", true);
            $("#item-required2").attr("defaultChecked", true);
          } else {
            $("#item-required2").prop("checked", false);
          }
        }
      } else {
        // resource
        $("#change-resource-p").show();
        $("#change-resource").attr("href",
            $("#change-resource").attr("href").replace("pageItemId=-1", "pageItemId=" + itemid));
        $("#change-resource").attr("target", "_blank");
        var groups = row.find(".item-groups").text();
        var grouplist = $("#grouplist");
        if (groups === "--inherited--") {
          $("#resource-group-inherited").show();
        } else if ($('#grouplist input').size() > 0) {
          $("#editgroups").show();
          $("#grouplist").show();
          $("#select-resource-group").show();
          if (groups !== null) {
            checkgroups(grouplist, groups);
          }
        }
        row.find(".path-url").attr("href", row.find(".itemlink").attr('href'));
        var path = row.find(".item-path").html();
        if (path !==  null && path !== '') {
          $("#path").html(path);
          $("#pathdiv").show();
        }
      }

      setUpRequirements();
      $("#item-id").val(row.find(".current-item-id2").text());
      $("#edit-item-error-container").hide();
      $("#grouplist").hide();
      return false;
    });

    document.getElementById("add-twitter-dialog")?.addEventListener("shown.bs.modal", () => {

      $('#twitter-error-container').hide();
      $("#twitterEditId").val("-1");
      $("#twitter-addBefore").val(addAboveItem);
      $("#twitter-username").val("");
      $("#widget-height").val("");
      $('#numberDropdown-selection').val("5");
      return false;
    });

    $("#editgroups").click(function () {
      $("#editgroups").hide();
      $("#grouplist").show();
    });

    $(".format").change(function () {
      fixitemshows();
    });

    $('#change-resource').click(function () {

      const deleteEl = document.querySelector("#edit-item-dialog");
      const modal = bootstrap.Modal.getInstance(deleteEl);
      modal && modal.hide();
      const mmEl = document.querySelector("#add-multimedia-dialog");
      const mmModal = bootstrap.Modal.getOrCreateInstance(mmEl);
      mmModal && mmModal.show();

      mm_test_reset();
      $("#mm-name-section").show();
      $("#mm-name").val($("#name").val());
      $("#mm-prerequisite").prop('checked',$("#item-prerequisites").prop('checked'));
      $("#addLink_label").text(msg("simplepage.addLink_label_add"));
      $("#mm-file-replace-group").show();
      $("#mm-item-id").val($("#item-id").val());
      $("#mm-is-mm").val('false');
      $("#mm-add-before").val(addAboveItem);
      $(".mm-file-group").remove();
      $('.add-another-file').hide();
      $('.add-file-div').removeClass('add-another-file-div');
      var href=$("#mm-choose").attr("href");
      href=fixAddBefore(fixhref(href, $("#item-id").val(), "false", "false"));
      $("#mm-choose").attr("href",href);
      $("#add-multimedia-dialog").prev().children(".ui-dialog-title").text($(this).text());
      $(".mm-additional").show();
      $(".mm-additional-website").hide();
      $(".mm-url-section").show();
      $(".mm-prerequisite-section").show();
      $("#checkingwithhost").hide();
      $("#mm-loading").hide();
      mmactive = true;
      $("#mm-error-container").hide();
      insist = false;
      //$('.edit-multimedia-input').blur();
      //$('.edit-multimedia-input').blur();
      return false;
    });

    $(".add-multimedia").click(function () {

      oldloc = $(this);

      mm_test_reset();
      $("#mm-name-section").hide();
      $("#mm-name").val('');
      $("#mm-prerequisite").prop('checked',false);
      $("#addLink_label").text(msg("simplepage.addLink_label_add_or"));

      $("#mm-item-id").val(-1);
      $("#mm-is-mm").val('true');
      $("#mm-is-website").val('false');
      $("#mm-add-before").val(addAboveItem);
      $("#mm-is-caption").val('false');
      $(".mm-file-group").remove();
      $('.add-another-file').hide();
      $('.add-file-div').removeClass('add-another-file-div');
      var href=$("#mm-choose").attr("href");
      href=fixAddBefore(fixhref(href, "-1", "true", "false"));
      $("#mm-choose").attr("href",href);
      $("#add-multimedia-dialog").prev().children(".ui-dialog-title").text($(this).text());
      $(".mm-additional").show();
      $(".mm-additional-website").hide();
      $(".mm-url-section").show();
      $(".mm-prerequisite-section").show();
      $("#checkingwithhost").hide();
      $("#mm-loading").hide();
      mmactive = true;
      $("#mm-error-container").hide();
      insist = false;
      //$('.edit-multimedia-input').blur();
      //$('.mm-additional-instructions').blur();
      return false;
    });

    $(".add-resource").click(function () {

      oldloc = $(this);
      $('#mm-name-section').addClass('fileTitles');
      $("#mm-name-section").show();
      $("#mm-name").val('');
      $("#mm-prerequisite").prop('checked',false);
      if ($(this).hasClass("add-at-end")) {
          addAboveItem = '';
      }
      mm_test_reset();
      $("#addLink_label").text(msg("simplepage.addLink_label_add"));

      $("#mm-item-id").val(-1);
      $("#mm-is-mm").val('false');
      $("#mm-add-before").val(addAboveItem);
      $("#mm-is-website").val('false');
      $("#mm-is-caption").val('false');
      $(".mm-file-group").remove();
      $('.add-another-file').hide();
      $('.add-file-div').removeClass('add-another-file-div');
      var href=$("#mm-choose").attr("href");
      href=fixAddBefore(fixhref(href,"-1","false","false"));
      $("#mm-choose").attr("href",href);
      $("#add-multimedia-dialog").prev().children(".ui-dialog-title").text($(this).text());
      $(".mm-additional").hide();
      $(".mm-additional-website").hide();
      $(".mm-url-section").show();
      $(".mm-prerequisite-section").show();
      $("#checkingwithhost").hide();
      $("#mm-loading").hide();
      mmactive = true;
      $("#mm-error-container").hide();
      insist = false;
      //$('.edit-multimedia-input').blur();
      return false;
    });

    $(".add-website").click(function () {

      oldloc = $(".dropdown a");
      mm_test_reset();
      $('#mm-name-section').addClass('fileTitles');
      $("#mm-name-section").show();
      $("#mm-name").val('');
      $("#mm-prerequisite").prop('checked',false);
      $("#addLink_label").text(msg("simplepage.addLink_label_add"));

      $("#mm-item-id").val(-1);
      $("#mm-is-mm").val('false');
      $("#mm-is-website").val('true');
      $("#mm-add-before").val(addAboveItem);
      $("#mm-is-caption").val('false');
      $(".mm-file-group").remove();
      $('.add-another-file').hide();
      $('.add-file-div').removeClass('add-another-file-div');
      var href=$("#mm-choose").attr("href");
      href=fixAddBefore(fixhref(href, "-1","false","true"));
      $("#mm-choose").attr("href",href);
      $("#add-multimedia-dialog").prev().children(".ui-dialog-title").text($(this).text());
      $(".mm-additional").hide();
      $(".mm-additional-website").show();
      $(".mm-url-section").hide();
      $(".mm-prerequisite-section").show();
      $("#checkingwithhost").hide();
      $("#mm-loading").hide();
      mmactive = true;
      $("#mm-error-container").hide();
      insist = false;
      //$('.edit-multimedia-input').blur();
      //$('.mm-additional-website-instructions').blur();
      return false;
    });

    $(".multimedia-edit").click(function () {

      oldloc = $(this);
      mm_test_reset();
      $('div.item').removeClass('editInProgress');
      $("#expert-multimedia").hide();
      $("#expert-multimedia-toggle-div").show();
      $("#editgroups-mm").after($("#grouplist"));
      $("#grouplist").hide();
      $("#editgroups-mm").hide();

      var row = $(this).parent().parent().parent();
      var itemId = row.find(".mm-itemid").text();

      var itemPath = row.find(".item-path");
      if (itemPath !== null && itemPath.size() > 0) {
        row.find(".path-url").attr("href", row.find(".multimedia").attr("src"));
        $("#mm-path").html(itemPath.html());
        $(".mm-path").show();
      } else {
        $(".mm-path").hide();
      }

      const groups = row.find(".item-groups").text();
      const grouplist = $("#grouplist");
      if ($('#grouplist input').size() > 0) {
        $("#editgroups-mm").show();
        $("#grouplist").show();
        if (groups !== null) {
          checkgroups(grouplist, groups);
        }
      }

      if (row.find(".prerequisite-info").text() === 'true') {
        $('#multi-prerequisite').prop('checked', true);
      } else {
        $('#multi-prerequisite').prop('checked', false);
      }

      const multimediaConditionPicker = document.getElementById("multimedia-condition-picker");
      multimediaConditionPicker.setAttribute("item-id", itemId);

      $("#height").val(row.find(".mm-height").text());
      $("#width").val(row.find(".mm-width").text());
      if (row.find(".mm-embedtype").text() === '1') {
          // embed code, can't edit size
          $('#width-p').hide();
          $('#height-p').hide();
      } else {
          $('#width-p').show();
          $('#height-p').show();
      }
      $("#description2").val(row.find(".description").text());
      $("#mimetype").val(row.find(".mm-type").text());
      var tagname = row.find(".multimedia").get(0).nodeName.toLowerCase();
      if (tagname === "img") {
          $("#alt").val(row.find(".multimedia").attr("alt"));
          $("#alt").parent().show();
          // $("#tagnameused").html(msg("simplepage.tag_img"));
          $("#iframe-note").hide();
          //            } else {
          //          $("#alt").parent().hide();
          //          $("#tagnameused").html(msg("simplepage.tag_iframe"));
          //          $("#iframe-note").show();
          //}
      } else if (tagname === "iframe") {
          $("#alt").parent().hide();
          // $("#tagnameused").html(msg("simplepage.tag_iframe"));
          $("#iframe-note").show();
      } else {
          $("#alt").parent().hide();
          $("#iframe-note").hide();
      }

      $("#change-resource-mm").attr("href",
           $("#change-resource-mm").attr("href").replace("pageItemId=-1",
           "pageItemId=" + row.find(".mm-itemid").text()));
      $("#multimedia-item-id").val(row.find(".mm-itemid").text());
      $('.edit-col').addClass('edit-colHidden');
      $(this).closest('div.item').addClass('editInProgress');

      $("#grouplist").hide();
      return false;
    });

    $("#editgroups-mm").click(function () {

      $("#editgroups-mm").hide();
      $("#grouplist").show();
    });

    $('#change-resource-mm').click(function () {
      const deleteEl = document.querySelector("#edit-multimedia-dialog");
      const modal = bootstrap.Modal.getInstance(deleteEl);
      modal && modal.hide();
      const mmEl = document.querySelector("#add-multimedia-dialog");
      const mmModal = bootstrap.Modal.getOrCreateInstance(mmEl);
      mmModal && mmModal.show();

      mm_test_reset();
      $("#mm-name-section").hide();
      $("#mm-prerequisite").prop('checked',$("#multi-prerequisite").prop('checked'));
      $("#addLink_label").text(msg("simplepage.addLink_label_add_or"));
      $("#mm-file-replace-group").show();
      $("#mm-item-id").val($("#multimedia-item-id").val());
      $("#mm-is-mm").val('true');
      $("#mm-add-before").val(addAboveItem);
      $(".mm-file-group").remove();
      $('.add-another-file').hide();
      $('.add-file-div').removeClass('add-another-file-div');
      var href=$("#mm-choose").attr("href");
      href=fixAddBefore(fixhref(href, $("#multimedia-item-id").val(), true, false));
      $("#add-multimedia-dialog").prev().children(".ui-dialog-title").text($(this).text());
      $("#mm-choose").attr("href",href);
      $(".mm-additional").show();
      $(".mm-additional-website").hide();
      $(".mm-url-section").show();
      $(".mm-prerequisite-section").show();
      $("#checkingwithhost").hide();
      $("#mm-loading").hide();
      mmactive = true;
      $("#mm-error-container").hide();
      insist = false;
      return false;
    });

    $("#item-required").click(function () {
      setUpRequirements();
    });

    $("#item-required2").click(function () {
      setUpRequirements();
    });

    function delete_confirm(event, message) {

      const deleteEl = document.querySelector("#delete-confirm");
      const modal = bootstrap.Modal.getOrCreateInstance(deleteEl)

      if (insist) {
        insist = false;
        modal.hide();
        return true;
      }
      insist = false;
      $("#delete-confirm-message").text(message);
      modal.show();
      return false;
    };

    $('#delete-comments-item').click(function (event) {
      // edit row is set by edit-comments. We're current in the dialog. need
      // to look in the actual page row.
      if (editrow.find('.commentDiv').size() === 0) {
        return true;
      }
      delbutton = $('#delete-comments-item');
      return delete_confirm(event, msg("simplepage.deletecommentsubmissionexist"));
    });

    $('.add-link').attr('title', msg("simplepage.add-above"));

    $('.del-item-link').attr('title', msg("simplepage.delete-item"));

    $('.del-item-link').click(function (event) {

      // edit row is set by edit-comments. We're current in the dialog. need
      // to look in the actual page row.
      $("#delete-item-itemid").val($(this).parents("div.item").find("span.itemid").text());
      delbutton = $('#delete-item-button');
      return delete_confirm(event, msg("simplepage.delete_page_confirm"));
    });

    $('#delete-student-item').click(function (event) {
      // edit row is set by edit-comments. We're current in the dialog. need
      // to look in the actual page row.
      if (editrow.find('.studentLink').size() === 0) {
        return true;
      }
      delbutton = $('#delete-student-item');
      return delete_confirm(event, msg("simplepage.deletestudentsubmissionexist"));
    });

    $('body').bind('dialogopen', function (event) {
      hideMultimedia();
    });

    $("#cssDropdown-selection").children(":contains(---" + msg("simplepage.site") + "---)").prop("disabled", true);
    $("#cssDropdown-selection").children(":contains(---" + msg("simplepage.system") + "---)").prop("disabled", true);
    $("#cssDropdown-selection").children(":contains(----------)").prop("disabled", true);

    $("#studentPointsBox").val($("#studentPointsBox").parent().children(".pointsSpan").text());

    $("#studentPointsBox").on('change', function () {

      var img = $(this).parent().children("img");
      img.attr("src", getStrippedImgSrc(img.attr("id")) + "no-status.png");
      $(this).addClass("unsubmitted");
    });

    $("#studentPointsBox").keyup(function (event){

      if (event.keyCode === 13) {
          submitgrading($(this));
          return false;
      }
    });

    $(".grading-nextprev").click(function (event){

      // if unsubmitted grade, submit it before going to new page
      if ($("#studentPointsBox").hasClass("unsubmitted")) {
          submitgrading($(this));
          // set hook to do follow the link when the grade update returns
          setGradingReturnHook($(this).attr('href'));
          return false;
      }
      return true;
    });

    $("#submit-grading").click(function () {

      submitgrading($(this));
      return false;
    });

    // can't get RSF to generate a simple #... URL, so output it as rel attribute and fix up
    $("#directurl").attr('href', $("#directurl").attr('rel'));

  } // Closes admin if statement

  $(".showPollGraph").click(function (e) {

    e.preventDefault();
    const pollGraph = $(this).parents(".questionDiv").find(".questionPollGraph");

    if ($(this).attr("value") === $(this).parents(".questionDiv").find(".show-poll").text()) {
      pollGraph.empty();
      var pollData = [];
      pollGraph.parent().find(".questionPollData").each(function (index) {

        const text = $(this).find(".questionPollText").text();
        const count = $(this).find(".questionPollNumber").text();
        const legend = $(this).find(".questionPollLegend").text();

        pollData[index] = [parseInt(count), text, '#000000', legend];
      });

      pollGraph.show();
      pollGraph.jqBarGraph({data: pollData, height:100, speed:1});

      $(this).attr("value",($(this).parents(".questionDiv").find(".hide-poll").text()));
    } else {
      pollGraph.hide();
      pollGraph.empty();

      $(this).attr("value",($(this).parents(".questionDiv").find(".show-poll").text()));
    }
  });

  $('.add-break-section').click(function (e) {

    e.preventDefault();
    var newitem = addBreak(addAboveItem, 'section');
    // addAboveLI is LI from which add was triggered
    // following LI's if any
    var tail_lis = addAboveLI.nextAll();
    // current section DIV
    var tail_uls = addAboveLI.parent().nextAll();
    var tail_cols = addAboveLI.parent().parent().nextAll();
    var section = addAboveLI.parent().parent().parent();
    var sectionId = "sectionid" + (nextid++);

    const joinItemsMsg = msg('simplepage.join-items');
    const breakHereMsg = msg('simplepage.break-here');
    const columnOpenMsg = msg('simplepage.columnopen');
    const newHtml = `
    <div>
      <h3 class="sectionHeader skip">
        <span aria-hidden="true" class="collapseIcon fa-caret-down"></span>
        <span class="sectionHeaderText"></span>
        <span class="toggleCollapse">${msg('simplepage.clickToCollapse')}</span>
      </h3>
      <div class="section">
        <div class="column">
          <div class="editsection">
            <span class="sectionedit">
              <h3 class="lb-offscreen">${breakHereMsg}</h3>
              <button type="button" data-merge-id="${newitem}" aria-label="${joinItemsMsg}" title="${joinItemsMsg}" class="section-merge-link">
                <span aria-hidden="true" class="fa-compress fa-edit-icon sectioneditfont"></span>
              </button>
            </span>
            <span class="sectionedit sectionedit2">
              <a href="#" title="${columnOpenMsg}" class="columnopen" style="text-decoration: none;" data-bs-toggle="modal" data-bs-target="#column-dialog" aria-controls="column-dialog" aria-expanded="false">
                <span aria-hidden="true" class="fa-cog fa-edit-icon sectioneditfont"></span>
              </a>
            </span>
          </div>
          <span class="sectionedit addbottom">
            <a href="#" title="Add new item at bottom of this column" class="add-bottom">
              <span aria-hidden="true" class="fa-plus fa-edit-icon plus-edit-icon"></span>
            </a>
          </span>
          <div border="0" role="list" style="z-index: 1;" class="indent mainList">
            <div class="breakitem breaksection" role="listitem">
              <span style="display:none" class="itemid">${newitem}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    `;
    section.prev('.sectionHeader').parent().after(newHtml);
	  
    // now go to new section
    section = section.prev('.sectionHeader').parent().next().children(".section");

    section.prev('.sectionHeader').on("click", function () {

      var section = $(this).next("div.section");
      if (section.hasClass("collapsible")) {
        section.slideToggle();
        setCollapsedStatus($(this), null);
      }
    });

    // and move current item and following into the first col of the new section
    if (addAboveItem > 0) {
      section.find("div.mainList").append(addAboveLI, tail_lis);
    }
    section.find(".column").append(tail_uls);
    section.append(tail_cols);

    // need trigger on the A we just added
    section.find('.section-merge-link').click(sectionMergeLink);
    section.find('.columnopen').click(columnOpenLink);
    section.find('.add-bottom').click(buttonAddContentSectionBottom);
    fixupColAttrs();
    fixupHeights();
  });

  $('.add-break-column').click(function (e) {

    e.preventDefault();
    var newitem = addBreak(addAboveItem, 'column');

    // addAboveLI is LI from which add was triggered
    // following LI's if any
    var tail_lis = addAboveLI.nextAll();

    // current section DIV
    var tail_uls = addAboveLI.parent().nextAll();
    var column = addAboveLI.parent().parent();
    const joinItemsMsg = msg('simplepage.join-items');
    const breakHereMsg = msg('simplepage.break-here');
    const columnOpenMsg = msg('simplepage.columnopen');
    const newHtml = `
    <div class="column">
      <div class="editsection">
        <span class="sectionedit">
          <h3 class="lb-offscreen">${breakHereMsg}</h3>
          <button type="button" data-merge-id="${newitem}" aria-label="${joinItemsMsg}" title="${joinItemsMsg}" class="column-merge-link">
            <span aria-hidden="true" class="fa-compress fa-edit-icon sectioneditfont"></span>
          </button>
        </span>
        <span class="sectionedit sectionedit2">
          <a href="#" title="${columnOpenMsg}" class="columnopen" style="text-decoration: none;" data-bs-toggle="modal" data-bs-target="#column-dialog" aria-controls="column-dialog" aria-expanded="false">
            <span aria-hidden="true" class="fa-cog fa-edit-icon sectioneditfont"></span>
          </a>
        </span>
      </div>
      <span class="sectionedit addbottom">
        <a href="#" title="Add new item at bottom of this column" class="add-bottom">
          <span aria-hidden="true" class="fa-plus fa-edit-icon plus-edit-icon"></span>
        </a>
      </span>
      <div border="0" role="list" style="z-index: 1;" class="indent mainList">
        <div class="breakitem breakcolumn" role="listcolumn">
          <span style="display:none" class="itemid">${newitem}</span>
        </div>
      </div>
    </div>
    `;
    column.after(newHtml);
	  
    // now go to new section
    column = column.next();
    // and move current item and following into the first col of the new section
    if (addAboveItem > 0) {
      column.find("div.mainList").append(addAboveLI, tail_lis);
    }
    column.find(".column").append(tail_uls);
    // need trigger on the A we just added
    column.find('.column-merge-link').click(columnMergeLink);
    column.find('.columnopen').click(columnOpenLink);
    column.find('.add-bottom').click(buttonAddContentSectionBottom);
    fixupColAttrs();
    fixupHeights();
  });

  $('.section-merge-link').click(sectionMergeLink);
  $('.column-merge-link').click(columnMergeLink);

  function sectionMergeLink(e) {

    e.preventDefault();
    deleteBreak($(this).data('merge-id'));
    var thisCol = $(this).parents('.column');
    // in first column all li's except the break
    var tail_lis = thisCol.find('.mainList').children().first().nextAll();
    var tail_uls = thisCol.find('.mainList').nextAll();
    var tail_cols = thisCol.nextAll();

    // current section DIV
    var section = thisCol.parent();
    var sectionHeader = section.prev('.sectionHeader');
    // append rest of ul last one in prevous section
    sectionHeader.parent().prev().find('div.mainList').last().append(tail_lis);
    sectionHeader.parent().prev().find('.column').last().append(tail_uls);
    sectionHeader.parent().prev().append(tail_cols);
    // nothing should be left in current section. kill it
    section.remove();
    sectionHeader.remove();
    fixupColAttrs();
    fixupHeights();

    if (!$('.collapsibleSectionHeader').length) {
      $('#expandCollapseButtons').hide();
    }

  };

  function columnMergeLink(e) {

    e.preventDefault();
    deleteBreak($(this).data("merge-id"));
    var thisCol = $(this).parents('.column');
    // all li's expect break
    var tail_lis = thisCol.find('.mainList').children().first().nextAll();
    var tail_uls = thisCol.find('.mainList').nextAll();

    // append rest of ul last one in prevous column;
    thisCol.prev().find('div.mainList').last().append(tail_lis);
    thisCol.prev().append(tail_uls);
    // nothing should be left in current section. kill it
    thisCol.remove();
    fixupColAttrs();
    fixupHeights();
  };

  $('.columnopen').click(columnOpenLink);
  function columnOpenLink(e) {

    var itemid = $(this).closest('.editsection').find('.column-merge-link,.section-merge-link').data("merge-id");
    var sectionSettings = $('#sectionSettings');
    var columnLabel = $('#columnColorLabel');
    var sectionLabel = $('#sectionColorLabel');
    var columnStyling = $('#column-styling-header');
    var sectionStyling = $('#section-styling-header');
    if ($(this).closest('.editsection').find('.section-merge-link').length > 0) {
      sectionSettings.show();
      sectionLabel.show();
      sectionStyling.show();
      columnLabel.hide();
      columnStyling.hide();
      $('#isSection').val('true');
    } else {
      sectionSettings.hide();
      sectionLabel.hide();
      sectionStyling.hide();
      columnLabel.show();
      columnStyling.show();
      $('#isSection').val('false');
    }
    $('.currentlyediting').removeClass('currentlyediting');
    var col = $(this).closest('.column');
    col.addClass('currentlyediting');
    $('#columndouble').prop('checked', col.hasClass('double'));
    $('#columnsplit').prop('checked', col.hasClass('split'));
    $('#columnitem').val(itemid);
    $('#columnbackground > option').each(function () {

      var checkClass = 'col' + $(this).val();
      var hasColClass = col.hasClass(checkClass);
      if (hasColClass) {
        $(this).prop('selected', true);
        $('#show-borders').prop('checked', true);
      } else if (col.hasClass(checkClass + '-trans')) {
        $(this).prop('selected', true);
        $('#show-borders').prop('checked', false);
      } else if (checkClass === 'colnone' && col.hasClass('coltrans')){
        $(this).prop('selected', true);
        $('#show-borders').prop('checked', false);
      } else if (checkClass === 'colnone' && !col.hasClass('coltrans')) {
        $(this).prop('selected', true);
        $('#show-borders').prop('checked', true);
      } else {
        $(this).prop('selected', false);
      }
    });
    $('#collapsible').prop('checked', col.parent('.section').hasClass('collapsible'));
    $('#defaultClosed').prop('checked', col.parent('.section').hasClass('defaultClosed'));
    if (col.hasClass('noColor')) {
      $('#force-button-color').prop('checked', false);
    } else {
      $('#force-button-color').prop('checked', col.parent('.section').hasClass("hasColor"));
    }

    $('#sectionTitle').val(col.parent('.section').prev().find('.sectionHeaderText').text());
    if (!$("#sectionTitle").val()) {
      $("#collapsible").prop('checked', false);
      $("#collapsible").prop("disabled", true);
    } else {
      $("#collapsible").prop("disabled", false);
    }
    if (!$("#collapsible").prop('checked')) {
      $("#defaultClosed").prop('checked', false);
      $("#defaultClosedSpan").hide();
    } else {
      $("#defaultClosedSpan").show();
    }
    return false;
  }

  $('#column-submit').click(function () {

    var itemid = $('#columnitem').val();
    var isSection = $('#isSection').val() === 'true';
    var width = $('#columndouble').prop('checked') ? 2 : 1;
    var split = $('#columnsplit').prop('checked') ? 2 : 1;
    var col =  $('.currentlyediting');
    var section = col.parent('.section');
    var header = section.prev('.sectionHeader');
    var color_index = $('#columnbackground')[0].selectedIndex;
    var color = '';
    var forceBtnColor = $("#force-button-color").prop('checked');
    if (color_index !== 0) {
      color = $('#columnbackground').val();
    }
    var collapsible = $('#collapsible').prop('checked') ? 1 : 0;
    var defaultClosed = $('#defaultClosed').prop('checked') ? 1 : 0;
    var sectionTitle = $('#sectionTitle').val();
    var showBorders = $('#show-borders').prop('checked');
    if (!showBorders) {
      if (color === '') {
        color = 'trans';
      } else {
        color = color + '-trans';
      }
    }
    setColumnProperties(itemid, width, split, color, forceBtnColor);
    if (width === 2) {
      col.addClass('double');
    } else {
      col.removeClass('double');
    }
    if (split === 2) {
      col.addClass('split');
    } else {
      col.removeClass('split');
    }
    col.removeClass('coltrans colgray colred colblue colgreen colyellow colngray colngray-trans colnblack colnblack-trans colnblue colnblue-trans' +
      ' colnblue2 colnblue2-trans colnred colnred-trans colnnavy colnnavy-trans colnnavy2 colnnavy2-trans colngreen colngreen-trans' +
      ' colgray-trans colred-trans colblue-trans colgreen-trans colyellow-trans colnorange colnorange-trans colngold colngold-trans colnteal colnteal-trans colnpurple colnpurple-trans');
    if (color !== '') {
        col.addClass('col' + color);
    }

    if (isSection) {
      header.removeClass('coltrans-header colgray-header colred-header colblue-header colgreen-header colyellow-header colngray-header colngray-trans-header colnblack-header colnblack-trans-header colnblue-header colnblue-trans-header' +
          ' colnblue2-header colnblue2-trans-header colnred-header colnred-trans-header colnnavy-header colnnavy-trans-header colnnavy2-header colnnavy2-trans-header colngreen-header colngreen-trans-header' +
          ' colgray-trans-header colred-trans-header colblue-trans-header colgreen-trans-header colyellow-trans-header colnorange-header colnorange-trans-header colngold-header colngold-trans-header colnteal-header colnteal-trans-header colnpurple-header colnpurple-trans-header');
      if (color !== '') {
        header.addClass('col' + color + '-header');
      }
    }

    fixupColAttrs();
    fixupHeights();
    setSectionCollapsible(itemid, collapsible, sectionTitle, defaultClosed);
    header.find('.sectionHeaderText').text(sectionTitle);
    if (sectionTitle === '') {
      header.addClass('skip');
    } else {
      header.removeClass('skip');
    }
    if (collapsible) {
      section.addClass('collapsible');
      header.addClass('collapsibleSectionHeader');
      var sectionId = section.attr('id');
      if (typeof sectionId === 'undefined' || sectionId === null || sectionId === '') {
        sectionId = 'sectionid' + (nextid++);
        section.attr('id', sectionId);
      }
      header.attr('aria-controls', sectionId);
    } else {
      section.removeClass('collapsible');
      header.removeClass('collapsibleSectionHeader');
      header.removeAttr('aria-controls');
      header.removeAttr('aria-expanded');
    }
    if (defaultClosed) {
      section.addClass('defaultClosed');
      setCollapsedStatus(header, true);
    } else {
      section.removeClass('defaultClosed');
      setCollapsedStatus(header, false);
    }
    if ($('.collapsibleSectionHeader').length) {
      $('#expandCollapseButtons').show();
    } else {
      $('#expandCollapseButtons').hide();
    }
    $document.reload();
    return false;
  });

  // don't do this twice. if portal is loaded portal will do it
        if (typeof portal === 'undefined')
  $('a.tool-directurl').cluetip({
    local: true,
    arrows: true,
    cluetipClass: 'jtip',
    sticky: true,
    cursor: 'pointer',
    activation: 'click',
    closePosition: 'title',
    closeText: '<span class="bi bi-x" aria-hidden="true"></span>'
  });

  function submitgrading(item) {

    var img = item.parent().children("img");

    item.parent().children("#studentPointsBox").removeClass("unsubmitted");
    img.attr("src", getStrippedImgSrc(img.attr("id")) + "loading.gif");

    $(".idField").val(item.parent().children(".uuidBox").text()).change();
    $(".jsIdField").val(img.attr("id")).change();
    $(".typeField").val("student");

    // This one triggers the update
    $(".pointsField").val(item.parent().children("#studentPointsBox").val()).change();

    return false;
  };

  if (!(navigator.userAgent.indexOf("Firefox/2.") > 0)) {
    $('.usebutton').button({text:true});
  } else {
    // fake it; can't seem to get rid of underline though
    $('.usebutton').css('border', '1px solid black').css('padding', '1px 4px').css('color', 'black');
  }

  $('.buttonset').buttonset();

  function fixhref(href, pageitemid, resourcetype, website) {

    href = href.replace(/&pageItemId=-?[0-9]*/, "&pageItemId=" + pageitemid);
    href = href.replace(/&resourceType=[a-z]*/, "&resourceType=" + resourcetype);
    href = href.replace(/&website=[a-z]*/, "&website=" + website);
    return href;
  }

  function fixitemshows() {

    var val = $(".format:checked").val();
    if (val === "window") {
        $("#edit-height").hide();
    } else {
        $("#edit-height").show();
    }
    if (val === "inline") {
        $("#prereqstuff").hide();
    } else {
        $("#prereqstuff").show();
    }
  }

  $('.textbox a[class!=itemcopylink]').each(function (index) {

    try {
      if ($(this).attr('href').match("^http://lessonbuilder.sakaiproject.org/") !== null) {
        var item = $(this).attr('href').substring(38).replace('/','');
        var a = $('a[lessonbuilderitem=' + item + ']').first();
        $(this).replaceWith(a);
      }
    } catch (err) {};
  });

  $('#edit-title-error-container').hide();
  $('#new-page-error-container').hide();
  $('#edit-item-error-container').hide();
  $('#movie-error-container').hide();
  $('#subpage-error-container').hide();
  $("#require-label2").hide();
  $("#item-required2").hide();
  $(".reqCheckbox").hide();
  $("#assignment-dropdown-selection").hide();
  $("#edit-youtube-error-container").hide();
  $("#messages").hide();

  // where html5 might work we have an html5 player followed by the ususal object or embed
  // check the dom to see if it will actually work. If so use html5 with other stuff inside it
  // otherwise remove html5
  //
  // you'd hope that the html5 player would call what's inside if it can't work, but
  // in firefox it give the user an error without trying. Hence the code below that actually
  // checks. Let's hope it doesn't lie. Unfortunately many of the players say "maybe."
  // We just can't win.

  $(".html5video").each(function (index) {

    var html5 = $(this);
    var source = html5.children().first();
    var html5ok = false;
    try {
      html5ok = !!html5[0].canPlayType(source.attr('type'));
    } catch (err) {}

    if (html5ok) {
      html5.next().remove();
      html5.show();
    } else {
      html5.remove();
    }
  });

  $("#addcontent").click(buttonAddContent);
  $(".add-link").click(buttonAddContentAboveItem);
  $(".add-bottom").click(buttonAddContentSectionBottom);

  const addContentModal = document.getElementById("addContentDiv");
  const layoutElementsCard = document.getElementById("layout-elements");
  addContentModal.addEventListener('show.bs.modal', event => {
    const button = event.relatedTarget;
    if (button && button.hasAttribute('id') && "addcontent" === button.id) {
        layoutElementsCard.classList.add("d-none");
    }
    else {
        layoutElementsCard.classList.remove("d-none");
    }
  });

  // trap jquery close so we can clean up
  $("[aria-describedby='add-multimedia-dialog'] .ui-dialog-titlebar-close")
  .click(xCloseAddMultimediaDialog);
  $('.no-highlight').folderListing({
    enableHighlight: false,
  });

	$('a[href*="access/"]').each(function() {
		const href = this.href;
		if ( this.href === null ) return;
		if ( this.href.indexOf('/access/basiclti') < 0 && this.href.indexOf('/access/lti') < 0 ) return
		if ( '_blank' !== this.target ) return
		if ( this.onclick !== null ) return;
		console.debug('Patching LTI Launch to open with JS', this.href);
		this.onclick = function () { window.open(this.href,'_blank');return false; };
	});

  return false;
}); // document.ready

function xCloseAddMultimediaDialog() {
  // reset controls & clear error message
  $('.selector-helper').val('');		//remove file from the visible input/picker as well
  $("p.add-another-file").last().next('input').removeAttr('disabled');
  $("#mm-add-item").removeAttr('disabled');
  $("#mm-error").text('');
  $("#mm-error-container").hide();
  accumulatedFileSize = 0; 

  //close the modal
  const addmmdialogEl = document.querySelector("#add-multimedia-dialog");
  const modal = bootstrap.Modal.getInstance(addmmdialogEl);
  modal && modal.hide();
}

function setCollapsedStatus(header, collapse) {

  if (collapse === null) {
    // toggle
    collapse = header.find('.collapseIcon').hasClass("fa-caret-down");
  }
  if (collapse) {
    header.find('.collapseIcon').addClass("fa-caret-right");
    header.find('.collapseIcon').removeClass("fa-caret-down");
    header.find('.toggleCollapse').text(msg('simplepage.clickToExpand'));
    header.attr('aria-expanded', 'false');
    header.addClass('closedSectionHeader');
    header.removeClass('openSectionHeader');
  } else {
    header.find('.collapseIcon').removeClass("fa-caret-right");
    header.find('.collapseIcon').addClass("fa-caret-down");
    header.find('.toggleCollapse').text(msg('simplepage.clickToCollapse'));
    header.attr('aria-expanded', 'true');
    header.addClass('openSectionHeader');
    header.removeClass('closedSectionHeader');
  }
}

function checkEditTitleForm() {

  if ($('#pageTitle').val() === '') {
    $('#edit-title-error').text(msg("simplepage.title_notblank"));
    $('#edit-title-error-container').show();
    return false;
  } else if ($("#page-gradebook").prop("checked") && !isFinite(parseFloat($("#page-points").val()))) {
    $('#edit-title-error').text(intError(parseFloat($("#page-points").val())));
    $('#edit-title-error-container').show();
  } else if (/[\[\]{}\\|\^\`]/.test($('#pageTitle').val())) {
    $('#edit-title-error').text(msg("simplepage.subpage_invalid_chars"));
    $('#edit-title-error-container').show();
    return false;
  } else {
    $('#edit-title-error-container').hide();
    if ($("#page-releasedate").prop('checked')) {
      $("#release_date_string").val($("#releaseDateISO8601").val());
    } else {
      $("#release_date_string").val('');
    }
    return true;
  }

}

// these tests assume \d finds all digits. This may not be true for non-Western charsets
function checkNewPageForm() {

  if ($('#newPage').val() === '') {
    $('#new-page-error').text(msg("simplepage.title_notblank"));
    $('#new-page-error-container').show();
    return false;
  }
  if ($('#new-page-number').val() !== '') {
    if (! $('#new-page-number').val().match('^\\d*$')) {
      $('#new-page-error').text(msg("simplepage.number_pages_not_number"));
      $('#new-page-error-container').show();
      return false;
    }
    if (!$('#newPage').val().match('\\d')) {
      $('#new-page-error').text(msg("simplepage.title_no_number"));
      $('#new-page-error-container').show();
      return false;
    }
  }
  $('#new-page-error-container').hide();
  return true;
}

function checkYoutubeForm(w, h) {

  if (w && h && !checkMovieForm(w, h, true)) {
    return false;
  }

  if ($('#youtubeURL').val().contains('youtube.com') ||
      $('#youtubeURL').val().contains('youtu.be')) {
    return true;
  } else {
    $('#edit-youtube-error').val(msg("simplepage.must_be_youtube"));
    $('#edit-youtube-error-container').show();
    return false;
  }
}

//function called when adding twitter feed
function confirmAddTwitterTimeline(){
  //Check if username is empty or not?
  if ( $('#twitter-username').val().trim() === ""){
    $('#twitter-error').text(msg("simplepage.twitter-name-notblank"));
    $('#twitter-error-container').show();
    return false;
  }
  return true;
}
//this checks the width and height fields in the Edit dialog to validate the input
function checkMovieForm(w, h, y) {
    var wmatch = checkPercent(w);   // use a regex to check if the input is of the form ###%
    var hmatch = checkPercent(h);
    var wvalid = false;       // these hold whether the width or height input has been validated
    var hvalid = false;

    var eitem, econtainer;      // the span and div, respectively, for each dialog's error message
    var pre;
    if (y) {            // determine which dialog we're in and which error span/div to populate if there's an error
      pre = '#edit-youtube';
    } else {
      pre = '#movie';
    }

    eitem = $(pre + '-error');
    econtainer = $(pre + '-error-container');

    if (w.trim() === "") {      // empty input is ok
      wvalid = true;
    }

    if (h.trim() === "") {
      hvalid = true;
    }

    if (wmatch !== null && !wvalid) { // if it's of the form ###%, check if the ### is between 0 and 100
      var nw = Number(w.substring(0, w.length-1));
      if (nw < 1 || nw > 100) {
        // paint error message
        eitem.text(msg("simplepage.nothing-over-100-percent"));
        econtainer.show();
        return false;
      } else {
        wvalid = true;
      }
    }

    if (hmatch !== null && !hvalid) {
      var nh = Number(h.substring(0, h.length-1));
      if (nh > 100) {
        // paint error message
        eitem.text(msg("simplepage.nothing-over-100-percent"));
        econtainer.show();
        return false;
      } else {
        hvalid = true;
      }
    }

    wmatch = checkWidthHeight(w); // if it's not a percentage, check to make sure it's of the form ### or ###px
    hmatch = checkWidthHeight(h);

    if (wmatch === null && !wvalid) {
      // paint error message
      eitem.text(msg("simplepage.width-height"));
      econtainer.show();
      return false;
    }

    if (hmatch === null && !hvalid) {
      // paint error message
      eitem.text(msg("simplepage.width-height"));
      econtainer.show();
      return false;
    }
    econtainer.hide();
    return true;
}

function checkWidthHeight(x) {
  var regex = /^[0-9]+$|^[0-9]+px$/;
  return (x.match(regex));
}

function checkPercent(x) {
  var regex = /^[0-9]+\%$/;
  return (x.match(regex));
}

function checkCommentsForm() {
  return true;
}

function checkEditItemForm() {
  if ($('#name').val() === '') {
    $('#edit-item-error').text(msg("simplepage.item_notblank"));
    $('#edit-item-error-container').show();
    return false;
  } else if ((requirementType === '3' || requirementType === '6') &&
    $("#item-required2").prop("checked") && !isFinite(safeParseInt($("#assignment-points").val()))) {
    $('#edit-item-error').text(intError(safeParseInt($("#assignment-points").val())));
    $('#edit-item-error-container').show();
    return false;
  } else if (/[\[\]{}\\|\^\`]/.test($('#name').val())) {
    $('#edit-item-error').text(msg("simplepage.subpage_invalid_chars"));
    $('#edit-item-error-container').show();
    return false;
  } else {
    if ($("#page-releasedate2").prop('checked'))
      $("#release_date2").val($("#releaseDate2ISO8601").val());
    else
      $("#release_date2").val('');
    $('#edit-item-error-container').hide();
    return true;
  }
}

function checkSubpageForm() {
  if ($('#subpage-title').val() === '') {
    $('#subpage-error').text(msg("simplepage.page_notblank"));
    $('#subpage-error-container').show();
    return false;
  } else if (/[\[\]{}\\|\^\`]/.test($('#subpage-title').val())) {
    $('#subpage-error').text(msg("simplepage.subpage_invalid_chars"));
    $('#subpage-error-container').show();
    return false;
  } else {
    $('#subpage-error-container').hide();
    SPNR.disableControlsAndSpin( this, null );
    return true;
  }
}

function disableSecondaryRequirements() {
  $("item-required2").prop("disabled", true);
  $("assignment-dropdown-selection").prop("disabled", true);
  $("assignment-points").prop("disabled", true);
}

function disableSecondarySubRequirements() {
  $("assignment-dropdown-selection").prop("disabled", true);
  $("assignment-points").prop("disabled", true);
}

function setUpRequirements() {
  if ($("#item-required").prop("checked")) {
    $("#item-required2").prop("disabled", false);

    if ($("#item-required2").prop("checked")) {
      $("#assignment-dropdown-selection").prop("disabled", false);
      $("#assignment-points").prop("disabled", false);
    } else {
      $("#assignment-dropdown-selection").prop("disabled", true);
      $("#assignment-points").prop("disabled", true);
    }
  } else {
    $("#item-required2").prop("disabled", true);
    $("#assignment-dropdown-selection").prop("disabled", true);
    $("#assignment-points").prop("disabled", true);
  }
}

/**
 * Workaround in ShowPage.html to change which submit is triggered
 * when you press the Enter key.
 */
$(function () {
  $(".edit-multimedia-input").keypress(function (e) {
    if ((e.which && e.which === 13) || (e.keyCode && e.keyCode === 13)) {
      $('#edit-multimedia-item').click();
      return false;
    } else {
      return true;
    }
  });

  $(".edit-form-input").keypress(function (e) {
    if ((e.which && e.which === 13) || (e.keyCode && e.keyCode === 13)) {
          $('#edit-item').click();
          return false;
      } else {
          return true;
      }
  });

  $(".edit-youtube-input").keypress(function (e) {
    if ((e.which && e.which === 13) || (e.keyCode && e.keyCode === 13)) {
      $('#update-youtube').click();
      return false;
    } else {
      return true;
    }
  });

  $(".edit-movie-input").keypress(function (e) {
    if ((e.which && e.which === 13) || (e.keyCode && e.keyCode === 13)) {
      $('#update-movie').click();
      return false;
    } else {
      return true;
    }
  });

  function mmFileInputDelete() {
    let wasOverUploadSize = accumulatedFileSize / ONE_KB / ONE_KB > maxFileUploadSize ;

    let deleteTargets = $(this).parent().parent().find('.mm-file-input-size-save');

    deleteTargets.each(
      function (i) {
        let removeSize = $(this).text();
        accumulatedFileSize -= removeSize;
      }
    );

    // check if now under the limit following delete
    if (wasOverUploadSize && (accumulatedFileSize / ONE_KB / ONE_KB <= maxFileUploadSize )) {
      $("p.add-another-file").last().next('input').removeAttr('disabled');
      $("#mm-add-item").removeAttr('disabled');
      $("#mm-error").text('');
      $("#mm-error-container").hide();
    }

    $(this).parent().parent().remove(); //remove file name
    $('.selector-helper').val('');    //remove file from the visible input/picker as well
  }
  function mmFileInputChanged() {
      var previousTitle = $("#mm-name").val();
      $("#mm-name").val('');
      $("#mm-name-section").hide();
      // user has probably selected a file.
      var lastInput = $(".mm-file-input").last();
      if (lastInput[0].files.length !== 0) {
    // establish whether user has chosen the option to add file titles for the upload.
    var doingNames = false;
    if ($('.fileTitles')[0]) {
      doingNames = true;
    }
    // user has chosen a file.
    // Add another button for user to pick more files
    lastInput.parent().after(lastInput.parent().clone());
    // find the new button and put this trigger on it
    lastInput.parent().next().find('input').on("change", mmFileInputChanged);
    // now need annotation on the next input, so remove the old
    $('.add-another-file').hide();
    $('.add-file-div').removeClass('add-another-file-div');
    $('.add-another-file').last().show().parent().addClass('add-another-file-div');
    // Loop through the new files in reverse order so that they can be added just after the lastInput element.
    for (i = lastInput[0].files.length-1; i >= 0; i--) {
      accumulatedFileSize += lastInput[0].files[i].size;
      var newStuff = '<p><span class="mm-file-input-name h5" title="' + lastInput[0].files[i].name + '">' + lastInput[0].files[i].name + '</span>';
      newStuff += '<span class="mm-file-input-size h6">' + formatFileSize(lastInput[0].files[i].size) + '</span>';
      newStuff += '<span class="mm-file-input-size-save" style="display:none">' + lastInput[0].files[i].size + '</span>';
      if (doingNames) {
        var valueContent = '';
        if (i === 0 && previousTitle){
          valueContent = 'value="' + previousTitle + '"';
        }
        newStuff = newStuff + '<label for="link-title">' + msg('simplepage.linkTitle') + '</label><input id="link-title" class="mm-file-input-names" type="text" size="30" maxlength="255" ' + valueContent + '/></p>';
      } else {
        newStuff = newStuff + '<div><label for="link-title">' + msg('simplepage.addFile_label_name') + '</label><input id="link-title" class="mm-file-input-names" type="text" size="30" maxlength="255"/></div>';
      }
      newStuff = newStuff + '</p>'
      lastInput.after(newStuff);
      lastInput.parent().addClass('mm-file-group');
    }

    if (accumulatedFileSize / ONE_KB / ONE_KB > maxFileUploadSize) {
      $("p.add-another-file").last().next('input').attr('disabled','disabled');
      $("#mm-add-item").attr('disabled','disabled');
      $("#mm-error").text(msg("simplepage.max-file-upload-size") + ' ' + maxFileUploadSize + ' ' + msg("simplepage.max-file-upload-size-save"));
      $("#mm-error-container").show();
    }

    var nextStuff = '<span class="remove-upload" title="' + msg('simplepage.remove_from_uploads') + '"><span class="mm-file-input-delete fa fa-trash"></span></span>';
    lastInput.after(nextStuff);
    $('.mm-file-input-delete').off('click').on('click', mmFileInputDelete);
    // hide the original button as a new one has been created with the annotation of the new number of files.
    lastInput.hide();
    lastInput.removeClass('selector-helper'); //this empty class is used as a selector for deletion...we do NOT want to clear existing files' inputs, so they should not have this class; only the clones [created above] should.
    // Hide the add from resources link and add URL section as one can't upload files and do these at the same time.
    $('#new-url-panel').hide();
    $('#existing-resource-panel').hide();
      }
  };

  $(".mm-file-input").on("change", mmFileInputChanged);

});

var hasBeenInMenu = false;
var addAboveItem = "";
var addAboveLI = null;

function buttonAddContent() {
  // Set these to place the added content to the bottom of the page
  addAboveItem = "";
  addAboveLI = null;
}

function buttonAddContentAboveItem() {

  addAboveLI = $(this).closest("div.item");
  oldloc = addAboveLI.find(".plus-edit-icon");
  addAboveItem = addAboveLI.find("span.itemid").text();
  $(".addbreak").show();
  openDropdown($("#addContentDiv"), $("#dropdownc"), msg('simplepage.add-above'));
}

function buttonAddContentSectionBottom() {
    oldloc = $(this);
    addAboveItem = '-' + $(this).closest('.column').find('div.mainList').children().last().find("span.itemid").text();
    addAboveLI = $(this).closest('.column').find('div.mainList').children().last().closest("div.item");
    if (addAboveLI.length === 0) {
        // Unable to find item (due to an empty section or column). Target break instead
        addAboveLI = $(this).closest('.column').find('div.mainList').children().last().closest("div.breakitem");
    }
    $(".addbreak").show();
    openDropdown($("#addContentDiv"), $("#dropdownc"), msg('simplepage.add-item-column'));
    return false;
}

function openDropdown(dropDiv, button, title, dropDown) {

  //hideMultimedia();
  const modal = bootstrap.Modal.getOrCreateInstance(dropDiv[0])
  modal.show();
  //dropDiv.dialog('option', 'title', title);
  //dropDiv.dialog('open');
  //dropDiv.find("a").first().focus();
  if (addAboveItem === '') {
    dropDiv.find(".addContentMessage").show();
  } else {
    dropDiv.find(".addContentMessage").hide();
  }
  return false;
}

function hideMultimedia() {
    $('.hideOnDialog').css('visibility','hidden');
}

// When dialogs close, this shows the stuff that was hidden
function unhideMultimedia() {
  $('.hideOnDialog').css('visibility','visible');
  $("#outer").height("auto");
  setMainFrameHeight(window.name);
}

// Peer evaluation functions are located in peer-eval.js 

// Clones one of the multiplechoice answers in the Question dialog and appends it to the end of the list
function addMultipleChoiceAnswer() {
  var clonedAnswer = $("#copyableMultipleChoiceAnswer").clone(true);
  var num = $("#multipleChoiceAnswersBody").find("tr").length + 2; // Should be currentNumberOfAnswers + 1
  clonedAnswer.find(".question-multiplechoice-answer-id").val("-1");
  clonedAnswer.find(".question-multiplechoice-answer-correct").prop("checked", false);
  clonedAnswer.find(".question-multiplechoice-answer").val("");

  clonedAnswer.attr("id", "multipleChoiceAnswerDiv" + num);

  // Each input has to be renamed so that RSF will recognize them as distinct
  clonedAnswer.find("[name='question-multiplechoice-answer-complete']")
    .attr("name", "question-multiplechoice-answer-complete" + num);
  clonedAnswer.find("[name='question-multiplechoice-answer-complete-fossil']")
    .attr("name", "question-multiplechoice-answer-complete" + num + "-fossil");
  clonedAnswer.find("[name='question-multiplechoice-answer-id']")
    .attr("name", "question-multiplechoice-answer-id" + num);
  clonedAnswer.find("[for='question-multiplechoice-answer-correct']")
    .attr("for", "question-multiplechoice-answer-correct" + num);
  clonedAnswer.find("[name='question-multiplechoice-answer-correct']")
    .attr("name", "question-multiplechoice-answer-correct" + num);
  clonedAnswer.find("[for='question-multiplechoice-answer']")
    .attr("for", "question-multiplechoice-answer" + num);
  clonedAnswer.find("[name='question-multiplechoice-answer']")
    .attr("name", "question-multiplechoice-answer" + num);

  // Unhide the delete link on every answer choice other than the first.
  // Not allowing them to remove the first makes this AddAnswer code simpler,
  // and ensures that there is always at least one answer choice.
  clonedAnswer.find(".deleteAnswerLink").removeAttr("style");

  clonedAnswer.appendTo("#multipleChoiceAnswersBody");

  // Re-assign the options to the question list
  reassignAnswerOptions();

  return clonedAnswer;
}

function reassignAnswerOptions() {
  const capitalLettersIndex = 65; // 65 corresponds to A.
  document.querySelectorAll('.question-multiplechoice-answer-option').forEach( (item, index) => {
    item.innerHTML = String.fromCharCode(capitalLettersIndex + index);
  });
  document.querySelectorAll('.question-showans-answer-option').forEach( (item, index) => {
    item.innerHTML = String.fromCharCode(capitalLettersIndex + index);
  });
}
// Clones one of the shortanswers in the Question dialog and appends it to the end of the list
function addShortanswer() {
  var clonedAnswer = $("#copyableShortanswer").clone(true);
  clonedAnswer.find(".question-shortanswer-answer").val("");

  // Unhide the delete link on every answer choice other than the first.
  // Not allowing them to remove the first makes this AddAnswer code simpler,
  // and ensures that there is always at least one answer choice.
  clonedAnswer.find(".deleteAnswerLink").removeAttr("style");

  // have to make name unique, so append a count
  var n = $("#shortAnswersTableBody tr").length;
  var elt = clonedAnswer.find("label");
  elt.attr("for", elt.attr("for") + n);
  elt = clonedAnswer.find("input");
  elt.attr("name", elt.attr("name") + n);

  clonedAnswer.attr("id", "otherShortAnswer" + n);
  clonedAnswer.appendTo("#shortAnswersTableBody");
  // Re-assign the options to the question list
  reassignAnswerOptions();

  return clonedAnswer;
}

function updateMultipleChoiceAnswers() {
  $(".question-multiplechoice-answer-complete").each(function (index, el) {
    var id = $(el).parent().find(".question-multiplechoice-answer-id").val();
    var checked = $(el).parent().find(".question-multiplechoice-answer-correct").is(":checked");
    var text = $(el).parent().find(".question-multiplechoice-answer").val();

    $(el).val(index + ":" + id + ":" + checked + ":" + text);
  });
}

function updateShortanswers() {
  var answerText = "";

  $(".question-shortanswer-answer").each(function () {
    answerText += $(this).val() + "\n";
  });

  $("#question-answer-full-shortanswer").val(answerText);
}

function deleteAnswer(el) {
  el.parent('td').parent('tr').remove();
  reassignAnswerOptions();
}

// Enabled or disables the subfields under grading in the question dialog
function checkQuestionGradedForm() {
  if ($("#question-graded").is(":checked")) {
    $("#question-max").prop("disabled", false);
    $("#question-gradebook-title").prop("disabled", false);
  } else {
    $("#question-max").prop("disabled", true);
    $("#question-gradebook-title").prop("disabled", true);
  }
}

// Prepares the question dialog to be submitted
function prepareQuestionDialog() {
  if ($("#question-graded").prop("checked") && !isFinite(safeParseInt($("#question-max").val()))) {
      $('#question-error').text(intError(safeParseInt($("#question-max").val())));
      $('#question-error-container').show();
      return false;
  } else if ($("#question-graded").prop("checked") && $("#question-gradebook-title").val() === '') {
      $('#question-error').text(msg("simplepage.gbname-expected"));
      $('#question-error-container').show();
      return false;
  } else if ($("input[name='multi_gradebook-fossil']").length > 0 && $("input[name='multi_gradebook-fossil']").val().includes("true") &&
    $("input[name='group-list-span-selection']:checked").length === 0) {
      $('#question-error').text(msg("simplepage.multi_gradebook.no_group"));
      $('#question-error-container').show();
      return false;
  } else if ($("#question-text-area-evolved\\:\\:input").val() === '') {
      $('#question-error').text(msg("simplepage.missing-question-text"));
      $('#question-error-container').show();
  } else if ($("#multipleChoiceSelect").prop("checked") &&
       $(".question-multiplechoice-answer").filter(function (index){return $(this).val() !== '';}).length < 2) {
      $('#question-error').text(msg("simplepage.question-need-2"));
      $('#question-error-container').show();
      return false;
  } else {
      $('#question-error-container').hide();
  }

  updateMultipleChoiceAnswers();
  updateShortanswers();

  $("input[name='" + $("#activeQuestion").val() + "'").val($("#question-text-area-evolved\\:\\:input").val());
  SPNR.disableControlsAndSpin( this, null );

  // RSF bugs out if we don't undisable these before submitting
  $("#multipleChoiceSelect").prop("disabled", false);
  $("#shortanswerSelect").prop("disabled", false);
  return true;
}

// Reset the multiple choice answers to prevent problems when submitting a shortanswer
function resetMultipleChoiceAnswers() {
  var firstMultipleChoice = $("#copyableMultipleChoiceAnswer");
  firstMultipleChoice.find(".question-multiplechoice-answer-id").val("-1");
  firstMultipleChoice.find(".question-multiplechoice-answer").val("");
  firstMultipleChoice.find(".question-multiplechoice-answer-correct").prop("checked", false);
  $("#multipleChoiceAnswersBody").empty();
  $("#multipleChoiceAnswersBody").append(firstMultipleChoice);
}

//Reset the shortanswers to prevent problems when submitting a multiple choice
function resetShortanswers() {
  var firstShortAnswerChoice = $("#copyableShortanswer");
  firstShortAnswerChoice.find(".question-shortanswer-answer").val("");
  $("#shortAnswersTableBody").empty();
  $("#shortAnswersTableBody").append(firstShortAnswerChoice);
}


function getGroupErrors(groups) {
    var errors = '';
    var url = location.protocol + '//' + location.host + 
  '/lessonbuilder-tool/ajax?op=getgrouperrors&site=' +
  msg('siteid') + '&locale=' + msg('locale') + '&groups=' + groups;
     $.ajax({type: "GET",
       async: false,
        url: url,
        success: function (data, status, hdr) {
     errors = data.trim();
      }});
     return errors;
}

function addBreak(itemId, type) {
    var errors = '';
    var url = location.protocol + '//' + location.host + 
  '/lessonbuilder-tool/ajax';
    var grouped;
    var csrf = $("#edit-item-dialog input[name='csrf8']").attr('value');
    $.ajax({type: "POST",
      async: false,
      url: url,
      data: {op: 'insertbreakbefore', itemid: itemId, type: type, cols:'1', csrf: csrf},
      success: function (data) {
    grouped = data;
      }});
    return grouped;
}

function deleteBreak(itemId, type) {
    var errors = '';
    var url = location.protocol + '//' + location.host + 
  '/lessonbuilder-tool/ajax';
    var grouped;
    var csrf = $("#edit-item-dialog input[name='csrf8']").attr('value');
    $.ajax({type: "POST",
      async: false,
      url: url,
      data: {op: 'deleteitem', itemid: itemId, csrf: csrf},
      success: function (data){
    grouped = data;
      }});
}

function setColumnProperties(itemId, width, split, color, forceBtnColor) {
    var errors = '';
    var url = location.protocol + '//' + location.host + 
  '/lessonbuilder-tool/ajax';
    var grouped;
    var csrf = $("#edit-item-dialog input[name='csrf8']").attr('value');
    $.ajax({type: "POST",
      async: false,
      url: url,
    data: {op: 'setcolumnproperties', itemid: itemId, width: width, split: split, csrf: csrf, color: color, forceBtn: forceBtnColor},
      success: function (data){
    ok = data;
      }});
}

function setSectionCollapsible(itemId, collapsible, sectionTitle, defaultClosed) {
  var url = location.protocol + '//' + location.host + '/lessonbuilder-tool/ajax';
  var csrf = $("#edit-item-dialog input[name='csrf8']").attr('value');
  $.ajax({
    type: "POST",
    async: false,
    url: url,
    data: {op: 'setsectioncollapsible', itemid: itemId, collapsible: collapsible, sectiontitle: sectionTitle, defaultclosed: defaultClosed, csrf: csrf},
    success: function (data){
      ok = data;
    }
  });
}

var mimeMime = "";

function getMimeType(url) {
     var mime = "";
     // Access-Control-Allow-Origin: *
     var base = location.protocol + '//' + location.host;
     $.ajax({type: "GET",
       async: false,
        url: base + '/lessonbuilder-tool/ajax?op=getmimetype&url=' + encodeURIComponent(url),
       success: function (data, status, hdr) {
     mime = data.trim();
      }});
     return mime;
 }

function filterHtml(html) {
     var ret = '';
     var base = location.protocol + '//' + location.host;
     $.ajax({type: "GET",
       async: false,
        url: base + '/lessonbuilder-tool/ajax?op=filterhtml&html=' + encodeURIComponent(html),
       success: function (data, status, hdr) { 
     ret = data.trim();
      }});
     return ret;
 }

function mm_test_reset() {
    mm_testing = 0;
   $('#mm-test-embed-results').hide();
   $('#mm-test-addedhttps').hide();
   $('#mm-test-oembed-results').hide();
   $('#mm-test-iframe-results').hide();
   $('#mm-explain-video').hide();
   $('#mm-test-mime').hide();
   $('#mm-test-tryother').hide();
   $('.mm-test-reset').hide();
   $('#mm-test-prototype').hide();
   $('#mm-test-oembed-results .oembedall-container').remove();
   $('#mm-file-replace-group').hide();
}

function toggleShortUrlOutput(defaultUrl, checkbox, textbox) {
    if ($(checkbox).is(':checked')) {
  $.ajax({
    url:'/direct/url/shorten?path='+encodeURI(defaultUrl),
        success: function (shortUrl) {
        $('.'+textbox).val(shortUrl);
    }
      });
    } else {
  $('.'+textbox).val(defaultUrl);
    }
}

function printView(url) {
    const siteIndex = url.indexOf("/site/");
    const toolIndex = url.indexOf("/tool/");
    if (siteIndex < 0 || toolIndex < 0) return url;
    return url.substring(0, siteIndex) + url.substring(toolIndex);
}

function printViewWithParameter(url) {
    const siteIndex = url.indexOf("/site/");
    const toolIndex = url.indexOf("/tool/");
    const showPageIndex = url.indexOf("ShowPage");
    if (siteIndex < 0 || toolIndex < 0) return url;
    const modifiedUrl = url.substring(0, siteIndex) + url.substring(toolIndex);
    return showPageIndex < 0 ? `${modifiedUrl}?printall=true` : `${modifiedUrl}&printall=true`;
}

// make columns in a section the same height. Is there a better place to trigger this?
// use load because we want to do this after images, etc. are loaded so heights are set

// fix up cols1, cols2, etc, after splitting a section
function fixupColAttrs() {
    $(".section").each(function (index) {
      var count = $(this).find(".column").size() + $(this).find(".double").size();
      $(this).find(".column").removeClass('cols1 cols2 cols3 cols4 cols5 cols6 cols7 cols8 cols9');
      $(this).find(".column").addClass('cols' + count);
  });
};

// called twice, once at page load, once after all comments are loaded.
// depending upon content one or the other may be first, so there's no way to
// be sure without doing it both times
function fixupHeights() {
    // if CSS is going to treat this as narrow device, don't need to match columns,
    // because they are stacked vertically
    if (window.matchMedia("only screen and (max-width: 800px)").matches) {
  return;
    }
    $(".section").each(function (index) {
    var visible = $(this).is(":visible");
    // Unhide all to calculate correct heights
    $(this).show();
      var max = 0;
      // reset to auto to cause recomputation. This is needed because
      // this gets called after contents of columns have changed.
      $(this).find(".column").css('height','auto');
      $(this).find(".column").each(function (i) {
        if ($(this).height() > max)
      max = $(this).height();
    });
      $(this).find(".column").each(function (i) {
        if (max > $(this).height())
      $(this).height(max);
    });
    if (!visible) {
      $(this).hide();
    }
  });
};


// indent is 20px. but with narrow screen and indent 8, this could use too
// much. So constrain indent so only 1/4 of the width can be used for the
// maximum indent in the column.
var indentSize = 20;
var indentFraction = 4;
// this is more complex than you'd think. in some cases a section starts invisible
// in that case width is zero, and the calculation is meaningless
// also, because it adds to the existing indent, we can't do it more than once per item
// so check if it's visible and that a done attribute isn't set
function doIndents() {
    $(".column").each(function (index) {
      var max = 0;
      var indents = $(this).find("[x-indent]");
      var width = $(this).width();
      if ($(this).is(':visible') && indents.size() > 0) {
    indents.each(function (i) {
        var indent = $(this).attr('x-indent');
        if (indent > max)
      max = indent;
        });
    // max for 1 indent is width / 3 / max, so all indents
    // don't use more than 1/3
    var indent1 = width / (max * indentFraction);
    indent1 = Math.min(indent1, indentSize);
    // do the indents
    indents.each(function (i) {
        var existing = parseInt($(this).css("padding-left"),10);
        // make sure we only do this once
        if (typeof $(this).attr('x-indent-done') === 'undefined') {
      $(this).css("padding-left", (existing + indent1 * $(this).attr('x-indent')) + "px");
      $(this).attr('x-indent-done','true');
        }
    });
      }
  });

    if (window.matchMedia("only screen and (max-width: 800px)").matches) {
  return;
    }
    $(".section").each(function (index) {
      var max = 0;
      // reset to auto to cause recomputation. This is needed because
      // this gets called after contents of columns have changed.
      $(this).find(".column").css('height','auto');
      $(this).find(".column").each(function (i) {
        if ($(this).height() > max)
      max = $(this).height();
    });
      $(this).find(".column").each(function (i) {
        if (max > $(this).height())
      $(this).height(max);
    });
  });
};

function afterLink(here,itemId) {
    setTimeout(function () {fixStatus(here,itemId)},3000);
}

// if direct url we need to track it and change status to checkmark
// if not backend does it, and we need to redisplay the page to show the status changed
function fixStatus(here,itemId) {
    if (itemId !== 0) {
  var errors = '';
  var url = location.protocol + '//' + location.host +
      '/lessonbuilder-tool/ajax';
  $.ajax({type: "GET",
      async: false,
      url: url,
      data: {op: 'islogged', itemid: itemId},
        success: function (data, status, hdr) {
     // track worked, update image to checkmark and offscreen label to completed
     errors = data.trim();
     if (errors === 'ok') {
         var img = here.closest('.right-col').find('.statusCol img');
         img.attr('src', '/lessonbuilder-tool/images/checkmark.png');
         here.closest('.right-col').find('.link-div .lb-offscreen').text(msg('simplepage.status.completed') + ' ');
     }
    }
      });
  return;
    };
}

function pageLayoutSelectChange(){
  $(".templateTypeDescription").hide();  //hide all the descriptions in case one is already showing
  $("#simplepage-layout-example").hide();
  var value = document.getElementById('page-dropdown-selection').value;
  switch(value){
    case 'addSubpageList':  //show only the description we've selected.
      document.getElementById('type1description').removeAttribute('style');
      document.getElementById('simplepage-layout-example').removeAttribute('style');
      break;
    case 'interiorResources':
      document.getElementById('type2description').removeAttribute('style');
      document.getElementById('simplepage-layout-example').removeAttribute('style');
      break;
    case 'interiorTask':
      document.getElementById('type3description').removeAttribute('style');
      document.getElementById('simplepage-layout-example').removeAttribute('style');
      break;
    default:
      document.getElementById('page-preview-blank').removeAttribute('style');
  }
}
function collapsibleChange(){
  if (document.getElementById('page-option-task-collapsible').checked){
    document.getElementById('pageCloseDiv').removeAttribute('style');
  } else {
    document.getElementById('pageCloseDiv').setAttribute('style', 'display:none');
  }
}

function buttonLinkChange(){
  if (document.getElementById('page-subpage-button').checked){
    document.getElementById('page-color-div').removeAttribute('style');
  } else {
    document.getElementById('page-color-div').setAttribute('style','display:none');
  }
}

function showIframe(title, doreload) {
  $("#modal-iframe-div-blti").dialog({
    title: title,
    width: modalDialogWidth(),
    height: modalDialogHeight(),
    modal: true,
    draggable: false,
    open: function () {
      $("#modal-iframe-div-blti").dialog("option", "width", modalDialogWidth());
      $("#modal-iframe-div-blti").dialog("option", "height", modalDialogHeight());
      $('#sakai-lti-admin-iframe').attr('width', '100%');
      $('#sakai-lti-admin-iframe').attr('height', '100%');
      // https://stackoverflow.com/questions/1202079/prevent-jquery-ui-dialog-from-setting-focus-to-first-textbox
      $(this).parent().focus();
    },
    close: function () {
      if ( doreload ) {
        location.reload();
      } else {
        $('#sakai-lti-admin-iframe').attr('src','/library/image/sakai/spinner.gif');
      }
    }
  });
  $(window).resize(function () {
    $("#modal-iframe-div-blti").dialog("option", "width", modalDialogWidth());
    $("#modal-iframe-div-blti").dialog("option", "height", modalDialogHeight());
    $('#sakai-lti-admin-iframe').attr('width', '100%');
    $('#sakai-lti-admin-iframe').attr('height', '100%');
  });
}
function fixAddBeforeLTI(el) {
  $(el).attr('href', $(el).attr('href').replace('addBefore=', 'addBefore=' + (addAboveItem === null ? "" : addAboveItem)));
  return true;
}

$.widget( "ui.dialog", $.ui.dialog, {
 /*
  *  http://bugs.jqueryui.com/ticket/9087#comment:27 - bugfix
  *  http://bugs.jqueryui.com/ticket/4727#comment:23 - bugfix
  *  allowInteraction fix to accommodate windowed editors
  */
  _allowInteraction: function( event ) {
    if ( this._super( event ) ) {
      return true;
    }

    // address interaction issues with general iframes with the dialog
    if ( event.target.ownerDocument != this.document[ 0 ] ) {
      return true;
    }

    // address interaction issues with dialog window
    if ( $( event.target ).closest( ".cke_dialog" ).length ) {
      return true;
    }

    // address interaction issues with iframe based drop downs in IE
    if ( $( event.target ).closest( ".cke" ).length ) {
      return true;
    }
  }
});
