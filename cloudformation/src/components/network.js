"use strict";

const natGateway = config => ({
  appNATGateway: {
    Type: "AWS::EC2::NatGateway",
    Properties: {
      AllocationId: { "Fn::GetAtt": ["appNATGwEIP", "AllocationId"] },
      SubnetId: { Ref: "appPublicSubnet1" },
      Tags: [
        { Key: "Name", Value: `${config.env}-${config.appName}-NATGateway` },
        { Key: "Project", Value: config.appName },
        { Key: "Env", Value: config.env },
      ],
    },
  },
  appNATGwAttach: {
    Type: "AWS::EC2::VPCGatewayAttachment",
    Properties: {
      VpcId: { Ref: "appVpc" },
      InternetGatewayId: { Ref: "appInternetGateway" },
    },
  },
  appNATGwEIP: {
    DependsOn: "appNATGwAttach",
    Type: "AWS::EC2::EIP",
    Properties: {
      Domain: "vpc",
      Tags: [
        { Key: "Name", Value: `${config.env}-${config.appName}-NATGwEIP` },
        { Key: "Project", Value: config.appName },
        { Key: "Env", Value: config.env },
      ],
    },
  },
  appNATGwRoute: {
    Type: "AWS::EC2::Route",
    Properties: {
      RouteTableId: { Ref: "appPrivateSubnetRouteTable" },
      DestinationCidrBlock: "0.0.0.0/0",
      NatGatewayId: { Ref: "appNATGateway" },
    },
  },
});

