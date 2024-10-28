import UIKit
import OpenWeb3Lib  
import WebKit

class MyJsBridgeProvider : BridgeProvider {
    
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
        
    }
    
}

//class CDVWKWeakScriptMessageHandler: NSObject, WKScriptMessageHandler {
//    weak var scriptMessageHandler: WKScriptMessageHandler?
//
//    init(scriptMessageHandler: WKScriptMessageHandler) {
//        self.scriptMessageHandler = scriptMessageHandler
//    }
//
//    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
//        scriptMessageHandler?.userContentController(userContentController, didReceive: message)
//    }
//}
//
//
//class WalletBridgeProvider : BridgeProvider, WKScriptMessageHandler {
//
//    var webView: WKWebView? = nil
//
//    var navigationDelegate: () -> WKNavigationDelegate? = {
//        return nil
//    }
//
//    var uIDelegate: () -> WKUIDelegate? = {
//        return nil
//    }
//
//    func onWebViewCreated(_ webView: WKWebView) {
//        self.webView = webView
//    }
//
//    func onWebViewDestroy() {
//        self.webView = nil
//    }
//
//     func onWebPageLoaded() {
//
//     }
//
//
//    func inject(contentController: WKUserContentController) {
//
//        let wkUController = contentController
//
//        let weakScriptMessageHandler = CDVWKWeakScriptMessageHandler(scriptMessageHandler: self)
//
//        // 添加 JavaScript 消息处理器
//        wkUController.add(weakScriptMessageHandler, name: Web3ProviderManager.shared.getScriptHandlerName())
//        wkUController.add(weakScriptMessageHandler, name: "ZapryJS")
//
//
//        // 获取当前语言
//        let currentLang = "en"
//        // 生成 callbackJs 的内容
//        let callbackJs = """
//            function callback()  {
//                window.mimoWallet.postMessage = function(data) {
//                    window.webkit.messageHandlers.sendData.postMessage(JSON.stringify(data));
//                };
//                window.dispatchEvent(new Event('ethereum#initialized'));
//                window.removeEventListener('mimoWallet#initialized', callback);
//            };
//            window.getLocalLanguage = function() { return '\(currentLang)'; };
//            window.addEventListener('mimoWallet#initialized', callback);
//            window.ZapryJS = {
//                callNative: function (data) {
//                    window.webkit.messageHandlers.sendData.postMessage(data);
//                }
//            };
//            """
//
//        // 获取 dAppInject.js 文件的路径
//        if let injectJs = Bundle.main.path(forResource: "dAppInject", ofType: "js") {
//            do {
//                // 将文件内容读取为 Data
//                let injectJsData = try Data(contentsOf: URL(fileURLWithPath: injectJs))
//
//                // 将 Data 转换为 String
//                if let injectJsString = String(data: injectJsData, encoding: .utf8) {
//
//                    // 组合 callbackJs 和 injectJsString
//                    let totalJs = "\(callbackJs)\(injectJsString)"
//
//                    // 在此处可以使用 totalJs
//                    let wkUScript = WKUserScript(source: totalJs, injectionTime: .atDocumentStart, forMainFrameOnly: true)
//                    wkUController.addUserScript(wkUScript)
//
//                    // 获取 TronRPC 的 URL
//                    let tronRPC = self.getTronRPCUrl()
//
//                    // 设置 Web3ProviderManager 的信任环境
//                    Web3ProviderManager.shared.setTrustWeb3Provider(withAddress: self.address, chainId: self.chainInfo.chainId, rpcUrl: self.chainInfo.hosts.first, tronRpcUrl: tronRPC)
//
//                    // 注入 Web3ProviderManager 的脚本
//                    if let web3InjectScript = Web3ProviderManager.shared.getInjectScript {
//                        wkUController.addUserScript(web3InjectScript)
//                    }
//
//                    // 如果有控制台的 JS 数据
//                    if let consoleJSdata = self.consoleJSdata, !consoleJSdata.isEmpty {
//                        let consoleUScript = WKUserScript(source: consoleJSdata, injectionTime: .atDocumentStart, forMainFrameOnly: true)
//                        wkUController.addUserScript(consoleUScript)
//
//                        // 使用弱引用来避免循环引用
//                        weak var weakSelf = self
//                        DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
//                            let js = "(function() {new VConsole()})()"
//                            weakSelf?.webView?.evaluateJavaScript(js, completion: { result, error in
//                                // 处理结果或错误
//                            })
//                        }
//                    }
//
//                    // 执行 JS 脚本
//                    self.webView?.evaluateJavaScript(jsData, completion: { result, error in
//                        // 处理结果或错误
//                    })
//                }
//            } catch {
//                // 错误处理：如果读取文件或转换失败
//                print("Error loading or converting file: \(error)")
//            }
//        }
//    }
//
//    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
//        guard let dict = Web3ProviderManager.shared.getMsgJsonWithMessage(message) else {
//            return
//        }
//
//        print("shy:sendData====>\(dict) ;name = \(message.name);")
//
//        if message.name == "sendData" {
//            // 记录日志
//            reportLogWithReceiveScriptMessage(dict)
//
//            // 转换为 DAppSendDataModel 模型
//            if let model = Web3ProviderManager.covertDictToModel(with: dict) {
//                // 针对 Tron 网络的 signMessage 特殊处理
//                if model.network == NETWORK_TRON_NAME && model.name == "signMessage" {
//                    if let object = dict["object"] as? [String: Any], !object.isEmpty {
//                        if let params = object["params"] as? [String: Any] {
//                            model.object?.paramsDict = params
//                        }
//                    }
//                }
//                handleResponse(model)
//            }
//
//            // 处理 callbackId
//            if let callbackId = dict["callbackId"] as? String, !CommonUtil.isBlackString(callbackId) {
//
//                if callbackId.contains("getAppSession") {
//                    // H5 请求用户信息
//                    let appInfoJson = H5ViewController.getAppInfo()
//                    let jsonStr = "window.ZapryJS.nativeCallback('\(callbackId)','\(appInfoJson)')"
//                    self.webView?.evaluateJavaScript(jsonStr, completionHandler: nil)
//
//                } else if callbackId.contains("toNativePage") {
//                    // H5 请求跳转页面
//                    if let dataDic = dict["data"] as? [String: Any], let taskID = dataDic["taskID"] as? NSNumber {
//                        PointManager.shared.pushViewController(byTaskId: taskID.intValue, from: self)
//                    }
//
//                } else if callbackId.contains("receivePointNativeSync") {
//                    // H5 领取积分
//                    PointManager.shared.requestAndStoreUserPoints()
//                    if let dataDic = dict["data"] as? [String: Any], let taskID = dataDic["taskID"] as? NSNumber {
//                        PointManager.shared.resetTaskStatus(withTaskId: taskID.intValue, status: 2)
//                    }
//
//                } else if callbackId.contains("ActionCompleted") {
//                    // 完成任务后回调 H5
//                    cacheTaskDoneCallbackId = callbackId
//
//                } else if callbackId.contains("toInviteFriend") {
//                    // 显示邀请好友视图
//                    PointInviteCodeView.showInviteCodeView()
//                }
//            }
//        }
//    }
//
//    private func reportLogWithReceiveScriptMessage(_ dict: [String: Any]) {
//        do {
//            let reportJson = JSONUtil.dicToJsonString(with: dict)
//            if let reportJson = reportJson, !reportJson.isEmpty {
//                MMLogReporter.reportLog("dapp::receiveScriptMessage:\(reportJson)")
//            }
//        } catch {
//            // 处理异常
//        }
//    }
//
//
//    private func sendErrorToH5FromCancel(dataId: String) {
//        let dict: [String: Any] = ["errorCode": -99999, "message": "User Reject"]
//        let dictJson = JSONUtil.dicToJsonString(with: dict) ?? ""
//
//        let js = "window.ethereum.sendResponse(\(dataId), \(dictJson))"
//        self.webView?.evaluateJavaScript(js, completionHandler: nil)
//    }
//
//
//    private func handleResponse(_ data: DAppSendDataModel) {
//        weak var weakSelf = self
//
//        if data.name == "requestMIMOUserInfo" {
//            let js = self.mViewModel.requestMIMOUserInfo(withClubChannelModel: self.tribeId, isMaster: self.isMaster, withDappModel: data)
//            self.webView?.evaluateJavaScript(js) { result, error in
//                // 处理执行结果
//            }
//        }
//
//        else if data.name == "requestAccounts" {
//            self.checkWalletAddress(withNetWork: data.network)
//            if data.network == NETWORK_TRON_NAME {
//                self.chainInfo = AppDataManager.shared().getTronChainModel()
//            }
//            let js = "window.\(data.network).sendResponse(\(data.id), ['\(self.address)'])"
//            self.webView?.evaluateJavaScript(js) { result, error in
//                // 处理执行结果
//            }
//        }
//
//        else if data.name == "signMessage" {
//            self.signMessageType("signMessage", withResponseData: data)
//        }
//
//        else if data.name == "signPersonalMessage" {
//            self.signMessageType("signPersonalMessage", withResponseData: data)
//        }
//
//        else if data.name == "signTypedMessage" {
//            self.signMessageType("signTypedMessage", withResponseData: data)
//        }
//
//        else if data.name == "signTransaction" {
//            guard WalletSdkRnManager.shared().isLoadCompletion else {
//                MMToast.makeToast("正在加载中，请稍后重试", for: self.view)
//                return
//            }
//
//            guard let chainInfo = self.chainInfo else {
//                MMToast.makeToast("先切链重试", for: self.view)
//                return
//            }
//
//            let unit = chainInfo.tokens.first?.unit ?? 0.0
//            let pay = WalletManager.hexToTen(withHexValue: data.object.value, unit: unit)
//            let payString = StringUtil.formatAmountWithToken(withAmount: pay, scaleShow: chainInfo.tokens.first?.scaleShow ?? 0)
//
//            WalletSdkRnManager.shared().setTranscationCompletion { tx, errorMsg in
//                MMHUB.dissmiss(for: weakSelf?.view)
//                if let tx = tx, !tx.isEmpty {
//                    weakSelf?.mViewModel.tribeDappPayComformClick(chainInfo, withPayString: payString, withDappModel: weakSelf?.model, withTx: tx, withData: data)
//                    let js = "window.ethereum.sendResponse(\(data.id), '\(tx)')"
//                    weakSelf?.webView?.evaluateJavaScript(js) { result, error in
//                        WalletSdkRnManager.shared().setTranscationCompletion(nil)
//                    }
//                } else {
//                    DispatchQueue.main.async {
//                        WalletSdkRnManager.shared().setTranscationCompletion(nil)
//                        MMHUB.dissmiss(for: weakSelf?.view)
//                        let js = "window.ethereum.sendResponse(\(data.id), '\(errorMsg ?? "")')"
//                        print("shy:\(js)")
//                        weakSelf?.webView?.evaluateJavaScript(js) { result, error in
//                            // 处理执行结果
//                        }
//                    }
//                }
//            }
//
//            let payModel = PayModel()
//            payModel.to = data.object.to ?? ""
//            let dict = self.mViewModel.getTransaction(withPay: payString, objectModel: data.object, withChainInfo: chainInfo, withClubDapp: self.model, withUrl: self.url)
//            WalletSdkRNModule.emitEvent(withName: "Notify_Send_Transaction", andPayload: dict)
//        }
//
//        else if data.name == "switchEthereumChain" {
//            guard UIViewController.current() == self else { return }
//
//            guard let chainInfo = AppDataManager.shared().getWeb3Chain(withChainIdStr: data.object.chainId, chainName: data.network.lowercased()) else {
//                let chainIdStr = data.object.chainId ?? ""
//                let chainDatasCount = AppDataManager.shared().getChainDataCount()
//                MMToast.makeToast("\(NSI18n.shared.d_app_not_support) \(chainIdStr)", for: self.view)
//                MMLogReporter.reportLog("check1:chainId:\(chainIdStr),chainDatasCount:\(chainDatasCount)")
//                return
//            }
//
//            self.chainInfo = chainInfo
//            let idStr = "\(chainInfo.chainId)"
//            let chainCode = WalletManager.getChainCode(withChainCode: "\(chainInfo.chainCode)")
//            guard let address = WalletManager.getWalletAddress(withChainCode: chainCode), !address.isEmpty else {
//                let chainIdStr = data.object.chainId ?? ""
//                MMToast.makeToast("\(NSI18n.shared.d_app_not_support) \(chainIdStr)", for: self.view)
//                MMLogReporter.reportLog("check2:chainId:\(chainIdStr),chainCode:\(chainCode)")
//                return
//            }
//            self.address = address
//
//            let contentHeight = SwitchChainPopUpView.getPopUpViewHeight()
//            let window = UIApplication.shared.delegate?.window ?? nil
//            var popUpView = window?.viewWithTag(8000) as? SwitchChainPopUpView
//            if popUpView == nil {
//                popUpView = SwitchChainPopUpView(contentHeight: contentHeight, type: 1)
//                popUpView?.tag = 8000
//                popUpView?.reloadData(withModel: chainInfo, dappModel: self.model, signToken: "")
//            }
//
//            let idStrOx = Web3ProviderManager.shared().getChainidRadix(withChainId: chainInfo.chainId)
//            popUpView?.confirmHandle = {
//                let js = """
//                var config = {
//                    ethereum: {
//                        address: '\(weakSelf?.address ?? "")',
//                        chainId: \(idStr),
//                        rpcUrl: '\(chainInfo.hosts.first ?? "")'
//                    },
//                    isDebug: true
//                };
//                window.ethereum.setConfig(config);
//                window.ethereum.emitConnect(\(idStr));
//                window.ethereum.emitChainChanged('\(idStrOx)');
//                window.ethereum.sendResponse(\(data.id),{});
//                """
//                print("shy==>\(js)")
//                weakSelf?.webView?.evaluateJavaScript(js) { result, error in
//                    if weakSelf?.url.contains("app.dodoex.io") == true || weakSelf?.url.contains("app.tinyworlds.io") == true || weakSelf?.url.contains("pandatool.org") == true {
//                        weakSelf?.jsToH5()
//                        let reloadJs = "(function() {window.location.reload()})()"
//                        weakSelf?.webView?.evaluateJavaScript(reloadJs) { result, error in
//                            // 处理执行结果
//                        }
//                    }
//                }
//            }
//
//            popUpView?.cancleHandle = {
//                weakSelf?.sendErrorToH5FromCancel(data.id)
//            }
//
//            popUpView?.show()
//        }
//
//        else if data.name == "zapry_device_info" {
//            let js = self.mViewModel.getZapryDeviceInfo(withCapsuleHeight: CAPSULE_HEIGHT, withDappModel: data)
//            self.webView?.evaluateJavaScript(js) { result, error in
//                // 处理执行结果
//            }
//        }
//
//        else if data.name == "shareByZapry" {
//            guard !CommonUtil.isBlackString(data.object.url) else { return }
//
//            let controller = EMGroupChooseViewController(blocks: [])
//            controller.pageType = .systemShare
//            let navController = MMNavigationController(rootViewController: controller, isTranslucent: false)
//            navController.modalPresentationStyle = .fullScreen
//            self.present(navController, animated: true, completion: nil)
//
//            controller.setDoneCompletion { selectedArray in
//                var shareImage = data.object.image ?? ""
//                var shareDesc = data.object.desc ?? ""
//
//                if CommonUtil.isBlackString(shareImage) {
//                    shareImage = weakSelf?.model.dapp_logo ?? ""
//                }
//                if CommonUtil.isBlackString(shareDesc) {
//                    shareDesc = weakSelf?.model.dapp_desc ?? ""
//                }
//
//                weakSelf?.createShareView(selectedArray, shareImage: shareImage, linkUrl: data.object.url, desc: shareDesc, fromConversationId: weakSelf?.conversationId, fullScreen: weakSelf?.model.full_screen ?? false)
//            }
//        }
//    }
//
//
//    private func signMessageType(_ type: String, withResponseData data: DAppSendDataModel) {
//        // 弱引用 self，避免循环引用
//        weak var weakSelf = self
//
//        guard let chainInfo = self.chainInfo else {
//            return
//        }
//
//        let isTron = data.network == NETWORK_TRON_NAME
//        if isTron {
//            self.checkWalletAddress(withNetWork: NETWORK_TRON_NAME)
//            self.chainInfo = AppDataManager.shared().getTronChainModel()
//        }
//
//        let isBlankStr = !isTron && self.isBlankString(data.object.data)
//        if isBlankStr {
//            MMToast.makeToast("未传入正确data参数", for: self.view)
//            return
//        }
//
//        let contentHeight = 610 + FrameUtil.safeDistanceBottom()
//        if let window = UIApplication.shared.delegate?.window ?? nil {
//            var popUpView = window.viewWithTag(8001) as? SignChainPopUpView
//            if popUpView == nil {
//                popUpView = SignChainPopUpView(contentHeight: contentHeight, type: 2)
//                popUpView?.tag = 8001
//
//                var signStr = ""
//                if isTron {
//                    if let paramsDict = data.object.paramsDict, !paramsDict.isEmpty {
//                        signStr = paramsDict["raw_data_hex"] as? String ?? ""
//                    } else {
//                        signStr = data.object.params ?? ""
//                    }
//                } else {
//                    signStr = WalletManager.hexToString(from: data.object.data)
//                }
//
//                popUpView?.reloadData(withModel: weakSelf?.chainInfo, dappModel: weakSelf?.model, signToken: signStr)
//            }
//
//            popUpView?.confirmHandle = {
//                if isTron {
//                    weakSelf?.signMessageFromTron(data: data)
//                    return
//                }
//
//                let payModel = PayModel()
//                PaymentManager.shared().checkBeforePay(withSceneType: 3, payModel: payModel) { action, value, error in
//                    if action != 1 {
//                        if action == 4 {
//                            weakSelf?.sendErrorToH5FromCancel(data.id)
//                            return
//                        }
//                        if let error = error, !error.isEmpty {
//                            MMToast.makeToast(error, for: weakSelf?.view)
//                        }
//                        return
//                    }
//
//                    let privateKey = PaymentManager.shared().getPrivateKey(withJson: value, chainCode: "\(weakSelf?.chainInfo.chainCode ?? 0)")
//                    var sign = ""
//
//                    switch type {
//                    case "signMessage":
//                        sign = WalletManager.signPrefixedMessage(withMessage: data.object.data, privateKey: privateKey)
//                    case "signPersonalMessage":
//                        sign = WalletManager.signMessage(withData: data.object.data, privateKey: privateKey)
//                    case "signTypedMessage":
//                        sign = WalletManager.signTypeDataMessage(withTypeData: data.object.raw, privateKey: privateKey)
//                    default:
//                        break
//                    }
//
//                    DispatchQueue.main.async {
//                        if sign.isEmpty {
//                            MMToast.makeToast("签名失败，请检查网络", for: weakSelf?.view)
//                        }
//                    }
//
//                    let js = "window.ethereum.sendResponse(\(data.id), '\(sign)')"
//                    weakSelf?.webView?.evaluateJavaScript(js, completion: { result, error in
//                        // 处理执行结果
//                    })
//                }
//            }
//
//            popUpView?.cancleHandle = {
//                weakSelf?.sendErrorToH5FromCancel(data.id)
//            }
//
//            popUpView?.show()
//        }
//    }
//}

class ViewController: UIViewController {
    
    var chatViewController: ChatViewController?
    
    @IBOutlet weak var urlInputTextView: UITextView!
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        let url = "https://rocket.origindefi.io/#/stake?code=0x2da4d8B216c8dC79A25ECcd757EfB2F296Bd82ce"
        
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
            let config = try DAppLaunchParameters.Builder()
                .parentVC(self)
                .url(url)
                //.bridgeProvider(WalletBridgeProvider())
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
                .bridgeProvider(MyJsBridgeProvider())
                .miniAppId("2lv8dp7JjF2AU0iEk2rMYUaySjU")
                .build()
            
            MiniSDKManager.shared.miniAppService.launch(config: config)
        }
        catch {
            print("An error occurred: \(error)")
        }
    }
}
