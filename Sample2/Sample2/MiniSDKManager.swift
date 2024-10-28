//
//  MiniSDKManager.swift
//  Sample2
//
//  Created by yunge on 2024/8/22.
//

import UIKit
import OpenWeb3Lib

@objcMembers
class MiniSDKManager: NSObject, IAppDelegate {
    static let shared = MiniSDKManager()
    
    var openPlatformPlugin: OpenPlatformPlugin
    
    var miniAppService: MiniAppService
    
    let idToken = "eyJhbGciOiJSUzI1NiIsImtpZCI6IjM5ZTg2YmMxYjBjMjI5NDBkNDRjZjNmNWI4NWZmZWYwYTZjNmQzNzIiLCJ0eXAiOiJKV1QifQ.eyJ1aWQiOiJtdHNvY2lhbEBnbWFpLmNvbSIsImlzcyI6ImZpcmViYXNlLWFkbWluc2RrLTR2ejMwQG10c29jaWFsLmlhbS5nc2VydmljZWFjY291bnQuY29tIiwiZXhwIjoxNzUxODEzMTUxLCJpYXQiOjE3MjA3MDkxNTEsImF1ZCI6Imh0dHBzOi8vaWRlbnRpdHl0b29sa2l0Lmdvb2dsZWFwaXMuY29tL2dvb2dsZS5pZGVudGl0eS5pZGVudGl0eXRvb2xraXQudjEuSWRlbnRpdHlUb29sa2l0Iiwic3ViIjoiZmlyZWJhc2UtYWRtaW5zZGstNHZ6MzBAbXRzb2NpYWwuaWFtLmdzZXJ2aWNlYWNjb3VudC5jb20ifQ.IxKdRdKZhbiYIbRd7nzieti--cEHNA-65rg01Wl6h64cXVviPlZ5MsaueN4uRUODtYs6mdYMAteoy54Wi0GMJzIGMkClUJtbWTOfW1L43YdB4R4XhhVsx2gvF8iCF0MQrDB8ekfyWEqbBdJdbM0BUH0NjSl1Mg15Ta-Rx1cYsk41vmDULpkqHJl93Xjuu2ts1KY7Rs3kNp1NAj9-gC4kHzUG57dmvLqteb4qMmUN7h2tq_np3rdGUBRzxB_YBOnqICAmJ-u6knV_XT08Ep1fB-H_HqR41W_FMgv3EW-V5pApDddJttNjaTy8rJfy2xL9mOhQV0OH-1vHjm4Mz2Jpeg"
    
    private override init() {
        self.openPlatformPlugin = PluginsManager.getInstance().getPlugin(PluginName.openPlatform.rawValue)!
        self.miniAppService = openPlatformPlugin.getMiniAppService()!
    }
    
    private func tokenProvider() async -> String? {
        return await withCheckedContinuation { [weak self] continuation in
            guard let strongSelf = self else {
                return
            }
            continuation.resume(returning: strongSelf.idToken)
        }
    }
    
    func signIn() {
        self.openPlatformPlugin.signIn(
            verifier: "123",
            idTokenProvider: tokenProvider,
            onVerifierSuccess: {
                // Do something
            },
            onVerifierFailure: { code, message in
                print("Verifier Err, code= \(code), message: \(String(describing: message))")
            })
    }
    
    func setupMiniAppService() {
        if let window = UIApplication.shared.windows.first {
            
            let appConfig = AppConfig.Builder(appName: "Sample2",
                                              webAppName: "OpenWeb3",
                                              mePath: ["https://openweb3.io","https://t.me"],
                                              window: window,
                                              appDelegate: MiniSDKManager.shared)
                .languageCode("en")
                .userInterfaceStyle(.light)
                .maxCachePage(5)
                .resourceProvider(nil)
                .floatWindowSize(width: 90.0, height: 159.0)
                .build()
            
            MiniSDKManager.shared.miniAppService.setup(config: appConfig)
        }
    }
    
    func launchWithUrl(vc: UIViewController, url: String) {
        
        if false == url.starts(with: "https://") {
            return
        }
        
        do{
            let config = try WebAppLaunchWithDialogParameters.Builder()
                .parentVC(vc)
                .url(url)
                .isLaunchUrl(true)
                .build()
            
             miniAppService.launch(config: config)
            
        }
        catch {
            print("An error occurred: \(error)")
        }

    }
    
    var customMethodProvider: (IMiniApp, String, String?, @escaping (String?) -> Void )-> Bool = { _, method, params, callback in
        if(method == "getRoomConfig") {
            // TODO 返回当前部落添加到App IDs
            callback("{\"miniapps\": [\"10\"]}")
            return true
        }
        if(method == "updateRoomConfig") {
            // 1、TODO 更新apps到部落
            callback(nil)
            return true
        }
        callback("TODO: To implement Custom Method in AppDelegate, Method called: \(method)")
        return false
    }
    
    var qrcodeProvider: (IMiniApp, String?, @escaping (String?) -> Void) -> UINavigationController? = { _, desc, callback in
        callback("TODO: To implement in AppDelegate")
        return nil
    }
    
    var attachActionProvider: (IMiniApp, String?, String)-> Void =  { _,action,payload in
            
    }
    
    var schemeProvider: (IMiniApp, String) async -> Bool = { _,_ in
        return false
    }
    
    /**
     * 在APP内部打开一个新的会话
     * @param query String
     * @param types List<String>
     */
    func switchInlineQuery(app: IMiniApp, query: String, types: [String]) async -> Bool {
        return false
    }
    
    /**
     * 检测当前会话是否支持并授权了发消息功能
     * @return Boolean
     */
    func checkPeerMessageAccess(app: IMiniApp) async -> Bool {
        return false
    }
    
    /**
     * 请求当前会话授权发送消息功能
     * @return Boolean
     */
    func requestPeerMessageAccess(app: IMiniApp) async -> Bool {
        return false
    }
    
    /**
     * 发送消息给当前会话
     * @param content String?
     * @return Boolean
     */
    func sendMessageToPeer(app: IMiniApp, content: String?) -> Bool {
        return true
    }
    
    /**
     * 请求发送手机号到当前会话
     * @return Boolean
     */
    func requestPhoneNumberToPeer(app: IMiniApp) async -> Bool {
        return false
    }
    
    /**
     * 获取生物认证信息，包括（APP证书授权、人脸、指纹等）
     * @return BiometryInfo?
     */
    func canUseBiometryAuth(app: IMiniApp) ->  Bool {
        return true
    }
    
    /**
     * 请求更新生物认证
     * @param token String?
     * @param reason String?
     * @return Pair<Boolean,String?> [(false,null): 失败，没有授权生物认证，(true, null): 更新失败，旧的token已经删除，(true, token value): 更新成功]
     */
    func updateBiometryToken(app: IMiniApp, token: String?, reason: String?) async -> (Bool,String?) {
        return (false, nil)
    }
    
    /**
     * 打开生物认证设置
     */
    func openBiometrySettings(app: IMiniApp) async -> Void {
        
    }
    
    /**
     * 分享App
     */
    func shareWebApp(app: IMiniApp) {
    }
    
    /**
     * Api Error
     */
    func onApiError(error: ApiError) {
        switch(error) {
        case .requestFailed(let code, let message):
            if code == 401 {
                signIn()
            }
        default:
            break
        }
    }

}