module.exports = config => ({
  /* 
    Network setup:
      We have 4 subnets, 2 public and 2 private.
      Public subnets have access to the internet via a Internet Gateway
      Private subnets have access to the internet via an optional NAT Gateway
      Subnets:
        appPrivateSubnet1: 10.0.0.0 - 10.0.0.127
        appPrivateSubnet2: 10.0.0.128 - 10.0.0.255
        appPublicSubnet1: 10.0.1.0 - 10.0.1.127
        appPublicSubnet2: 10.0.1.128 - 10.0.1.255
  */
  appVpc: {
    Type: "AWS::EC2::VPC",
    Properties: {
      CidrBlock: "10.0.0.0/23",
      EnableDnsSupport: true,
      EnableDnsHostnames: true,
      InstanceTenancy: "default",
      Tags: [
        { Key: "Name", Value: `${config.env}-${config.appName}-vpc` },
        { Key: "Project", Value: config.appName },
        { Key: "Env", Value: config.env },
      ],
    },
  },
  appPrivateSubnet1: {
    Type: "AWS::EC2::Subnet",
    Properties: {
      VpcId: { Ref: "appVpc" },
      CidrBlock: "10.0.0.0/25",
      AvailabilityZone: { "Fn::Join": ["", [{ Ref: "AwsRegion" }, "a"]] },
      Tags: [
        {
          Key: "Name",
          Value: `${config.env}-${config.appName}-privateSubnet1`,
        },
        { Key: "Project", Value: config.appName },
        { Key: "Env", Value: config.env },
      ],
    },
  },
  appPrivateSubnet2: {
    Type: "AWS::EC2::Subnet",
    Properties: {
      VpcId: { Ref: "appVpc" },
      CidrBlock: "10.0.0.128/25",
      AvailabilityZone: { "Fn::Join": ["", [{ Ref: "AwsRegion" }, "c"]] },
      Tags: [
        {
          Key: "Name",
          Value: `${config.env}-${config.appName}-privateSubnet2`,
        },
        { Key: "Project", Value: config.appName },
        { Key: "Env", Value: config.env },
      ],
    },
  },
  appPrivateSubnetRouteTable: {
    Type: "AWS::EC2::RouteTable",
    Properties: {
      VpcId: { Ref: "appVpc" },
      Tags: [
        {
          Key: "Name",
          Value: `${config.env}-${config.appName}-privateSubnetRouteTable`,
        },
        { Key: "Project", Value: config.appName },
        { Key: "Env", Value: config.env },
      ],
    },
  },
  appPrivateSubnet1RouteTableAssociation: {
    Type: "AWS::EC2::SubnetRouteTableAssociation",
    Properties: {
      SubnetId: { Ref: "appPrivateSubnet1" },
      RouteTableId: { Ref: "appPrivateSubnetRouteTable" },
    },
  },
  appPrivateSubnet2RouteTableAssociation: {
    Type: "AWS::EC2::SubnetRouteTableAssociation",
    Properties: {
      SubnetId: { Ref: "appPrivateSubnet2" },
      RouteTableId: { Ref: "appPrivateSubnetRouteTable" },
    },
  },

  appPublicSubnet1: {
    Type: "AWS::EC2::Subnet",
    Properties: {
      VpcId: { Ref: "appVpc" },
      CidrBlock: "10.0.1.0/25",
      AvailabilityZone: { "Fn::Join": ["", [{ Ref: "AwsRegion" }, "a"]] },
      Tags: [
        { Key: "Name", Value: `${config.env}-${config.appName}-publicSubnet1` },
        { Key: "Project", Value: config.appName },
        { Key: "Env", Value: config.env },
      ],
    },
  },
  appPublicSubnet2: {
    Type: "AWS::EC2::Subnet",
    Properties: {
      VpcId: { Ref: "appVpc" },
      CidrBlock: "10.0.1.128/25",
      AvailabilityZone: { "Fn::Join": ["", [{ Ref: "AwsRegion" }, "c"]] },
      Tags: [
        { Key: "Name", Value: `${config.env}-${config.appName}-publicSubnet2` },
        { Key: "Project", Value: config.appName },
        { Key: "Env", Value: config.env },
      ],
    },
  },
  appPublicSubnetRouteTable: {
    Type: "AWS::EC2::RouteTable",
    Properties: {
      VpcId: { Ref: "appVpc" },
      Tags: [
        {
          Key: "Name",
          Value: `${config.env}-${config.appName}-publicSubnetRouteTable`,
        },
        { Key: "Project", Value: config.appName },
        { Key: "Env", Value: config.env },
      ],
    },
  },
  appPublicSubnet1RouteTableAssociation: {
    Type: "AWS::EC2::SubnetRouteTableAssociation",
    Properties: {
      SubnetId: { Ref: "appPublicSubnet1" },
      RouteTableId: { Ref: "appPublicSubnetRouteTable" },
    },
  },
  appPublicSubnet2RouteTableAssociation: {
    Type: "AWS::EC2::SubnetRouteTableAssociation",
    Properties: {
      SubnetId: { Ref: "appPublicSubnet2" },
      RouteTableId: { Ref: "appPublicSubnetRouteTable" },
    },
  },

  appInternetGateway: {
    Type: "AWS::EC2::InternetGateway",
    Properties: {
      Tags: [
        {
          Key: "Name",
          Value: `${config.env}-${config.appName}-internetGateway`,
        },
        { Key: "Project", Value: config.appName },
        { Key: "Env", Value: config.env },
      ],
    },
  },
  appIGRoute: {
    Type: "AWS::EC2::Route",
    Properties: {
      RouteTableId: { Ref: "appPublicSubnetRouteTable" },
      DestinationCidrBlock: "0.0.0.0/0",
      GatewayId: { Ref: "appInternetGateway" },
    },
  },

  appBackendSecurityGroup: {
    Type: "AWS::EC2::SecurityGroup",
    Properties: {
      GroupDescription: "Default Backend SG",
      GroupName: `${config.env}-${config.appName}-backendSecurityGroup`,
      VpcId: { Ref: "appVpc" },
      Tags: [
        {
          Key: "Name",
          Value: `${config.env}-${config.appName}-backendSecurityGroup`,
        },
        { Key: "Project", Value: config.appName },
        { Key: "Env", Value: config.env },
      ],
    },
  },

  ...(config.natGateway ? natGateway(config) : {}),
});
