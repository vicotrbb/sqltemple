cask "sqltemple" do
  version "0.1.1"
  sha256 :no_check

  url "https://github.com/vicotrbb/sqltemple/releases/download/v#{version}/SQLTemple-#{version}-universal.dmg",
      verified: "github.com/vicotrbb/sqltemple/"
  name "SQLTemple"
  desc "Modern, AI-powered SQL IDE"
  homepage "https://github.com/vicotrbb/sqltemple"

  depends_on macos: ">= :monterey"

  app "SQLTemple.app"

  zap trash: [
    "~/Library/Application Support/sqltemple",
    "~/Library/Preferences/dev.victorbona.sqltemple.plist",
    "~/Library/Logs/sqltemple",
  ]

  caveats <<~EOS
    The current macOS build is not yet notarized. After installation you may need
    to right-click the app in Finder and choose "Open" the first time to bypass
    Gatekeeper.
  EOS
end
