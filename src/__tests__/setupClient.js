const { FS } = require('../../mocks')
const appJson = Object.freeze(require('./app.json'))
const path = require('path')

jest.setMock('fs', FS)

// mocks out use in setupTapConfig~cleanupOldTempConfig
jest.mock('rimraf', () => ({
  sync: () => true  
}))

const setupTap = require('../setupTap')
const testTapName = "testTap"
const tapConfig = require(`../../taps/${testTapName}/app.json`)

describe('Setup Tap', () => {
  const testAppRoot = "../" // tap-resolver root
  beforeEach(() => {
    global.testMocks.fs = { 
      stat: true, 
      exists: true,
      existsSync: true,
      mkdirSync: true,
      writeFileSync: true
    } 
  })
  
  it('should fail if appRoot is null', () => {
    expect(() => setupTap(null, {}, testTapName))
      .toThrow(Error)
  })

  it('should fail if appConfig is null', () => {
    expect(() => setupTap("", null, testTapName))
      .toThrow(Error)
  })

  it('should return a valid base path', () => {
    const { BASE_PATH } = setupTap(testAppRoot, appJson, testTapName)
    const expectedPath = path.join(testAppRoot, 'base')
    expect(BASE_PATH).toBe(expectedPath)
  })

  it('should provide the name of the tap from all sources (argument, node env, or appJson)', () => {
    const { TAP_NAME } = setupTap(testAppRoot, appJson, testTapName)
    expect(TAP_NAME).toBe(testTapName)

    const { TAP_NAME: nameFromConfig } = setupTap(testAppRoot, appJson, null)
    expect(nameFromConfig).toBe(appJson.name)

    const envName = "Fight Milk Inc."
    process.env.TAP = envName
    const { TAP_NAME: nameFromNodeEnv } = setupTap(testAppRoot, appJson, null)
    expect(nameFromNodeEnv).toBe(envName)
    delete process.env["TAP"]
  })

  it('should indicate if a tap folder exists or not', () => {
    const { HAS_TAP } = setupTap(testAppRoot, appJson, null)
    expect(HAS_TAP).toBe(false)

    const { HAS_TAP: tapDefined } = setupTap(testAppRoot, appJson, testTapName)
    expect(tapDefined).toBe(true)
  })

  it('should provide an app config object that is merged from the app configs of the tap and the root app', () => {
    const { APP_CONFIG, APP_CONFIG_PATH } = setupTap(testAppRoot, appJson, testTapName)
    
    // verify the name was overwritten with the tap's name
    expect(APP_CONFIG.name).toEqual(testTapName)

    // verify it uses the root appJson paths, since the test tap app json didn't define those
    expect(APP_CONFIG.tapResolver.paths).toEqual(appJson.tapResolver.paths)
  })
})
