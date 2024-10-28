import UIKit
import OpenWeb3Lib

class ChatViewController: UIViewController {
    
    private var tableView: UITableView!
    private var messageTextView: UITextView!
    private var sendButton: UIButton!
    private var walletButton: UIButton!
    private var inputContainerView: UIView!
    private var messages: [String] = ["Hi!","Are you ok?"]
    
    private lazy var openPlatformPlugin: OpenPlatformPlugin = PluginsManager.getInstance().getPlugin(PluginName.openPlatform.rawValue)!

    private lazy var miniAppService: MiniAppService = openPlatformPlugin.getMiniAppService()!
    
    public func onSendPeerMessage(_ content: String?) {
        if let content = content {
            messages.append(content)
            tableView.reloadData()
            scrollToLastMessage()
        }
    }
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        title = "1v1 Chat"
        
        setupTableView()
        setupInputContainerView()
    }
    
    @objc private func dismissKeyboard() {
        view.endEditing(true)
    }
    
    override func viewWillDisappear(_ animated: Bool) {
        super.viewWillDisappear(animated)
        NotificationCenter.default.removeObserver(self)
    }
    
    private func setupTableView() {
        tableView = UITableView(frame: view.bounds, style: .plain)
        tableView.translatesAutoresizingMaskIntoConstraints = false
        tableView.delegate = self
        tableView.dataSource = self
        tableView.register(UITableViewCell.self, forCellReuseIdentifier: "MessageCell")
        view.addSubview(tableView)
        
        let tapGesture = UITapGestureRecognizer(target: self, action: #selector(dismissKeyboard))
        tableView.addGestureRecognizer(tapGesture)
        
        NSLayoutConstraint.activate([
            tableView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            tableView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            tableView.topAnchor.constraint(equalTo: view.topAnchor),
            tableView.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        ])
    }
    
    private func setupInputContainerView() {
        let context = miniAppService.getContext()!
        
        inputContainerView = UIView()
        inputContainerView.translatesAutoresizingMaskIntoConstraints = false
        inputContainerView.backgroundColor = context.resourceProvider.getColor(key: KEY_SECONDARY_BG_COLOR)
        view.addSubview(inputContainerView)
        
        NotificationCenter.default.addObserver(self, selector: #selector(keyboardWillShow(_:)), name: UIResponder.keyboardWillShowNotification, object: nil)
        NotificationCenter.default.addObserver(self, selector: #selector(keyboardWillHide(_:)), name: UIResponder.keyboardWillHideNotification, object: nil)
        
        // 添加约束
        NSLayoutConstraint.activate([
            inputContainerView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            inputContainerView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            inputContainerView.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            inputContainerView.heightAnchor.constraint(equalToConstant: 84)
        ])
        
        setupWalletButton()
        setupMessageTextView()
        setupSendButton()
    }
    
    private func setupWalletButton() {
        walletButton = UIButton(type: .system)
        walletButton.translatesAutoresizingMaskIntoConstraints = false
        walletButton.setTitle("Wallet", for: .normal)
        walletButton.addTarget(self, action: #selector(walletButtonTapped), for: .touchUpInside)
        inputContainerView.addSubview(walletButton)
        
        NSLayoutConstraint.activate([
            walletButton.leadingAnchor.constraint(equalTo: inputContainerView.leadingAnchor, constant: 8.0),
            walletButton.topAnchor.constraint(equalTo: inputContainerView.topAnchor, constant: 8.0),
            walletButton.heightAnchor.constraint(equalToConstant: 35),
            walletButton.widthAnchor.constraint(equalToConstant: 80)
        ])
    }
    
    private func setupMessageTextView() {
        messageTextView = UITextView()
        messageTextView.translatesAutoresizingMaskIntoConstraints = false
        inputContainerView.addSubview(messageTextView)
        
        NSLayoutConstraint.activate([
            messageTextView.leadingAnchor.constraint(equalTo: walletButton.trailingAnchor, constant: 8.0),
            messageTextView.topAnchor.constraint(equalTo: inputContainerView.topAnchor, constant: 8.0),
            messageTextView.heightAnchor.constraint(equalToConstant: 35)
        ])
    }
    
    private func setupSendButton() {
        sendButton = UIButton(type: .system)
        sendButton.translatesAutoresizingMaskIntoConstraints = false
        sendButton.setTitle("Send", for: .normal)
        sendButton.addTarget(self, action: #selector(sendButtonTapped), for: .touchUpInside)
        inputContainerView.addSubview(sendButton)
        
        NSLayoutConstraint.activate([
            sendButton.leadingAnchor.constraint(equalTo: messageTextView.trailingAnchor, constant: 8.0),
            sendButton.topAnchor.constraint(equalTo: inputContainerView.topAnchor, constant: 8.0),
            sendButton.trailingAnchor.constraint(equalTo: inputContainerView.trailingAnchor, constant: -8.0),
            sendButton.heightAnchor.constraint(equalToConstant: 35),
            sendButton.widthAnchor.constraint(equalToConstant: 80)
        ])
    }
    
    @objc private func sendButtonTapped() {
        guard let message = messageTextView.text, !message.isEmpty else {
            return
        }
        
        messages.append(message)
        tableView.reloadData()
        scrollToLastMessage()
        messageTextView.text = ""
    }
    
    @objc private func walletButtonTapped() {
        launchMiniApp()
    }
    
    @objc private func keyboardWillShow(_ notification: Notification) {
        guard let keyboardFrame = (notification.userInfo?[UIResponder.keyboardFrameEndUserInfoKey] as? NSValue)?.cgRectValue else {
            return
        }
        
        let keyboardHeight = keyboardFrame.height
        let safeAreaBottomInset = view.safeAreaInsets.bottom
        
        inputContainerView.transform = CGAffineTransform(translationX: 0, y: -keyboardHeight + safeAreaBottomInset)
    }
    
    @objc private func keyboardWillHide(_ notification: Notification) {
        inputContainerView.transform = .identity
    }
    
    private func scrollToLastMessage() {
        guard messages.count > 0 else {
            return
        }
        
        let lastIndexPath = IndexPath(row: messages.count - 1, section: 0)
        tableView.scrollToRow(at: lastIndexPath, at: .bottom, animated: true)
    }
    
    private func openUrl(url: String) {
        
    }
    
    
    private func launchMiniApp() {
        
        let getInputContainerView: ()-> (CGFloat, UIView?)? = {
            return (84.0,  nil)
        }
        
        let dismissCall = { [weak self] in
            if let strongSelf = self {
                strongSelf.walletButton.setTitle("Wallet", for: .normal)
            }
        }
        
        do{
            let config = try WebAppLaunchWithParentParameters.Builder()
                .parentVC(self)
                .botName("wallet")
                .miniAppName("wallet")
                .isLocalSource(true)
                .getInputContainerNode(getInputContainerView)
                .didDismiss(dismissCall)
                .build()
            
            miniAppService.launch(config: config)
        }
        catch {
            print("An error occurred: \(error)")
        }
        
        walletButton.setTitle("Close", for: .normal)
    }
}

extension ChatViewController: UITableViewDelegate, UITableViewDataSource {
    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        return messages.count
    }
    
    func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        let cell = tableView.dequeueReusableCell(withIdentifier: "MessageCell", for: indexPath)
        cell.textLabel?.text = messages[indexPath.row]
        return cell
    }
}
