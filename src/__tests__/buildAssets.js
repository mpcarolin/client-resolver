const { FS } = require('../../mocks')
const appConfig = require('./app.json')
jest.setMock('fs', FS)

const basePath = './base'
const tapPath = 'taps/test'
const buildAssets = require('../buildAssets')

describe('Build Assets', () => {
  
  beforeEach(() => {
    global.testMocks.fs = {
      readdirSync: [ 'test.png', 'duper.jpg', 'no_ext', 'bad.ext' ]
    }
  })
  
  it('Should write the tap assets to file with fs.writeFileSync', () => {

    const assetsPath = buildAssets(appConfig, basePath, tapPath)
    const savePath = FS.writeFileSync.mock.calls[0][0]

    expect(FS.readdirSync).toHaveBeenCalledWith(`${tapPath}/assets`)
    expect(FS.writeFileSync).toHaveBeenCalled()
    expect(savePath).toBe('taps/test/assets/index.js')

  })

  it('Should only include allowed extensions', () => {

    const assetsPath = buildAssets(appConfig, basePath, tapPath)
    const saveContent = FS.writeFileSync.mock.calls[0][1]

    expect(saveContent.indexOf('duper.jpg')).not.toEqual(-1)
    expect(saveContent.indexOf('test.png')).not.toEqual(-1)
    expect(saveContent.indexOf('no_ext')).toEqual(-1)
    expect(saveContent.indexOf('bad.ext')).toEqual(-1)

  })

  it('Should use the base assets path when no tap assets path is set', () => {
    const confCopy = {
      ...appConfig,
      tapResolver: {
        ...appConfig.tapResolver,
        paths: { ...appConfig.tapResolver.paths, tapAssets: undefined }
      }
    }
    
    const assetsPath = buildAssets(confCopy, basePath, tapPath)
    const savePath = FS.writeFileSync.mock.calls[2][0]

    expect(savePath).toBe('base/assets/index.js')

  })

})
