import UIKit
import OpenWeb3Lib  
import WebKit

extension TrustWeb3Provider {
    static func createEthereum(address: String, chainId: Int, rpcUrl: String) -> TrustWeb3Provider {
        return TrustWeb3Provider(config: .init(ethereum: .init(address: address, chainId: chainId, rpcUrl: rpcUrl)))
    }
}

class WalletBridgeProvider : BridgeProvider {
    
    var messageHandler: WKScriptMessageHandler?
    
    var current: TrustWeb3Provider = TrustWeb3Provider(config: .init(ethereum: ethereumConfigs[0]))

    var providers: [Int: TrustWeb3Provider] = {
        var result = [Int: TrustWeb3Provider]()
        ethereumConfigs.forEach {
            result[$0.chainId] = TrustWeb3Provider(config: .init(ethereum: $0))
        }
        return result
    }()

    static var ethereumConfigs = [
        TrustWeb3Provider.Config.EthereumConfig(
            address: "0x9d8a62f656a8d1615c1294fd71e9cfb3e4855a4f",
            chainId: 1,
            rpcUrl: "https://cloudflare-eth.com"
        ),
        TrustWeb3Provider.Config.EthereumConfig(
            address: "0x9d8a62f656a8d1615c1294fd71e9cfb3e4855a4f",
            chainId: 10,
            rpcUrl: "https://mainnet.optimism.io"
        ),
        TrustWeb3Provider.Config.EthereumConfig(
            address: "0x9d8a62f656a8d1615c1294fd71e9cfb3e4855a4f",
            chainId: 56,
            rpcUrl: "https://bsc-dataseed4.ninicoin.io"
        ),
        TrustWeb3Provider.Config.EthereumConfig(
            address: "0x9d8a62f656a8d1615c1294fd71e9cfb3e4855a4f",
            chainId: 137,
            rpcUrl: "https://polygon-rpc.com"
        ),
        TrustWeb3Provider.Config.EthereumConfig(
            address: "0x9d8a62f656a8d1615c1294fd71e9cfb3e4855a4f",
            chainId: 250,
            rpcUrl: "https://rpc.ftm.tools"
        ),
        TrustWeb3Provider.Config.EthereumConfig(
            address: "0x9d8a62f656a8d1615c1294fd71e9cfb3e4855a4f",
            chainId: 42161,
            rpcUrl: "https://arb1.arbitrum.io/rpc"
        )
    ]

    var cosmosChains = ["osmosis-1", "cosmoshub", "cosmoshub-4", "kava_2222-10", "evmos_9001-2"]
    var currentCosmosChain = "osmosis-1"
    
    func onWebViewCreated(_ webView: WKWebView) {
        inject(contentController: webView.configuration.userContentController)
    }
    
    func onWebViewDestroy() {
        
    }
    
    func onWebPageLoaded() {
        
    }
    
    var navigationDelegate: () -> (any WKNavigationDelegate)? = {
        return nil
    }
    
    var uIDelegate: () -> (any WKUIDelegate)? = {
        return nil
    }
    
    func inject(contentController: WKUserContentController) {
        contentController.addUserScript(current.providerScript)
        contentController.addUserScript(current.injectScript)
        if let messageHandler = self.messageHandler {
            contentController.add(messageHandler, name: TrustWeb3Provider.scriptHandlerName)
        }
    }
    
}

extension ViewController: WKScriptMessageHandler {
    
    private func extractMethod(json: [String: Any]) -> DAppMethod? {
        guard
            let name = json["name"] as? String
        else {
            return nil
        }
        return DAppMethod(rawValue: name)
    }

    private func extractNetwork(json: [String: Any]) -> ProviderNetwork? {
        guard
            let network = json["network"] as? String
        else {
            return nil
        }
        return ProviderNetwork(rawValue: network)
    }

    private func extractChainInfo(json: [String: Any]) ->(chainId: Int, name: String, rpcUrls: [String])? {
        guard
            let params = json["object"] as? [String: Any],
            let string = params["chainId"] as? String,
            let chainId = Int(String(string.dropFirst(2)), radix: 16),
            let name = params["chainName"] as? String,
            let urls = params["rpcUrls"] as? [String]
        else {
            return nil
        }
        return (chainId: chainId, name: name, rpcUrls: urls)
    }

    private func extractCosmosChainId(json: [String: Any]) -> String? {
        guard
            let params = json["object"] as? [String: Any],
            let chainId = params["chainId"] as? String
        else {
            return nil
        }
        return chainId
    }

    private func extractEthereumChainId(json: [String: Any]) -> Int? {
        guard
            let params = json["object"] as? [String: Any],
            let string = params["chainId"] as? String,
            let chainId = Int(String(string.dropFirst(2)), radix: 16),
            chainId > 0
        else {
            return nil
        }
        return chainId
    }

    private func extractRaw(json: [String: Any]) -> String? {
        guard
            let params = json["object"] as? [String: Any],
            let raw = params["raw"] as? String
        else {
            return nil
        }
        return raw
    }

