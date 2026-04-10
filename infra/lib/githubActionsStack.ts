import * as cdk from 'aws-cdk-lib'
import * as iam from 'aws-cdk-lib/aws-iam'
import { Construct } from 'constructs'
import { CommonStackProps } from '../types'
import { accounts } from './accounts'

export const GITHUB_ACTIONS_OIDC_THUMBPRINT_LIST = [
  '6938fd4d98bab03faadb97b34396831e3780aea1',
  '1c58a3a8518e8759bf075b76b750d4f2df264fcd'
]

export const RESTRICTED_CI_PERMISSIONS_BOUNDARY_NAME = 'ludos-restricted-ci-permissions-boundary'

function awsIdentityCenterAdministratorRoleArnPattern(accountId: string) {
  return `arn:aws:iam::${accountId}:role/aws-reserved/sso.amazonaws.com/eu-west-1/AWSReservedSSO_AdministratorAccess_*`
}

function awsIdentityCenterAdministratorAssumedRoleArnPattern(accountId: string) {
  return `arn:aws:sts::${accountId}:assumed-role/AWSReservedSSO_AdministratorAccess_*/*`
}

export function createRestrictedCiRoleAssumerPrincipal(accountId: string) {
  const identityCenterAdministratorRoleArn = awsIdentityCenterAdministratorRoleArnPattern(accountId)
  const identityCenterAdministratorAssumedRoleArn = awsIdentityCenterAdministratorAssumedRoleArnPattern(accountId)

  return new iam.PrincipalWithConditions(new iam.AccountPrincipal(accountId), {
    ArnLike: {
      'aws:PrincipalArn': [identityCenterAdministratorRoleArn, identityCenterAdministratorAssumedRoleArn]
    }
  })
}

