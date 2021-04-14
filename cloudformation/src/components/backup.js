"use strict";

/*
  Backup configuration:
  Dumps the PostgreSQL DB and saves it to S3 daily
  Uses CodeBuild to run pg_dump and the aws cli to copy the output to S3
 */
module.exports = config => ({
  // S3 Config for DB backups
  appDbBackups: {
    Type: "AWS::S3::Bucket",
    Properties: {
      BucketName: `${config.env}-${config.appName}-db-backups`,
      AccessControl: "LogDeliveryWrite",
      VersioningConfiguration: {
        Status: "Enabled",
      },
      LoggingConfiguration: {
        LogFilePrefix: "logs/",
      },
      LifecycleConfiguration: {
        Rules: [
          {
            Id: "Reduce old backups costs",
            Prefix: "backups/",
            Status: "Enabled",
            ExpirationInDays: 180,
            NoncurrentVersionExpirationInDays: 7,
            Transitions: [
              {
                StorageClass: "STANDARD_IA",
                TransitionInDays: 30,
              },
            ],
          },
        ],
      },
      Tags: [
        { Key: "Name", Value: `${config.env}-appDbBackups` },
        { Key: "Project", Value: config.appName },
        { Key: "Env", Value: config.env },
      ],
    },
  },
  appDbBackupsPolicy: {
    Type: "AWS::S3::BucketPolicy",
    Properties: {
      Bucket: {
        Ref: "appDbBackups",
      },
      PolicyDocument: {
        Version: "2012-10-17",
        Id: "PutObjPolicy",
        Statement: [
          {
            Sid: "DenyIncorrectEncryptionHeader",
            Effect: "Deny",
            Principal: "*",
            Action: "s3:PutObject",
            Resource: {
              "Fn::Join": [
                "",
                [
                  "arn:aws:s3:::",
                  {
                    Ref: "appDbBackups",
                  },
                  "/*",
                ],
              ],
            },
            Condition: {
              StringNotEquals: {
                "s3:x-amz-server-side-encryption": "AES256",
              },
            },
          },
          {
            Sid: "DenyUnEncryptedObjectUploads",
            Effect: "Deny",
            Principal: "*",
            Action: "s3:PutObject",
            Resource: {
              "Fn::Join": [
                "",
                [
                  "arn:aws:s3:::",
                  {
                    Ref: "appDbBackups",
                  },
                  "/*",
                ],
              ],
            },
            Condition: {
              Null: {
                "s3:x-amz-server-side-encryption": true,
              },
            },
          },
        ],
      },
    },
  },

  // Automate backups with CodeBuild
  appBackupBuildRole: {
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
      ManagedPolicyArns: [
        "arn:aws:iam::aws:policy/AmazonS3FullAccess",
        "arn:aws:iam::aws:policy/CloudWatchLogsFullAccess",
      ],
      Policies: [
        {
          PolicyName: "CodeBuildAccess",
          PolicyDocument: {
            Version: "2012-10-17",
            Statement: [
              {
                Action: [
                  "logs:*",
                  "ec2:CreateNetworkInterface",
                  "ec2:DescribeNetworkInterfaces",
                  "ec2:DeleteNetworkInterface",
                  "ec2:DescribeSubnets",
                  "ec2:DescribeSecurityGroups",
                  "ec2:DescribeDhcpOptions",
                  "ec2:DescribeVpcs",
                  "ec2:CreateNetworkInterfacePermission",
                ],
                Effect: "Allow",
                Resource: "*",
              },
            ],
          },
        },
      ],
    },
  },

  appDbBackupSecurityGroup: {
    Type: "AWS::EC2::SecurityGroup",
    Properties: {
      GroupDescription: "Empty",
      GroupName: `${config.env}-appDbBackupSecurityGroup`,
      VpcId: { Ref: "appVpc" },
      SecurityGroupIngress: [],
      Tags: [
        { Key: "Name", Value: `${config.env}-appDbBackupSecurityGroup` },
        { Key: "Project", Value: config.appName },
        { Key: "Env", Value: config.env },
      ],
    },
  },

  appDbBackupCodeBuild: {
    Type: "AWS::CodeBuild::Project",
    Properties: {
      Name: `${config.env}-${config.appName}-db-backup`,
      Description: "Backups DB into S3",
      ServiceRole: { "Fn::GetAtt": ["appBackupBuildRole", "Arn"] },
      Artifacts: {
        Type: "no_artifacts",
      },
      Environment: {
        Type: "LINUX_CONTAINER",
        ComputeType: "BUILD_GENERAL1_SMALL",
        Image: "aws/codebuild/standard:5.0",
        EnvironmentVariables: [
          {
            Name: "DB_BACKUP_BUCKET",
            Type: "PLAINTEXT",
            Value: `${config.env}-${config.appName}-db-backups`,
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
        ],
      },
      Source: {
        Type: "NO_SOURCE",
        BuildSpec: `
version: 0.2

phases:
  build:
    commands:
      - apt-get --allow-unauthenticated update -y
      - apt-get install -y postgresql-client
      - echo $DB_HOST:5432:$DB_NAME:$DB_USER:$DB_PASSWORD > ~/.pgpass
      - chmod 600 ~/.pgpass
      - pg_dump -h $DB_HOST -U $DB_USER -Fc --file=backup.custom $DB_NAME
  post_build:
    commands:
      - aws s3 cp backup.custom s3://$DB_BACKUP_BUCKET/backups/$(date "+%Y-%m-%d")-backup.custom --sse AES256
`,
      },
      TimeoutInMinutes: 30,
      LogsConfig: {
        CloudWatchLogs: {
          Status: "ENABLED",
        },
      },
      VpcConfig: {
        SecurityGroupIds: [{ Ref: "appJumpboxSecurityGroup" }],
        Subnets: [{ Ref: "appPrivateSubnet1" }, { Ref: "appPrivateSubnet2" }],
        VpcId: { Ref: "appVpc" },
      },
      Tags: [
        { Key: "Name", Value: `${config.env}-appDbBackupCodeBuild` },
        { Key: "Project", Value: config.appName },
        { Key: "Env", Value: config.env },
      ],
    },
  },

  // Schedule it daily
  appDbBackupSchedule: {
    Type: "AWS::Events::Rule",
    Properties: {
      Description: "Backup the DB Daily",
      Name: `${config.env}-appDbBackupSchedule`,
      ScheduleExpression: "cron(0 8 * * ? *)", // 2 am CST (8am UTC)
      State: "ENABLED",
      Targets: [
        {
          Arn: { "Fn::GetAtt": ["appDbBackupCodeBuild", "Arn"] },
          Id: "appDbBackupScheduleTarget",
          RoleArn: {
            "Fn::GetAtt": ["appPermissionForEventsToInvokeCodeBuild", "Arn"],
          },
        },
      ],
    },
  },

  appPermissionForEventsToInvokeCodeBuild: {
    Type: "AWS::IAM::Role",
    Properties: {
      AssumeRolePolicyDocument: {
        Version: "2012-10-17",
        Statement: {
          Effect: "Allow",
          Action: "sts:AssumeRole",
          Principal: {
            Service: "events.amazonaws.com",
          },
        },
      },
      Policies: [
        {
          PolicyName: "EventCodeBuildAccess",
          PolicyDocument: {
            Version: "2012-10-17",
            Statement: [
              {
                Action: "codebuild:StartBuild",
                Effect: "Allow",
                Resource: { "Fn::GetAtt": ["appDbBackupCodeBuild", "Arn"] },
              },
            ],
          },
        },
      ],
    },
  },
});
