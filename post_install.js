const fs = require('fs')
const path = require('path')
const rootDir = path.join(__dirname)

/**
 * Sets up zr-rn-taps folder in node_modules ( temporary )
 */
const setupRNTap = () => {
  const rnTapFiles = [
    path.join(rootDir, './node_modules/external-test-taps'),
    path.join(rootDir, './node_modules/external-test-taps/taps'),
    path.join(rootDir, './taps'),
  ]
  rnTapFiles.map(file => !fs.existsSync(file) && fs.mkdirSync(file))
}

// Ensure the external-test-taps folder exists
setupRNTap()