const restrictedCiBoundaryActionPatterns = [
  'acm:AddTagsToCertificate',
  'acm:DeleteCertificate',
  'acm:DescribeCertificate',
  'acm:ListTagsForCertificate',
  'acm:RemoveTagsFromCertificate',
  'acm:RequestCertificate',
  'athena:BatchGet*',
  'athena:Get*',
  'athena:List*',
  'athena:ListTagsForResource',
  'athena:CreateNamedQuery',
  'athena:CreateWorkGroup',
  'athena:DeleteNamedQuery',
  'athena:DeleteWorkGroup',
  'athena:TagResource',
  'athena:UntagResource',
  'athena:UpdateWorkGroup',
  'backup:Get*',
  'backup:List*',
  'backup:CreateBackupPlan',
  'backup:CreateBackupSelection',
  'backup:CreateBackupVault',
  'backup:PutBackupVaultAccessPolicy',
  'backup:PutBackupVaultNotifications',
  'backup:TagResource',
  'backup:UntagResource',
  'backup:UpdateBackupPlan',
  'cloudformation:*',
  'cloudfront:Get*',
  'cloudfront:ListTagsForResource',
  'cloudfront:CreateCachePolicy',
  'cloudfront:CreateDistribution',
  'cloudfront:CreateOriginRequestPolicy',
  'cloudfront:CreateResponseHeadersPolicy',
  'cloudfront:DeleteCachePolicy',
  'cloudfront:DeleteDistribution',
  'cloudfront:DeleteOriginRequestPolicy',
  'cloudfront:DeleteResponseHeadersPolicy',
  'cloudfront:TagResource',
  'cloudfront:UntagResource',
  'cloudfront:UpdateDistribution',
  'cloudwatch:DeleteAlarms',
  'cloudwatch:DescribeAlarms',
  'cloudwatch:ListTagsForResource',
  'cloudwatch:PutMetricAlarm',
  'cloudwatch:TagResource',
  'cloudwatch:UntagResource',
  'ec2:AllocateAddress',
  'ec2:AssociateRouteTable',
  'ec2:AttachInternetGateway',
  'ec2:AuthorizeSecurityGroupIngress',
  'ec2:Describe*',
  'ec2:CreateInternetGateway',
  'ec2:CreateNatGateway',
  'ec2:CreateRoute',
  'ec2:CreateRouteTable',
  'ec2:CreateSecurityGroup',
  'ec2:CreateSubnet',
  'ec2:CreateTags',
  'ec2:CreateVpc',
  'ec2:DeleteInternetGateway',
  'ec2:DeleteNatGateway',
  'ec2:DeleteRoute',
  'ec2:DeleteRouteTable',
  'ec2:DeleteSecurityGroup',
  'ec2:DeleteSubnet',
  'ec2:DeleteVpc',
  'ec2:DetachInternetGateway',
  'ec2:DisassociateRouteTable',
  'ec2:ModifySubnetAttribute',
  'ec2:ModifyVpcAttribute',
  'ec2:ReleaseAddress',
  'ec2:ReplaceRoute',
  'ec2:RevokeSecurityGroupIngress',
  'ec2:TerminateInstances',
  'ecs:CreateCluster',
  'ecs:DeregisterTaskDefinition',
  'ecs:Describe*',
  'ecs:List*',
  'ecs:ListTagsForResource',
  'ecs:DeleteCluster',
  'ecs:DeleteService',
  'ecs:TagResource',
  'ecs:UntagResource',
  'elasticloadbalancing:*',
  'glue:Get*',
  'glue:CreateDatabase',
  'glue:CreateTable',
  'glue:DeleteDatabase',
  'glue:DeleteTable',
  'glue:TagResource',
  'glue:UntagResource',
  'glue:UpdateDatabase',
  'glue:UpdateTable',
  'iam:GetRole',
  'iam:CreatePolicyVersion',
  'iam:DeletePolicyVersion',
  'iam:ListPolicyVersions',
  'iam:PassRole',
  'lambda:AddPermission',
  'lambda:CreateFunction',
  'lambda:DeleteFunction',
  'lambda:Get*',
  'lambda:ListTags',
  'lambda:RemovePermission',
  'lambda:TagResource',
  'lambda:UntagResource',
  'lambda:UpdateFunctionCode',
  'lambda:UpdateFunctionConfiguration',
  'logs:CreateLogGroup',
  'logs:CreateLogStream',
  'logs:DeleteLogGroup',
  'logs:DeleteRetentionPolicy',
  'logs:DescribeLogGroups',
  'logs:DescribeLogStreams',
  'logs:ListTagsForResource',
  'logs:PutLogEvents',
  'logs:PutRetentionPolicy',
  'logs:TagResource',
  'logs:UntagResource',
  'rds:AddTagsToResource',
  'rds:DescribeDB*',
  'rds:ListTagsForResource',
  'rds:CreateDBInstance',
  'rds:CreateDBParameterGroup',
  'rds:CreateDBSubnetGroup',
  'rds:DeleteDBParameterGroup',
  'rds:DeleteDBSubnetGroup',
  'rds:ModifyDBInstance',
  'rds:ModifyDBParameterGroup',
  'rds:RemoveTagsFromResource',
  'route53:ChangeResourceRecordSets',
  'route53:CreateHostedZone',
  'route53:DeleteHostedZone',
  'route53:GetChange',
  'route53:GetHostedZone',
  'route53:ListHostedZonesByName',
  'route53:ListResourceRecordSets',
  's3:CreateBucket',
  's3:GetBucket*',
  's3:GetEncryptionConfiguration',
  's3:GetLifecycle*',
  's3:GetObject',
  's3:GetObjectAcl',
  's3:ListBucket',
  's3:PutBucketAcl',
  's3:PutBucketPolicy',
  's3:PutBucketPublicAccessBlock',
  's3:PutBucketTagging',
  's3:PutBucketVersioning',
  's3:PutEncryptionConfiguration',
  's3:PutLifecycleConfiguration',
  's3:PutObject',
  's3:PutObjectAcl',
  'secretsmanager:CancelRotateSecret',
  'secretsmanager:CreateSecret',
  'secretsmanager:DeleteResourcePolicy',
  'secretsmanager:DeleteSecret',
  'secretsmanager:DescribeSecret',
  'secretsmanager:GetResourcePolicy',
  'secretsmanager:GetSecretValue',
  'secretsmanager:ListSecretVersionIds',
  'secretsmanager:PutResourcePolicy',
  'secretsmanager:PutSecretValue',
  'secretsmanager:RotateSecret',
  'secretsmanager:TagResource',
  'secretsmanager:UntagResource',
  'secretsmanager:UpdateSecret',
  'secretsmanager:UpdateSecretVersionStage',
  'sns:CreateTopic',
  'sns:DeleteTopic',
  'sns:Get*',
  'sns:List*',
  'sns:ListTagsForResource',
  'sns:SetSubscriptionAttributes',
  'sns:SetTopicAttributes',
  'sns:Subscribe',
  'sns:TagResource',
  'sns:UntagResource',
  'sns:Unsubscribe',
  'ssm:GetParameter',
  'ssm:GetParameters',
  'sts:AssumeRole',
  'sts:GetCallerIdentity'
]

