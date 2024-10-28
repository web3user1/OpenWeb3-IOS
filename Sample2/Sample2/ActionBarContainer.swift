//
//  ActionBarContainer.swift
//  Sample2
//
//  Created by Zhibiao Chen on 2024/8/1.
//

import Foundation
import UIKit

class ActionBarContainer : UIView {
    
    private let cornerRadius: CGFloat = 18.0
    private let isDark: Bool = false
    
    private let loadingIndicator = UIButton()
    private let ratingLabel = UILabel()
    private let starImageView = UIImageView()
    private let imageButton = UIButton()
    private let verticalLine = CALayer()
    
    public var dismiss: (() -> Void)? = nil
    public var share: (() -> Void)? = nil
    
    public func setStarLabel(label:String) {
        self.isLoading = false
        ratingLabel.text = label
        self.updateUI()
    }
    
    var isLoading: Bool = true {
        didSet {
            updateUI()
        }
    }
    
    override init(frame: CGRect) {
        super.init(frame: frame)
        setupUI()
    }
    
    required init?(coder: NSCoder) {
        super.init(coder: coder)
        setupUI()
    }
    
    @objc func closePressed() {
        self.dismiss?()
    }
    
    @objc func sharePressed() {
        self.share?()
    }
    
    private func getImage(named name: String) -> UIImage? {
        let bundle = Bundle(for: ActionBarContainer.self)
        return UIImage(named: name, in: bundle, compatibleWith: nil)?.withRenderingMode(.alwaysTemplate)
    }
    
    private func setupUI() {
        backgroundColor = UIColor.white.withAlphaComponent(0.3)
        layer.cornerRadius = cornerRadius
        layer.borderWidth = 0.5
        layer.borderColor = UIColor.black.withAlphaComponent(0.2).cgColor
        layer.masksToBounds = true
        
        loadingIndicator.translatesAutoresizingMaskIntoConstraints = false
        loadingIndicator.setImage(getImage(named: "icon_share"), for: .normal)
        loadingIndicator.imageEdgeInsets = UIEdgeInsets(top: 8, left: 8, bottom: 8, right: 8)
        loadingIndicator.tintColor = .black.withAlphaComponent(0.5)
        addSubview(loadingIndicator)
        
        loadingIndicator.addTarget(self, action: #selector(sharePressed), for: .touchUpInside)
        
        ratingLabel.translatesAutoresizingMaskIntoConstraints = false
        ratingLabel.font = UIFont.systemFont(ofSize: 15)
        ratingLabel.textColor = .white
        addSubview(ratingLabel)
        
        starImageView.translatesAutoresizingMaskIntoConstraints = false
        starImageView.image = getImage(named: "icon_star")
        starImageView.tintColor = .yellow
        addSubview(starImageView)
        
        imageButton.translatesAutoresizingMaskIntoConstraints = false
        imageButton.setImage(getImage(named: "icon_close"), for: .normal)
        imageButton.imageEdgeInsets = UIEdgeInsets(top: 8, left: 8, bottom: 8, right: 8)
        imageButton.tintColor = .black.withAlphaComponent(0.5)
        addSubview(imageButton)
        
        imageButton.addTarget(self, action: #selector(closePressed), for: .touchUpInside)
        
        verticalLine.backgroundColor = UIColor.black.withAlphaComponent(0.2).cgColor
        layer.addSublayer(verticalLine)
        
        NSLayoutConstraint.activate([
            loadingIndicator.centerYAnchor.constraint(equalTo: centerYAnchor),
            loadingIndicator.leadingAnchor.constraint(equalTo: leadingAnchor, constant: 8),
            loadingIndicator.widthAnchor.constraint(equalToConstant: 35),
            loadingIndicator.heightAnchor.constraint(equalToConstant: 35),
            
            ratingLabel.centerYAnchor.constraint(equalTo: centerYAnchor),
            ratingLabel.leadingAnchor.constraint(equalTo: starImageView.trailingAnchor, constant: 8),
            
            starImageView.centerYAnchor.constraint(equalTo: centerYAnchor),
            starImageView.leadingAnchor.constraint(equalTo: loadingIndicator.trailingAnchor, constant: 8),
            
            imageButton.centerYAnchor.constraint(equalTo: centerYAnchor),
            imageButton.trailingAnchor.constraint(equalTo: trailingAnchor, constant: -8),
            imageButton.widthAnchor.constraint(equalToConstant: 35),
            imageButton.heightAnchor.constraint(equalToConstant: 35)
        ])
        
        updateUI()
    }
    
    override func layoutSubviews() {
        super.layoutSubviews()
        
        // Position the vertical line
        let lineX = bounds.width / 2 - 0.5 // Adjust the position as needed
        verticalLine.frame = CGRect(x: lineX, y: 10, width: 1, height: bounds.height - 20) // Adjust the height and position as needed
    }
    
    private func updateUI() {
        if isLoading {
            loadingIndicator.isHidden = false
            ratingLabel.isHidden = true
            starImageView.isHidden = true
        } else {
            loadingIndicator.isHidden = true
            ratingLabel.isHidden = false
            starImageView.isHidden = false
        }
    }
}
