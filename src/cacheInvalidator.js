const path = require('path')

const allFiles = [
  './buildAliases',
  './buildAssets',
  './buildTapList',
  './buildConstants',
  './getAppConfig',
  './contentResolver',
  './setup',
  './setupTap',
  './webResolver',
]

module.exports = () => {
  allFiles.map(file => {
    delete require.cache[require.resolve(path.join(__dirname, file))]
  })
}