function ludosTaskDefinitionArnPattern(props: CommonStackProps) {
  return `arn:aws:ecs:${props.env!.region!}:${props.env!.account!}:task-definition/${props.envNameCapitalized}LudosStackLudosApplicationStackTaskDef*:*`
}

function ludosRepositoryArn(props: CommonStackProps) {
  return `arn:aws:ecr:${props.env!.region!}:${accounts.utility.id}:repository/ludos`
}

function ludosClusterArn(props: CommonStackProps) {
  return `arn:aws:ecs:${props.env!.region!}:${props.env!.account!}:cluster/${props.envNameCapitalized}Cluster`
}

function ludosServiceArn(props: CommonStackProps) {
  return `arn:aws:ecs:${props.env!.region!}:${props.env!.account!}:service/${props.envNameCapitalized}Cluster/${props.envNameCapitalized}Service`
}

export function restrictedCiBoundaryStatements(props: CommonStackProps) {
  return [
    new iam.PolicyStatement({
      actions: restrictedCiBoundaryActionPatterns,
      resources: ['*']
    }),
    new iam.PolicyStatement({
      actions: ['ecs:RegisterTaskDefinition'],
      resources: [ludosTaskDefinitionArnPattern(props)]
    }),
    new iam.PolicyStatement({
      actions: [
        'ecr:CreateRepository',
        'ecr:DeleteRepository',
        'ecr:DeleteRepositoryPolicy',
        'ecr:DescribeImages',
        'ecr:DescribeRepositories',
        'ecr:GetRepositoryPolicy',
        'ecr:ListImages',
        'ecr:ListTagsForResource',
        'ecr:PutImageTagMutability',
        'ecr:SetRepositoryPolicy',
        'ecr:TagResource',
        'ecr:UntagResource'
      ],
      resources: [ludosRepositoryArn(props)]
    }),
    new iam.PolicyStatement({
      actions: ['ecs:UpdateService'],
      resources: [ludosServiceArn(props)],
      conditions: {
        ArnEquals: {
          'ecs:cluster': ludosClusterArn(props)
        },
        ArnLike: {
          'ecs:task-definition': ludosTaskDefinitionArnPattern(props)
        }
      }
    }),
    new iam.PolicyStatement({
      actions: ['ec2:RunInstances'],
      resources: ['*'],
      conditions: {
        StringEquals: {
          'ec2:InstanceType': 't4g.nano'
        }
      }
    })
  ]
}

export class GithubActionsStack extends cdk.Stack {
  public githubActionsRole: iam.Role
  public restrictedDeployRole: iam.Role