    private func extractMode(json: [String: Any]) -> String? {
        guard
            let params = json["object"] as? [String: Any],
            let mode = params["mode"] as? String
        else {
            return nil
        }

        switch mode {
          case "async":
            return "BROADCAST_MODE_ASYNC"
          case "block":
            return "BROADCAST_MODE_BLOCK"
          case "sync":
            return "BROADCAST_MODE_SYNC"
          default:
            return "BROADCAST_MODE_UNSPECIFIED"
        }
    }
    
    
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        let json = message.json
        print(json)
        guard
            let method = extractMethod(json: json),
            let id = json["id"] as? Int64,
            let network = extractNetwork(json: json)
        else {
            return
        }
        switch method {
        case .requestAccounts:
            print("TODO method: requestAccounts")
        case .signTransaction:
            print("TODO method: signTransaction")
        case .signRawTransaction:
            print("TODO method: signRawTransaction")
        case .signMessage:
            print("TODO method: signMessage")
        case .signPersonalMessage:
            print("TODO method: signPersonalMessage")
        case .signTypedMessage:
            print("TODO method: signTypedMessage")
        case .sendTransaction:
            print("TODO method: sendTransaction")
        case .ecRecover:
            print("TODO method: ecRecover")
        case .addEthereumChain:
            print("TODO method: addEthereumChain")
        case .switchChain, .switchEthereumChain:
            print("TODO method: switchChain/switchEthereumChain")
        default:
            break
        }
    }
}

class ViewController: UIViewController {
    
    var chatViewController: ChatViewController?
    
    @IBOutlet weak var urlInputTextView: UITextView!
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        let url = "https://app.animeswap.org/#/?chain=aptos_devnet"
        
        urlInputTextView.text = url

        MiniSDKManager.shared.setupMiniAppService()
    }
    
    @IBAction func onTabLaunchWithUrl(_ sender: Any) {
        
        let url = urlInputTextView.text
        
        if false == url?.starts(with: "https://") {
            return
        }
        
        do{
            let config = try WebAppLaunchWithDialogParameters.Builder()
                .parentVC(self)
                .url(url)
                .completion()
                .build()
            
            let _ = MiniSDKManager.shared.miniAppService.launch(config: config)
        }
        catch {
            print("An error occurred: \(error)")
        }

    }
    
    @IBAction func onTabLaunchDApp(_ sender: Any) {
        let url = urlInputTextView.text
        
        if false == url?.starts(with: "https://") {
            return
        }
        
        do{
            let walletProvider = WalletBridgeProvider()
            walletProvider.messageHandler = self
            
            let config = try DAppLaunchParameters.Builder()
                .parentVC(self)
                .url(url)
                .bridgeProvider(walletProvider)
                .completion()
                .build()
            
            let _ = MiniSDKManager.shared.miniAppService.launch(config: config)
        }
        catch {
            print("An error occurred: \(error)")
        }
    }
    
    @IBAction func onTabLaunchLocalDemo(_ sender: Any) {
        
        do{
            let config = try WebAppLaunchWithDialogParameters.Builder()
                .parentVC(self)
                .botName("mini")
                .miniAppName("mini")
                .autoExpand(false)
                .useCache(false)
                .isLocalSource(true)
                .getActionBarNode({ dismissInvoker, shareInvoker in
                    
                    let toolBarWidth: CGFloat = 100.0
                    let toolBarHeight: CGFloat = 35.0
                    let toolBarX = UIScreen.main.bounds.size.width - toolBarWidth - 16
                    let toolBarY = CGFloat(50.0)
                    
                    let toolBar = ActionBarContainer(frame: CGRect(x: toolBarX, y: toolBarY, width: toolBarWidth, height: toolBarHeight))
                    
                    toolBar.dismiss = {
                        dismissInvoker()
                    }
                    
                    toolBar.share = {
                        shareInvoker()
                    }
                    
                    return (CGSize(width: toolBarWidth, height: toolBarHeight), toolBar)
                })
                .build()
            
            let minApp = MiniSDKManager.shared.miniAppService.launch(config: config)
            
            DispatchQueue.main.asyncAfter(deadline: .now() + 3) { [weak self] in
                guard let weakSelf = self else {
                    return
                }
                if let miniAppVc = minApp?.getVC() {
                    weakSelf.chatViewController = ChatViewController()
                    miniAppVc.navigationController?.pushViewController(weakSelf.chatViewController!, animated: true)
                }
            }
        }
        catch {
            print("An error occurred: \(error)")
        }
    }
    
    @IBAction func onTabLaunchOnChat(_ sender: Any) {
        chatViewController = ChatViewController()
        self.navigationController?.pushViewController(chatViewController!, animated: true)
    }
    
    @IBAction func onTabLaunchMarketPlace(_ sender: Any) {

        do{
            
            var components = URLComponents()

            components.queryItems = [
                URLQueryItem(name: "roomId", value: "1"),
                URLQueryItem(name: "roomName", value: "Test Tribe"),
                URLQueryItem(name: "roomAvatar", value: "https://thumb.ac-illust.com/78/782445b4704adca448601a89d4b80f7c_w.jpeg"),
            ]
            
            
            let config = try WebAppLaunchWithDialogParameters.Builder()
                .parentVC(self)
//                .url("https://game.bt.qiku.net/games/fruittri?code=LuLT2PdXscbH3TOmTpX+LVnPClMHSZFa66v7ygw40CExOCQXfkUaBZzEeM+hoOtW&channel=telegram&lan=zh-hans")
                .miniAppId("10")
                .startParams(components.query)
                .build()
            
            MiniSDKManager.shared.miniAppService.launch(config: config)
        }
        catch {
            print("An error occurred: \(error)")
        }
    }
    
    @IBAction func onTabLaunchAppMarster(_ sender: Any) {
        
        do{
            let config = try WebAppLaunchWithDialogParameters.Builder()
                .parentVC(self)
                .miniAppId("2lv8dp7JjF2AU0iEk2rMYUaySjU")
                .build()
            
            MiniSDKManager.shared.miniAppService.launch(config: config)
        }
        catch {
            print("An error occurred: \(error)")
        }
    }
}
