// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const {
  ipcRenderer,
  remote
} = require('electron')
let $ = require('jquery')

mainProcess = remote.require('./main.js')
let lastClickWord = null

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

    function appendToOutput(x){
      $('#text_output').append($('<p id="p' + x + '"></p>'))
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
    $('#synsetSubmenu').empty()
    $('#antonymsSubmenu').empty()

    if (lastClickWord !== null) {
      $(lastClickWord).css('background-color', '#fafafa')
      $(lastClickWord).css('color', '#999')
    }
    getWordDetail($(this).text())
    $(this).css('background-color', '#6d7fcc')
    $(this).css('color', '#fafafa')
    lastClickWord = this
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
      refreshOutputText()
      e.preventDefault()
    }
  })
})

ipcRenderer.on('result', (event, ret) => {
  // synsets
  let synsets = ret['synset']
  let synsets_pool = new Set()

  // add original word
  synsets_pool.add(ret['word'])
  $('#synsetSubmenu').append($('<li></li>').html('<a href="#" class="candidate">' + ret['word'] + '</a>'))

  for (let i = 0; i < synsets.length; i++) {
    for (let j = 0; j < synsets[i].words.length; j++) {
      let lemma = synsets[i].words[j].lemma
      if (!synsets_pool.has(lemma)) {
        synsets_pool.add(lemma)
        $('#synsetSubmenu').append($('<li></li>').html('<a href="#" class="candidate">' + lemma + '</a>'))
      }
    }
  }

  // antonyms
  let antonyms = ret['antonyms']
  let antonyms_pool = new Set()

  // add original word
  antonyms_pool.add(ret['word'])
  $('#antonymsSubmenu').append($('<li></li>').html('<a href="#" class="candidate">' + ret['word'] + '</a>'))

  for (let i = 0; i < antonyms.length; i++) {
      let antonym = antonyms[i].antonym
      if (!antonyms_pool.has(antonym)) {
        antonyms_pool.add(antonym)
        $('#antonymsSubmenu').append($('<li></li>').html('<a href="#" class="candidate">' + antonym + '</a>'))
      }
  }


  $('.candidate').click(function () {
    $(lastClickWord).text($(this).text())
  })
})

