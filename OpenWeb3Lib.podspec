Pod::Spec.new do |s|
  s.name         = 'OpenWeb3Lib'
  s.version      = '1.0.3-swift6.0.2'
  s.summary      = 'OpenWebLib is a powerful library for interacting with Web3 technologies.'
  s.description  = 'OpenWebLib is a comprehensive library that enables seamless interaction with Web3 technologies,
                                    offering features like smart contract integration, blockchain data querying, and more.'
  s.homepage     = 'https://docs.openweb3.io/docs/getting-started'
  s.license      = 'MIT'
  s.platform     = :ios, "13.0"
  s.author       = { 'OpenWeb3' => 'mtsocialdao@gmail.com' }
  s.source       = { :git => 'https://github.com/web3user1/OpenWeb3-IOS.git', :tag => "1.0.3" }
  s.requires_arc = true

  s.vendored_frameworks = 'Frameworks/swift6.0.2/OpenWeb3Lib.xcframework'

  s.xcconfig = {
    'GENERATE_INFOPLIST_FILE' => 'YES',
  }

  s.pod_target_xcconfig = {
    'VALID_ARCHS' => 'x86_64 arm64'
  }

end