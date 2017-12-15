// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const {
  ipcRenderer,
  remote
} = require('electron')
let $ = require('jquery')

mainProcess = remote.require('./main.js')
let $lastClickedWord = null
let $lastClickedCandidate = null

// send the word info to the back end
let getWordDetail = (word) => {
  word = word.toLowerCase()
  ipcRenderer.send('word', word)
}

$('#text_output').empty()

let refreshOutputText = () => {
  let text = $('#text_input').val()

  let lines = text.split('\n')
  for (let x = 0; x < lines.length; x++) {
    let line = lines[x]

    let words = line.split(' ')
    let symbols = new Array(words.length)
    symbols.fill('')
    words.map((value, idx, arr) => {
      let syms = ',.?!'
      for (let i = 0; i < syms.length; i++) {
        let sym_idx = value.indexOf(syms[i])
        if (sym_idx !== -1) {
          symbols[idx] += syms[i]
          words[idx] = words[idx].substring(0, sym_idx)
          break
        }
      }
    })

    function appendToOutput (x) {
      $('#text_output').append($('<p class="poem" id="p' + x + '"></p>'))
      for (let i = 0; i < words.length; i++) {
        $('#p' + x).append($('<span class=\'word\'>').text(words[i]))
        if (symbols[i])
          $('#p' + x).append($('<span>').text(symbols[i]))
        $('#p' + x).html($('#p' + x).html() + ' ')
      }
    }

    appendToOutput(x)
  }

  // $('#text_output').html()
  $('.word').click(function () {
    // empty submenus
    $('#synsets').empty()
    $('#hypernyms').empty()
    $('#hyponyms').empty()

    if ($lastClickedWord !== null) {
      $lastClickedWord.css('background-color', '#fafafa')
      $lastClickedWord.css('color', '#999')
    }
    getWordDetail($(this).text())
    $(this).css('background-color', '#6d7fcc')
    $(this).css('color', '#fafafa')
    $lastClickedWord = $(this)
  })
}

// refresh when loading
refreshOutputText()

// generate the html for the text_output, and bind the click event
// enter key
$(function () {
  $('#text_input').keypress(function (e) {
    if (e.which == 13) {
      //submit form via ajax, this is not JS but server side scripting so not showing here
      $('#text_output').empty()
      refreshOutputText()
      e.preventDefault()
    }
  })
})

ipcRenderer.on('result', (event, ret) => {
  // synsets
  $synsets = $('#synsets')
  $synsets.empty()
  let synsets = ret['synset'] ? ret['synset'] : []
  let synsets_pool = new Set()

  // add original word
  synsets_pool.add(ret['word'])
  $synsets.append($('<li></li>').html('<a class="candidate" description="Reset to the original word">' + ret['word'] + '</a>'))

  function addSynsetSubmenu (i, des) {
    $synsets.append(
      $('<a href="#synsetSubmenu' + i + '" data-toggle="collapse" aria-expanded="false">' + des + '</a><ul class="collapse list-unstyled" id="synsetSubmenu' + i + '"></ul>'
      )
    )
    return $('#synsetSubmenu' + i)
  }

  for (let i = 0; i < synsets.length; i++) {
    if (synsets[i].words !== null && synsets[i].words.length > 1) {
      let $synsetSubmenu = addSynsetSubmenu(i, synsets[i].lexdomain)

      for (let j = 0; j < synsets[i].words.length; j++) {
        let lemma = synsets[i].words[j].lemma
        let description = synsets[i].definition
        if (!synsets_pool.has(lemma)) {
          synsets_pool.add(lemma)
          $synsetSubmenu.append($('<li></li>').html('<a class="candidate" description="' + description + '">' + lemma + '</a>'))
        }
      }
    }
  }

  //region antonyms
  // // antonyms
  // let antonyms = ret['antonyms']
  // let antonyms_pool = new Set()
  //
  // // add original word
  // antonyms_pool.add(ret['word'])
  // $('#antonymsSubmenu').append($('<li></li>').html('<a href="#" class="candidate">' + ret['word'] + '</a>'))
  //
  // for (let i = 0; i < antonyms.length; i++) {
  //   let antonym = antonyms[i].antonym
  //   if (!antonyms_pool.has(antonym)) {
  //     antonyms_pool.add(antonym)
  //     $('#antonymsSubmenu').append($('<li></li>').html('<a href="#" class="candidate">' + antonym + '</a>'))
  //   }
  // }
  //endregion

  //region hypernym
  $hypernyms = $('#hypernyms')
  $hypernyms.empty()
  let hypernyms = ret['hypernyms'] ? ret['hypernyms'] : []
  let hypernyms_pool = new Set()

  // add original word
  hypernyms_pool.add(ret['word'])
  $hypernyms.append($('<li></li>').html('<a class="candidate" description="Reset to the original word">' + ret['word'] + '</a>'))

  for (let i = 0; i < hypernyms.length; i++) {
    if (hypernyms[i].words) {
      for (let j = 0; j < hypernyms[i].words.length; j++) {
        let lemma = hypernyms[i].words[j].lemma
        let description = hypernyms[i].definition
        if (!hypernyms_pool.has(lemma)) {
          hypernyms_pool.add(lemma)
          $hypernyms.append($('<li></li>').html('<a class="candidate" description="' + description + '">' + lemma + '</a>'))
        }
      }
    }
  }
  //endregion

  //region hyponyms
  $hyponyms = $('#hyponyms')
  $hyponyms.empty()
  let hyponyms = ret['hyponyms'] ? ret['hyponyms'] : []
  let hyponyms_pool = new Set()

  // add original word
  hyponyms_pool.add(ret['word'])
  $hyponyms.append($('<li></li>').html('<a class="candidate" description="Reset to the original word">' + ret['word'] + '</a>'))

  for (let i = 0; i < hyponyms.length; i++) {
    if (hyponyms[i].words !== null) {
      for (let j = 0; j < hyponyms[i].words.length; j++) {
        let lemma = hyponyms[i].words[j].lemma
        let description = hyponyms[i].definition
        if (!hyponyms_pool.has(lemma)) {
          hyponyms_pool.add(lemma)
          $hyponyms.append($('<li></li>').html('<a class="candidate" description="' + description + '">' + lemma + '</a>'))
        }
      }
    }
  }
  //endregion

  let timer
  function showSnackBar () {
    // Get the snackbar DIV
    let x = $('#snackbar')
    let descr = $lastClickedCandidate.attr('description')
    if (!descr) descr = ''
    x.text(descr)

    // Add the "show" class to DIV
    x.attr('class', 'show')

    window.clearTimeout(timer)
    // After 3 seconds, remove the show class from DIV
    timer = window.setTimeout(function () {
      x.attr('class', '')
    }, 7000)
  }

  $('.candidate').click(function () {
    $lastClickedCandidate = $(this)
    $lastClickedWord.text($(this).text())
    showSnackBar()
  })

})

