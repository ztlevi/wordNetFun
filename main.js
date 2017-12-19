const electron = require('electron')
const {app, BrowserWindow, ipcMain} = electron

const path = require('path')
const url = require('url')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({width: 1200, height: 900})

  // and load the index.html of the app.
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

var wordNet = require('wordnet-magic')

let db_path = app.getAppPath() + '/db/sqlite-31.db'
var wn = wordNet(db_path)

// receive the word
ipcMain.on('word', async function (event, received_word) {
  console.log(received_word)
  let word = new wn.Word(received_word)
  let ret = {}
  ret['word'] = received_word
  let result = new Array(4)
  result[0] = await word.getSynsets()
  // result[1] = await word.getAntonyms()

  let pos = result[0][0].pos
  let synsetWord = received_word + '.' + pos
  console.log(synsetWord)

  // wn.fetchSynset( 'american.n.3' ).then( function( synset ) {
  //   console.log( synset );
  //   synset.getHyponyms().then( function( hyponym ) {
  //     console.log( util.inspect( hyponym, null, 3 ) );
  //   });
  // })
  result[1] = []
  result[2] = []

  for (let i = 0; i < result[0].length; i++) {
    let hypernyms = await result[0][i].getHypernyms()
    if (hypernyms !== null) {
      for (let j = 0; j < hypernyms.length; j++) {
        result[1].push(hypernyms[j])
      }
    }

    let hyponyms = await result[0][i].getHyponyms()
    if (hyponyms !== null) {
      for (let j = 0; j < hyponyms.length; j++) {
        result[2].push(hyponyms[j])
      }
    }
  }

  ret['synset'] = result[0]
  ret['hypernyms'] = result[1]
  ret['hyponyms'] = result[2]
  mainWindow.webContents.send('result', ret)
  // .catch((error)=>{
  //   console.log(error)
  //   mainWindow.webContents.send('result', ret)
  // }
})
