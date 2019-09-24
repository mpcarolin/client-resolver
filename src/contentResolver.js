const fs = require('fs')
const path = require('path')
const { logData, get } = require('jsutils')
const { validateApp, isDirectory } = require('./helpers')
const { LOG } = process.env

// File path cache, holds the path to a found file, so it doesn't have to look it up again
const FULL_PATH_CACHE = {}

/**
 * Clears out the path cache when switching to a new client
 */
const resetFullPathCache = () => {
  Object.keys(FULL_PATH_CACHE)
    .map(key => {
      delete FULL_PATH_CACHE[key]
    })
}

/**
 * Checks if the path is a directory, and if so adds index to it
 * @param {string} fullPath - path to be check for a directory
 *
 * @returns {string} - updated file path
 */
const checkAddIndex = (fullPath) => {
  return isDirectory(fullPath, true)
    ? path.join(fullPath, 'index')
    : fullPath
}

/**
 * Dynamically load client files from the clients folder
 * If no file exists, then load from the base client
 * @param  { string } type - folder to search for file i.e. components/assets
 *
 * @return { Function } - a function that returns a string path to file
 */
module.exports = (appConfig, aliasMap, content, type) => {
  // Ensure the required app data exists
  validateApp('_', appConfig)
  
  const nameSpace = get(appConfig, [ 'clientResolver', 'aliases', 'nameSpace' ], '')
  
  return match => {
    // Check if 'index' should be added to the file path
    // This allows loading the index.js of a folder
    const fullPath = checkAddIndex(
      // Build the path based on the client alias
      // Example: root_dir/clients/:client_name/:type/:file_name
      // - w/o extension
      path.join(aliasMap[ `${nameSpace}Client` ], type, match[1])
    )

    // Check if the file has been loaded already
    // If it has, just return the cached path
    if (FULL_PATH_CACHE[fullPath]) return FULL_PATH_CACHE[fullPath]

    // Check if the file exists without any added extensions
    //  Example: root_dir/clients/:client_name/assets/platform.sqlite
    let validPath = fs.existsSync(fullPath)

    // Loop the allowed extensions and check if any of the paths + extensions exist at the client path
    validPath = validPath ||
      content.extensions
        .reduce((hasExt, ext) => {
          // Example: root_dir/clients/:client_name/:type/:file_name.js
          // - with extension
          return !hasExt && fs.existsSync(`${fullPath}${ext}`) ? true : hasExt
        }, false)

    // If there is a valid path, use it
    // Otherwise use the default base path
    // Base path - root_dir/core/base/:type/:file_name.js
    FULL_PATH_CACHE[fullPath] = validPath
      ? fullPath
      : path.join(content.basePath, type, match[1])

    LOG && logData(`Loading file from ${FULL_PATH_CACHE[fullPath]}`)

    return FULL_PATH_CACHE[fullPath]
  }
}