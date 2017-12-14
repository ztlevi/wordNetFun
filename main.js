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

var wn = wordNet('./db/sqlite-31.db')

// receive the word
ipcMain.on('word', (event, received_word) => {
  console.log(received_word)
  let word = new wn.Word(received_word)
  let ret = {}
  ret['word'] = received_word
  Promise.all([word.getSynsets(), word.getAntonyms()])
    .then(result => {
      ret['synset'] = result[0] ? result[0] : []
      ret['antonyms'] = result[1] ? result[1] : []
      mainWindow.webContents.send('result', ret)
    })
    .catch((error)=>{
      console.log(error)
      mainWindow.webContents.send('result', ret)
    })
})

test = () => {
  // Antonyms
  console.log(wn instanceof wordNet)

  var white = new wn.Word('white')

  white
    .getAntonyms()
    .then(function (synsetArray) {
      console.log(synsetArray)
    })

  var high = new wn.Word('high')
  high
    .getAntonyms()
    .then(function (antonymArray) {
      console.log(antonymArray)
    })
}
test()

test2 = () => {
  // causeOf
  wn.fetchSynset('leak.v.1', function (err, synset) {
    synset
      .causeOf(function (err, data) {
        console.log(data)
      })
  })
}
test2()

domainTest = () => {
  var util = require('util')

  wn.fetchSynset('war.n.1').then(function (synset) {
    // console.log(synset)
    synset.getDomains().then(function (domain) {
      console.log(util.inspect(domain, null, 3))
    })
  })

  /*
  wn.fetchSynset("dance.v.2").then(function(synset){
    synset.getDomainTerms().then(function(domain){
      console.log(util.inspect(domain, null, 3))
    });
  })
  */
}
domainTest()
