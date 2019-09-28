const path = require('path')
const fs = require('fs')
const rimraf = require('rimraf')
const { deepMerge, logData, setLogs, isStr, isObj, get } = require('jsutils')
const { validateApp } = require('./helpers')

const APP_CONFIG_NAME = 'app.json'
/**
 * Gets the path to the app.json tap folder
 * @param {string} appRoot - Root directory of the mobile keg
 * @param {Object} appConfig - mobile keg app.json config
 *
 * @returns {string} - path to the base tap
 */
const getBaseTapPath = (appRoot, appConfig) => {
  const { baseTap } = get(appConfig, [ 'tapResolver', 'paths' ], {})
  return baseTap
    ? path.join(appRoot, baseTap)
    : path.join(appRoot, `/taps/`, appConfig.name)
}

/**
 * Get the name of the active tap from the passed in param, ENV, app.json config
 * @param {string} tapName - name of the active tap
 * @param {Object} appConfig - mobile keg app.json config
 *
 * @returns {string} - name of the active tap
 */
const getActiveTapName = (appConfig, tapName) => {
  const { CLIENT } = process.env
  return tapName || CLIENT || appConfig.name
}

/**
 * Gets the location of the active taps directory
 * <br> First checks root_dir/node_modules/zr-rn-taps/CLIENT_NAME
 * <br> Next checks root_dir/taps/CLIENT_NAME
 * @param {string} appRoot - Root directory of the mobile keg
 * @param {Object} appConfig - Root app.json config
 * @param {string} CLIENT_NAME - Name of the active tap
 *
 * @returns {string} - Path to the active tap folder, or null if no path exists on disk. 
 */
const getTapPath = (appRoot, appConfig, tapName) => {
  const { externalTaps, localTaps } = get(appConfig, [ 'tapResolver', 'paths' ], {})

  // Get External taps root path
  const externalTap = path.join(appRoot, externalTaps, tapName)

  // Get Local tap path
  const localTap = path.join(appRoot, localTaps, tapName)

  // returns local tap if it exists
  return fs.existsSync(localTap)
    ? localTap
    // Else check for external tap
    : fs.existsSync(externalTap)
      ? externalTap
      : null
}

/**
 * Try's to remove the fold temp folder if it exists
 * @param {string} TEMP_FOLDER_PATH - Path to the config temp folder
 *
 * @returns {void}
 */
const cleanupOldTempConfig = TEMP_FOLDER_PATH => {
  // Try to remove the current temp file if it exits
  try {
    rimraf.sync(TEMP_FOLDER_PATH)
  }
  catch (e) {
    // If there is a different error then the folder doesn't exist, throw it
    if (e.code !== 'ENOENT') throw e
  }
}

/**
 * Joins the app config root with the taps config
 * <br> Writes the joined config to disk inside a temp folder
 * @param {Object} appConfig - default app.json config
 * @param {string} CLIENT_PATH - Path to the taps folder
 * @param {string} TEMP_FOLDER_PATH - Path to the temp folder
 *
 * @returns {Object} - Merged app config, and it's path
 */
const buildJoinedConfigs = (appConfig, CLIENT_PATH, TEMP_FOLDER_PATH) => {
  // Join the root config with the tap config
  const joinedConfig = deepMerge(
    appConfig,
    require(path.join(CLIENT_PATH, APP_CONFIG_NAME))
  )

  // Rebuild the temp folder path
  fs.mkdirSync(TEMP_FOLDER_PATH)

  // Build the temp config path
  const TEMP_CONFIG_PATH = path.join(TEMP_FOLDER_PATH, APP_CONFIG_NAME)

  // Write the temp config file
  fs.writeFileSync(
    path.join(TEMP_FOLDER_PATH, APP_CONFIG_NAME),
    JSON.stringify(joinedConfig),
    'utf8'
  )

  return { APP_CONFIG: joinedConfig, APP_CONFIG_PATH: TEMP_CONFIG_PATH }
}

/**
 * Looks up the taps app.json file and joins it with the default app.json
 * <br> Writes the joined config to disk inside a temp folder
 * @param {string} appRoot - Root directory of the mobile keg
 * @param {Object} appConfig - default app.json config
 * @param {string} CLIENT_PATH - path to the tap folder
 * @param {boolean} HAS_CLIENT - if an active tap is set
 *
 * @returns {Object} - Merged app config, and it's path
 */
const setupTapConfig = (appRoot, appConfig, CLIENT_PATH, HAS_CLIENT) => {
  const APP_CONFIG_PATH = path.join(appRoot, APP_CONFIG_NAME)

  // Data to load tap from
  let tapData = { APP_CONFIG: appConfig, APP_CONFIG_PATH: APP_CONFIG_PATH }

  // If no tap just return the default tapData
  if(!HAS_CLIENT) return tapData

  // build the temp folder path
  const TEMP_FOLDER_PATH = path.join(CLIENT_PATH, 'temp')
  cleanupOldTempConfig(TEMP_FOLDER_PATH)

  try {
    // Join the root config with the tap config
    tapData = buildJoinedConfigs(appConfig, CLIENT_PATH, TEMP_FOLDER_PATH)
  }
  catch (e) {
    // If there's an error, just show the message, and will return the default tapData
    logData(e.message, 'warn')
  }

  return tapData
}

/**
 * Sets up a the taps folder based on the app.json config
 * <br> Builds the paths for the current CLIENT based on ENV or app.json config
 * @param {string} appRoot - Root directory of the mobile keg
 * @param {string} tapName - name of the active tap
 *
 * @returns {Object} - Build constants and paths data for the active tap
 */
module.exports = (appRoot, appConfig, tapName) => {

  // Ensure the required app data exists
  validateApp(appRoot, appConfig)

  // Set the default tap path
  const BASE_PATH = getBaseTapPath(appRoot, appConfig)

  // Get the name of the active tap
  const CLIENT_NAME = getActiveTapName(appConfig, tapName)

  // Flag set if the active tap is different from the default root tap
  const HAS_CLIENT = Boolean(CLIENT_NAME !== appConfig.name)

  // Set the tap path if an active tap is set
  const CLIENT_PATH = HAS_CLIENT
    ? getTapPath(appRoot, appConfig, CLIENT_NAME)
    : BASE_PATH

  // Get the path to the app config ( either the appConfig or joined temp config )
  const { APP_CONFIG, APP_CONFIG_PATH } = setupTapConfig(
    appRoot,
    appConfig,
    CLIENT_PATH,
    HAS_CLIENT
  )

  !HAS_CLIENT && logData(
    `No tap folder found at ${CLIENT_PATH}, using defaults at ${BASE_PATH}`,
    'warn'
  )

  return {
    APP_CONFIG,
    APP_CONFIG_PATH,
    BASE_PATH,
    CLIENT_NAME,
    CLIENT_PATH,
    HAS_CLIENT
  }
}
