import * as cdk from 'aws-cdk-lib'
import * as iam from 'aws-cdk-lib/aws-iam'
import { Construct } from 'constructs'
import { CommonStackProps } from '../types'

export const GITHUB_ACTIONS_OIDC_THUMBPRINT_LIST = [
  '6938fd4d98bab03faadb97b34396831e3780aea1',
  '1c58a3a8518e8759bf075b76b750d4f2df264fcd'
]

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

    const localDeveloperAssumer = new iam.PrincipalWithConditions(new iam.AccountPrincipal(props.env!.account!), {
      ArnLike: {
        'aws:PrincipalArn': [
          `arn:aws:iam::${props.env!.account!}:role/aws-reserved/sso.amazonaws.com/eu-west-1/AWSReservedSSO_AdministratorAccess_*`,
          `arn:aws:sts::${props.env!.account!}:assumed-role/AWSReservedSSO_AdministratorAccess_*/*`
        ]
      }
    })

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

    const restrictedCloudFormationExecutionRole = new iam.Role(this, 'RestrictedCloudFormationExecutionRole', {
      roleName: 'ludos-restricted-ci-cfn-exec-role',
      description:
        'CloudFormation execution role for the restricted CI deploy lane. Assumed only by CloudFormation after the restricted CI deploy role is passed to it.',
      assumedBy: new iam.ServicePrincipal('cloudformation.amazonaws.com'),
      managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName('PowerUserAccess')]
    })

    restrictedCloudFormationExecutionRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          'iam:AddClientIDToOpenIDConnectProvider',
          'iam:AttachRolePolicy',
          'iam:CreateOpenIDConnectProvider',
          'iam:CreatePolicy',
          'iam:CreateRole',
          'iam:CreateServiceLinkedRole',
          'iam:DeleteOpenIDConnectProvider',
          'iam:DeletePolicy',
          'iam:DeleteRole',
          'iam:DeleteRolePolicy',
          'iam:DetachRolePolicy',
          'iam:GetOpenIDConnectProvider',
          'iam:GetPolicy',
          'iam:GetPolicyVersion',
          'iam:GetRole',
          'iam:GetRolePolicy',
          'iam:ListAttachedRolePolicies',
          'iam:ListInstanceProfilesForRole',
          'iam:ListPolicyVersions',
          'iam:ListRolePolicies',
          'iam:PassRole',
          'iam:PutRolePolicy',
          'iam:RemoveClientIDFromOpenIDConnectProvider',
          'iam:TagOpenIDConnectProvider',
          'iam:TagPolicy',
          'iam:TagRole',
          'iam:UntagOpenIDConnectProvider',
          'iam:UntagPolicy',
          'iam:UntagRole',
          'iam:UpdateAssumeRolePolicy',
          'iam:UpdateOpenIDConnectProviderThumbprint'
        ],
        resources: ['*']
      })
    )

    this.restrictedDeployRole = new iam.Role(this, 'RestrictedDeployRole', {
      roleName: 'ludos-restricted-ci-deploy-role',
      description:
        'Restricted deploy role for the CI permission lane. Assumed locally only via the AWS Identity Center AdministratorAccess role when simulating GitHub Actions AWS permissions.',
      assumedBy: localDeveloperAssumer
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
          'iam:PassRole',
          'ssm:GetParameter',
          'ssm:GetParameters',
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
