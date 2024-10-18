Pod::Spec.new do |s|
  s.name         = 'OpenWeb3Lib'
  s.version      = '1.0.0'
  s.summary      = 'OpenWebLib is a powerful library for interacting with Web3 technologies.'
  s.description  = 'OpenWebLib is a comprehensive library that enables seamless interaction with Web3 technologies,
                                    offering features like smart contract integration, blockchain data querying, and more.'
  s.homepage     = 'https://docs.openweb3.io/docs/getting-started'
  s.license      = 'MIT'
  s.platform     = :ios, '13.0'
  s.author       = { 'OpenWeb3' => 'mtsocialdao@gmail.com' }
  s.source       = { :git => 'https://github.com/web3user1/OpenWeb3-IOS.git', :tag => s.version }

  s.xcconfig = {
    'GENERATE_INFOPLIST_FILE' => 'YES'
  }

  s.subspec 'Swift5.9' do |ss|
    ss.vendored_frameworks = 'Frameworks/OpenWeb3Lib-Swift5.9.xcframework'
    s.swift_version = '5.9'
  end

  s.subspec 'Swift6.0' do |ss|
    ss.vendored_frameworks = 'Frameworks/OpenWeb3Lib-Swift6.0.xcframework'
    s.swift_version = '6.0'
  end
end

