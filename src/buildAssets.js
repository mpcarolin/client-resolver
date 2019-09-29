const fs = require('fs')
const path = require('path')
const { get, isStr } = require('jsutils')
const tapConstants = require('./tapConstants')

/**
 * Gets all the asset files names from the passed in tapAssetPath
 * @param {string} tapAssetPath - path to the taps assets folder
 * @param {Array} extensions - Allowed asset extensions
 *
 * @returns {Array} - all assets found for the passed in tap
 */
const assetFileNames = (tapAssetPath, extensions=[]) => {

  // Get all allowed extensions
  const allExtensions = get(tapConstants, [ 'extensions', 'assets' ], []).concat(extensions)

  // Create an Array from the assets found at the tapAssetPath
  return Array.from(
    // Use Set to ensure all files are unique
    new Set(
      // Read all the files from the passed in path
      fs.readdirSync(tapAssetPath)
        // Filter out any that don't match the allowed asset extensions
        .filter(file => allExtensions.indexOf(`.${ file.split('.').pop() }`) !== -1)
    )
  )
}

/**
 * Generates a tap image cache file, which allows loading tap specific images
 * @param {*} BASE_PATH - base directory of the app components
 * @param {*} CLIENT_NAME - name of the tap folder where the assets exist
 * @param {*} CLIENT_PATH - path to the taps folder
 *
 * @returns {Object} - path to taps assets
 */
module.exports = (appConf, BASE_PATH, CLIENT_PATH, extensions) => {

  // Get the tap assets defined path from the app config
  const tapAssets = get(appConf, [ 'tapResolver', 'paths', 'tapAssets' ])

  // Check the tap assets, if none, use the base assets
  const tapAssetPath = !tapAssets || !isStr(tapAssets)
    ? path.join(BASE_PATH, 'assets')
    : path.join(CLIENT_PATH, tapAssets)

  // Gets all the images assets in the taps assets folder
  let properties = assetFileNames(tapAssetPath, extensions)
    .map(name => `${name.split('.').shift()}: require('${tapAssetPath}/${name}')`)
    .join(',\n  ')

  // Ass the assets content to the assets object
  const string = `const assets = {\n  ${properties}\n}\n\nexport default assets`

  // Build the location to save the assets
  const assetsPath = `${tapAssetPath}/index.js`
 
  // Write the file to the assets location
  fs.writeFileSync(assetsPath, string, 'utf8')

  // Return the path of the new assets file
  return assetsPath
}