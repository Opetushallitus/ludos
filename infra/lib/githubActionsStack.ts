import * as cdk from 'aws-cdk-lib'
import * as iam from 'aws-cdk-lib/aws-iam'
import { Construct } from 'constructs'
import { CommonStackProps } from '../types'

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
  'acm:*',
  'athena:*',
  'backup:*',
  'cloudformation:*',
  'cloudfront:*',
  'cloudwatch:*',
  'ec2:*',
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
  'ecr:UntagResource',
  'ecs:*',
  'elasticloadbalancing:*',
  'events:*',
  'glue:*',
  'iam:PassRole',
  'lambda:*',
  'logs:*',
  'rds:*',
  'route53:*',
  's3:*',
  'secretsmanager:*',
  'sns:*',
  'ssm:GetParameter',
  'ssm:GetParameters',
  'sts:AssumeRole',
  'sts:GetCallerIdentity'
]

export function restrictedCiBoundaryStatements() {
  return [
    new iam.PolicyStatement({
      actions: restrictedCiBoundaryActionPatterns,
      resources: ['*']
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
      actions: ['sts:AssumeRole', 'iam:PassRole'],
      resources: [
        'arn:aws:iam::*:role/cdk-readOnlyRole',
        'arn:aws:iam::*:role/cdk-hnb659fds-deploy-role-*',
        'arn:aws:iam::*:role/cdk-hnb659fds-file-publishing-*',
        'arn:aws:iam::*:role/cdk-hnb659fds-lookup-role-*'
      ]
    })
    this.githubActionsRole.addToPolicy(cdkPolicyStatement)

    const restrictedCiPermissionsBoundary = new iam.ManagedPolicy(this, 'RestrictedCiPermissionsBoundary', {
      managedPolicyName: RESTRICTED_CI_PERMISSIONS_BOUNDARY_NAME,
      description: 'Maximum permissions allowed for the restricted CI deploy lane.',
      statements: restrictedCiBoundaryStatements()
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

    for (const statement of restrictedCiBoundaryStatements()) {
      restrictedCloudFormationExecutionRole.addToPolicy(statement)
    }

    this.restrictedDeployRole = new iam.Role(this, 'RestrictedDeployRole', {
      roleName: 'ludos-restricted-ci-deploy-role',
      description:
        'Restricted deploy role for the CI permission lane. Assumed locally only via the AWS Identity Center AdministratorAccess role when simulating GitHub Actions AWS permissions.',
      assumedBy: restrictedCiRoleAssumer,
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
          'sts:AssumeRole',
          'sts:GetCallerIdentity'
        ],
        resources: ['*']
      })
    )

    this.restrictedDeployRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['sts:AssumeRole'],
        resources: [
          `arn:aws:iam::${props.env?.account}:role/cdk-hnb659fds-file-publishing-role-${props.env?.account}-*`,
          `arn:aws:iam::${props.env?.account}:role/cdk-hnb659fds-lookup-role-${props.env?.account}-*`
        ]
      })
    )

    this.restrictedDeployRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['iam:PassRole'],
        resources: [restrictedCloudFormationExecutionRole.roleArn]
      })
    )
  }
}
