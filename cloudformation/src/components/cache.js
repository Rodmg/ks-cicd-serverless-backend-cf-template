"use strict";

module.exports = config => ({
  appElasticacheSecurityGroup: {
    Type: "AWS::EC2::SecurityGroup",
    Properties: {
      GroupDescription: "Elasticache Security Group",
      GroupName: `${config.env}-appElasticacheSecurityGroup`,
      VpcId: { Ref: "appVpc" },
      SecurityGroupIngress: [
        {
          IpProtocol: "tcp",
          FromPort: "6379",
          ToPort: "6379",
          CidrIp: "10.0.0.0/23",
        },
      ],
      Tags: [
        { Key: "Name", Value: `${config.env}-appElasticacheSecurityGroup` },
        { Key: "Project", Value: config.appName },
        { Key: "Env", Value: config.env },
      ],
    },
  },

  appElasticacheSubnetGroup: {
    Type: "AWS::ElastiCache::SubnetGroup",
    Properties: {
      Description: "Cache Subnet Group",
      SubnetIds: [{ Ref: "appPrivateSubnet1" }, { Ref: "appPrivateSubnet2" }],
    },
  },

  appElasticacheCluster: {
    Type: "AWS::ElastiCache::CacheCluster",
    Properties: {
      AutoMinorVersionUpgrade: "true",
      Engine: "redis",
      CacheNodeType: "cache.t2.micro",
      NumCacheNodes: "1",
      Port: "6379",
      CacheSubnetGroupName: {
        Ref: "appElasticacheSubnetGroup",
      },
      VpcSecurityGroupIds: [
        {
          "Fn::GetAtt": ["appElasticacheSecurityGroup", "GroupId"],
        },
      ],
      Tags: [
        { Key: "Name", Value: `${config.env}-appElasticacheCluster` },
        { Key: "Project", Value: config.appName },
        { Key: "Env", Value: config.env },
      ],
    },
  },
});
