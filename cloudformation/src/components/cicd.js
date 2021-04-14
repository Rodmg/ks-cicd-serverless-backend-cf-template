"use strict";

module.exports = config => ({
  /*
    CI/CD Setup
  */
  appBackendBuildRole: {
    Type: "AWS::IAM::Role",
    Properties: {
      AssumeRolePolicyDocument: {
        Version: "2012-10-17",
        Statement: {
          Effect: "Allow",
          Principal: {
            Service: "codebuild.amazonaws.com",
          },
          Action: "sts:AssumeRole",
        },
      },
      Policies: [
        {
          PolicyName: "root",
          PolicyDocument: {
            Version: "2012-10-17",
            Statement: [
              {
                Effect: "Allow",
                Action: "sns:*",
                Resource: "*",
              },
              {
                Effect: "Allow",
                Action: "sqs:*",
                Resource: "*",
              },
              {
                Effect: "Allow",
                Action: "events:*",
                Resource: "*",
              },
            ],
          },
        },
      ],
      ManagedPolicyArns: [
        "arn:aws:iam::aws:policy/AWSLambda_FullAccess",
        "arn:aws:iam::aws:policy/IAMFullAccess",
        "arn:aws:iam::aws:policy/AmazonS3FullAccess",
        "arn:aws:iam::aws:policy/AmazonAPIGatewayInvokeFullAccess",
        "arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs",
        "arn:aws:iam::aws:policy/CloudWatchLogsFullAccess",
        "arn:aws:iam::aws:policy/AmazonAPIGatewayAdministrator",
        "arn:aws:iam::aws:policy/service-role/AWSCodeDeployRoleForCloudFormation",
        "arn:aws:iam::aws:policy/AWSCloudFormationFullAccess",
      ],
    },
  },

  appBackendCodeBuild: {
    Type: "AWS::CodeBuild::Project",
    Properties: {
      Name: `${config.env}-${config.appName}-backend`,
      Description: `Builds and deploys ${config.appName} project`,
      ServiceRole: { "Fn::GetAtt": ["appBackendBuildRole", "Arn"] },
      Artifacts: {
        Type: "no_artifacts",
      },
      Environment: {
        Type: "LINUX_CONTAINER",
        ComputeType: "BUILD_GENERAL1_SMALL",
        Image: "aws/codebuild/amazonlinux2-x86_64-standard:3.0",
        EnvironmentVariables: [
          {
            Name: "APP_NODE_ENV",
            Type: "PLAINTEXT",
            Value: "production",
          },
          {
            Name: "APP_AWS_FILE_BUCKET",
            Type: "PLAINTEXT",
            Value: `${config.env}-${config.appName}-files-bucket`,
          },
          {
            Name: "SLS_STAGE",
            Type: "PLAINTEXT",
            Value: config.env,
          },
          {
            Name: "SLS_REGION",
            Type: "PLAINTEXT",
            Value: { Ref: "AwsRegion" },
          },
          {
            Name: "SLS_SG",
            Type: "PLAINTEXT",
            Value: { Ref: "appBackendSecurityGroup" },
          },
          {
            Name: "SLS_SN1",
            Type: "PLAINTEXT",
            Value: { Ref: "appPrivateSubnet1" },
          },
          {
            Name: "SLS_SN2",
            Type: "PLAINTEXT",
            Value: { Ref: "appPrivateSubnet2" },
          },
          {
            Name: "JWT_SECRET",
            Type: "PLAINTEXT",
            Value: { Ref: "JwtSecret" },
          },
          {
            Name: "URLS_PROTOCOL",
            Type: "PLAINTEXT",
            Value: "https",
          },
          {
            Name: "URLS_URL",
            Type: "PLAINTEXT",
            Value: { Ref: "APIUrl" },
          },
          {
            Name: "URLS_PORT",
            Type: "PLAINTEXT",
            Value: "",
          },
          {
            Name: "DB_HOST",
            Type: "PLAINTEXT",
            Value: { "Fn::GetAtt": ["appDb", "Endpoint.Address"] },
          },
          {
            Name: "DB_NAME",
            Type: "PLAINTEXT",
            Value: { Ref: "DBName" },
          },
          {
            Name: "DB_USER",
            Type: "PLAINTEXT",
            Value: { Ref: "DBUser" },
          },
          {
            Name: "DB_PASSWORD",
            Type: "PLAINTEXT",
            Value: { Ref: "DBPassword" },
          },
          ...(config.cache
            ? [
                {
                  Name: "REDIS_CLUSTER_HOST",
                  Type: "PLAINTEXT",
                  Value: {
                    "Fn::GetAtt": [
                      "appElasticacheCluster",
                      "RedisEndpoint.Address",
                    ],
                  },
                },
                {
                  Name: "REDIS_CLUSTER_PORT",
                  Type: "PLAINTEXT",
                  Value: {
                    "Fn::GetAtt": [
                      "appElasticacheCluster",
                      "RedisEndpoint.Port",
                    ],
                  },
                },
              ]
            : []),
        ],
      },
      Source: {
        Type: { Ref: "GitSource" },
        Location: { Ref: "GitLocation" },
      },
      SourceVersion: config.backendBranch,
      Triggers: {
        Webhook: true,
        FilterGroups: [
          [
            { Type: "EVENT", Pattern: "PUSH, PULL_REQUEST_MERGED" },
            { Type: "HEAD_REF", Pattern: config.backendBranch },
          ],
        ],
      },
      TimeoutInMinutes: 30,
      LogsConfig: {
        CloudWatchLogs: {
          Status: "ENABLED",
        },
      },
      Tags: [
        { Key: "Name", Value: `${config.env}-appBackendCodeBuild` },
        { Key: "Project", Value: config.appName },
        { Key: "Env", Value: config.env },
      ],
    },
  },
});
