Pod::Spec.new do |s|
  s.name         = 'OpenWeb3Lib'
  s.version      = '1.0.1'
  s.summary      = 'OpenWebLib is a powerful library for interacting with Web3 technologies.'
  s.description  = 'OpenWebLib is a comprehensive library that enables seamless interaction with Web3 technologies,
                                    offering features like smart contract integration, blockchain data querying, and more.'
  s.homepage     = 'https://docs.openweb3.io/docs/getting-started'
  s.license      = 'MIT'
  s.platform     = :ios
  s.ios.deployment_target = "13.0"
  s.author       = { 'OpenWeb3' => 'mtsocialdao@gmail.com' }
  s.source       = { :git => 'https://github.com/web3user1/OpenWeb3-IOS.git', :tag => s.version }
  s.requires_arc = true
  s.pod_target_xcconfig = { 'VALID_ARCHS' => 'arm64' }

  s.xcconfig = {
    'GENERATE_INFOPLIST_FILE' => 'YES'
  }

  s.framework = "UIKit"
  s.vendored_frameworks = 'OpenWeb3Lib-1.0.0/OpenWeb3Lib-1.0.0.xcframework'

end

