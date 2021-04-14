"use strict";

module.exports = config => ({
  /*
    DB Setup
      A PostgreSQL DB in RDS
      Lives in the private subnets
  */
  appDbSubnetGroup: {
    Type: "AWS::RDS::DBSubnetGroup",
    Properties: {
      DBSubnetGroupDescription: `${config.env}-${config.appName}-dbSubnetGroup`,
      SubnetIds: [{ Ref: "appPrivateSubnet1" }, { Ref: "appPrivateSubnet2" }],
      Tags: [
        { Key: "Name", Value: `${config.env}-${config.appName}-dbSubnetGroup` },
        { Key: "Project", Value: config.appName },
        { Key: "Env", Value: config.env },
      ],
    },
  },
  appDbSecurityGroup: {
    Type: "AWS::EC2::SecurityGroup",
    Properties: {
      GroupDescription: "Open database for access",
      GroupName: `${config.env}-${config.appName}-dbSecurityGroup`,
      VpcId: { Ref: "appVpc" },
      SecurityGroupIngress: [
        {
          IpProtocol: "tcp",
          FromPort: "5432",
          ToPort: "5432",
          CidrIp: "10.0.0.0/23",
        },
      ],
      Tags: [
        {
          Key: "Name",
          Value: `${config.env}-${config.appName}-dbSecurityGroup`,
        },
        { Key: "Project", Value: config.appName },
        { Key: "Env", Value: config.env },
      ],
    },
  },
  appDb: {
    Type: "AWS::RDS::DBInstance",
    Properties: {
      DBInstanceIdentifier: `${config.env}-${config.appName}-db`,
      DBName: { Ref: "DBName" },
      DBInstanceClass: "db.t3.small",
      AllocatedStorage: "20",
      StorageType: "gp2",
      Engine: "postgres",
      EngineVersion: "12.5",
      MasterUsername: { Ref: "DBUser" },
      MasterUserPassword: { Ref: "DBPassword" },
      PubliclyAccessible: false,
      DBSubnetGroupName: { Ref: "appDbSubnetGroup" },
      VPCSecurityGroups: [{ "Fn::GetAtt": ["appDbSecurityGroup", "GroupId"] }],
      Tags: [
        { Key: "Name", Value: `${config.env}-${config.appName}-db` },
        { Key: "Project", Value: config.appName },
        { Key: "Env", Value: config.env },
      ],
    },
    DeletionPolicy: config.dbDeletionPolicy,
  },
});
