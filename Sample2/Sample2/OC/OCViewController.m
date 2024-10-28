//
//  OCViewController.m
//  Sample2
//
//  Created by yunge on 2024/8/21.
//

#import "OCViewController.h"
#import "Sample2-Swift.h"

@interface OCViewController ()
@end

@implementation OCViewController


- (void)viewDidLoad {
    [super viewDidLoad];
    self.view.backgroundColor = UIColor.whiteColor;
    
    UIButton *startButton = [[UIButton alloc] initWithFrame:CGRectMake(16, UIScreen.mainScreen.bounds.size.height/2, UIScreen.mainScreen.bounds.size.width - 2*16, 45)];
    [startButton setTitle:@"Lanch MiniApp" forState:UIControlStateNormal];
    [startButton setBackgroundColor:UIColor.lightGrayColor];
    [startButton addTarget:self action:@selector(startAction) forControlEvents:UIControlEventTouchUpInside];
    [self.view addSubview:startButton];
}

-(void) startAction {
    [[MiniSDKManager shared] launchWithUrlWithVc:self url:@"https://openweb3.io/MatrixBot102/mt_wallet"];
}
@end