  constructor(scope: Construct, id: string, props: CommonStackProps) {
    super(scope, id, props)

    const githubActionsOidcProvider = new iam.CfnOIDCProvider(this, 'GithubActionsIdentityProvider', {
      url: 'https://token.actions.githubusercontent.com',
      clientIdList: ['sts.amazonaws.com'],
      thumbprintList: GITHUB_ACTIONS_OIDC_THUMBPRINT_LIST
    })

    const restrictedCiRoleAssumer = createRestrictedCiRoleAssumerPrincipal(props.env!.account!)

    this.githubActionsRole = new iam.Role(this, 'GithubActionsRole', {
      roleName: `ludos-github-actions-role-${props.envName}`,
      assumedBy: new iam.FederatedPrincipal(
        githubActionsOidcProvider.attrArn,
        {
          StringEquals: { 'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com' },
          StringLike: { 'token.actions.githubusercontent.com:sub': 'repo:Opetushallitus/ludos:*' }
        },
        'sts:AssumeRoleWithWebIdentity'
      )
    })

    const cdkPolicyStatement = new iam.PolicyStatement({
      actions: ['sts:AssumeRole'],
      resources: [
        'arn:aws:iam::*:role/cdk-hnb659fds-deploy-role-*',
        'arn:aws:iam::*:role/cdk-hnb659fds-file-publishing-*',
        'arn:aws:iam::*:role/cdk-hnb659fds-lookup-role-*'
      ]
    })
    this.githubActionsRole.addToPolicy(cdkPolicyStatement)

    const restrictedCiPermissionsBoundary = new iam.ManagedPolicy(this, 'RestrictedCiPermissionsBoundary', {
      managedPolicyName: RESTRICTED_CI_PERMISSIONS_BOUNDARY_NAME,
      description: 'Maximum permissions allowed for the restricted CI deploy lane.',
      statements: restrictedCiBoundaryStatements(props)
    })

    const restrictedCloudFormationExecutionRole = new iam.Role(this, 'RestrictedCloudFormationExecutionRole', {
      roleName: 'ludos-restricted-ci-cfn-exec-role',
      description:
        'CloudFormation execution role for the restricted CI deploy lane. Assumed only by CloudFormation after the restricted CI deploy role is passed to it.',
      assumedBy: new iam.ServicePrincipal('cloudformation.amazonaws.com'),
      permissionsBoundary: restrictedCiPermissionsBoundary
    })

    const bootstrapDeployRoleRegions = Array.from(new Set([props.env!.region!, 'us-east-1']))
    for (const region of bootstrapDeployRoleRegions) {
      const bootstrapDeployRole = iam.Role.fromRoleName(
        this,
        `BootstrapDeployRole${region.replace(/[^a-zA-Z0-9]/g, '')}`,
        `cdk-hnb659fds-deploy-role-${props.env!.account!}-${region}`
      )
      restrictedCloudFormationExecutionRole.grantPassRole(bootstrapDeployRole)
    }

    for (const statement of restrictedCiBoundaryStatements(props)) {
      restrictedCloudFormationExecutionRole.addToPolicy(statement)
    }

    this.restrictedDeployRole = new iam.Role(this, 'RestrictedDeployRole', {
      roleName: 'ludos-restricted-ci-deploy-role',
      description:
        'Restricted deploy role for the CI permission lane. Assumed either by GitHub Actions OIDC for CI deploys or locally via the AWS Identity Center AdministratorAccess role when simulating the same permissions.',
      assumedBy: new iam.CompositePrincipal(
        restrictedCiRoleAssumer,
        new iam.FederatedPrincipal(
          githubActionsOidcProvider.attrArn,
          {
            StringEquals: { 'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com' },
            StringLike: { 'token.actions.githubusercontent.com:sub': 'repo:Opetushallitus/ludos:*' }
          },
          'sts:AssumeRoleWithWebIdentity'
        )
      ),
      permissionsBoundary: restrictedCiPermissionsBoundary
    })

    this.restrictedDeployRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          'cloudformation:CreateChangeSet',
          'cloudformation:CreateStack',
          'cloudformation:DeleteChangeSet',
          'cloudformation:DeleteStack',
          'cloudformation:DescribeChangeSet',
          'cloudformation:DescribeStackEvents',
          'cloudformation:DescribeStacks',
          'cloudformation:ExecuteChangeSet',
          'cloudformation:GetTemplate',
          'cloudformation:GetTemplateSummary',
          'cloudformation:RollbackStack',
          'cloudformation:ContinueUpdateRollback',
          'cloudformation:UpdateStack',
          'ecs:DescribeTaskDefinition',
          'ecs:ListTaskDefinitions',
          'ssm:GetParameter',
          'sts:GetCallerIdentity'
        ],
        resources: ['*']
      })
    )

    this.restrictedDeployRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['sts:AssumeRole'],
        resources: [
          `arn:aws:iam::${props.env?.account}:role/cdk-hnb659fds-deploy-role-${props.env?.account}-*`,
          `arn:aws:iam::${props.env?.account}:role/cdk-hnb659fds-file-publishing-role-${props.env?.account}-*`,
          `arn:aws:iam::${props.env?.account}:role/cdk-hnb659fds-lookup-role-${props.env?.account}-*`
        ]
      })
    )

    this.restrictedDeployRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['iam:PassRole'],
        resources: [restrictedCloudFormationExecutionRole.roleArn],
        conditions: {
          StringEquals: {
            'iam:PassedToService': 'cloudformation.amazonaws.com'
          }
        }
      })
    )
  }
}
