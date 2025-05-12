// setup-certs.js
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

/**
 * Automatically sets up mkcert and generates necessary certificates
 * @param {string} certDir - Directory to store certificates
 * @param {string} domain - Domain name for the certificate (default: "*.nip.io")
 */
function setupCertificates(certDir = "cert", domain = "*.nip.io") {
  console.log("Checking mkcert installation and certificates...");

  // Create cert directory if it doesn't exist
  if (!fs.existsSync(certDir)) {
    console.log(`Creating ${certDir} directory...`);
    fs.mkdirSync(certDir, { recursive: true });
  }

  const certPath = path.join(certDir, `_wildcard.nip.io+3.pem`);
  const keyPath = path.join(certDir, `_wildcard.nip.io+3-key.pem`);

  // Check if certificates already exist
  if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
    console.log("Certificates already exist. Using existing certificates.");
    return { certPath, keyPath };
  }

  try {
    // Check if mkcert is installed
    try {
      execSync("mkcert -version", { stdio: "ignore" });
      console.log("mkcert is already installed.");
    } catch (error) {
      console.log("mkcert not found. Please install mkcert first.");
      console.log("Installation instructions:");
      console.log("- macOS: brew install mkcert");
      console.log("- Windows: choco install mkcert");
      console.log(
        "- Linux: Follow instructions at https://github.com/FiloSottile/mkcert"
      );
      throw new Error("mkcert not installed");
    }

    // Install mkcert CA if not already installed
    console.log("Installing mkcert CA...");
    execSync("mkcert -install", { stdio: "inherit" });

    // Generate certificates
    console.log(`Generating certificates for ${domain}...`);
    execSync(
      `mkcert -cert-file ${certPath} -key-file ${keyPath} "${domain}" localhost 127.0.0.1 ::1`,
      {
        stdio: "inherit",
        cwd: process.cwd(),
      }
    );

    console.log("Certificates generated successfully!");
    return { certPath, keyPath };
  } catch (error) {
    console.error("Error setting up certificates:", error.message);
    throw error;
  }
}

module.exports = setupCertificates;

// If script is run directly
if (require.main === module) {
  setupCertificates();
}
