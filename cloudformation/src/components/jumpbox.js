"use strict";

module.exports = config => ({
  /*
    Jumpbox setup
      EC2 instance for debugging purposes
  */
  appJumpboxSecurityGroup: {
    Type: "AWS::EC2::SecurityGroup",
    Properties: {
      GroupDescription: "SSH Access",
      GroupName: `${config.env}-${config.appName}-jumpboxSecurityGroup`,
      VpcId: { Ref: "appVpc" },
      SecurityGroupIngress: [
        {
          IpProtocol: "tcp",
          FromPort: "22",
          ToPort: "22",
          CidrIp: { Ref: "JumpboxSSHAccessIp" },
        },
      ],
      Tags: [
        {
          Key: "Name",
          Value: `${config.env}-${config.appName}-jumpboxSecurityGroup`,
        },
        { Key: "Project", Value: config.appName },
        { Key: "Env", Value: config.env },
      ],
    },
  },
  jumpbox: {
    Type: "AWS::EC2::Instance",
    Properties: {
      ImageId: "ami-07efac79022b86107",
      KeyName: { Ref: "JumpboxSSHKeyPair" },
      InstanceType: "t3.micro",
      SecurityGroupIds: [{ Ref: "appJumpboxSecurityGroup" }],
      SubnetId: { Ref: "appPublicSubnet1" },
      BlockDeviceMappings: [
        {
          DeviceName: "/dev/sda1",
          Ebs: { VolumeSize: "20" },
        },
      ],
      Tags: [
        { Key: "Name", Value: `${config.env}-${config.appName}-jumpbox` },
        { Key: "Project", Value: config.appName },
        { Key: "Env", Value: config.env },
      ],
    },
  },
  jumpoxEIP: {
    Type: "AWS::EC2::EIP",
    Properties: {
      InstanceId: { Ref: "jumpbox" },
    },
  },
});
