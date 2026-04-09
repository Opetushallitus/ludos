import * as cdk from 'aws-cdk-lib'
import * as ecr from 'aws-cdk-lib/aws-ecr'
import * as iam from 'aws-cdk-lib/aws-iam'
import { Construct } from 'constructs'
import { CommonStackProps } from '../types'
import { accounts } from './accounts'
import {
  createRestrictedCiRoleAssumerPrincipal,
  GITHUB_ACTIONS_OIDC_THUMBPRINT_LIST,
  RESTRICTED_CI_PERMISSIONS_BOUNDARY_NAME,
  restrictedCiBoundaryStatements
} from './githubActionsStack'

export class EcrStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: CommonStackProps) {
    super(scope, id, props)

    const restrictedCiRoleAssumer = createRestrictedCiRoleAssumerPrincipal(props.env!.account!)

    const ludosRepo = new ecr.Repository(this, 'LudosRepository', {
      repositoryName: 'ludos',
      imageTagMutability: ecr.TagMutability.IMMUTABLE
    })

    ludosRepo.grantPull(new iam.AccountPrincipal(accounts.dev.id))
    ludosRepo.grantPull(new iam.AccountPrincipal(accounts.qa.id))
    ludosRepo.grantPull(new iam.AccountPrincipal(accounts.prod.id))

    const githubActionsOidcProvider = new iam.CfnOIDCProvider(this, 'GhActionsIdentityProvider', {
      url: 'https://token.actions.githubusercontent.com',
      clientIdList: ['sts.amazonaws.com'],
      thumbprintList: GITHUB_ACTIONS_OIDC_THUMBPRINT_LIST
    })

    const githubActionsPushRole = new iam.Role(this, 'GhActionsPushRole', {
      roleName: 'ludos-gh-actions-ecr-push-role',
      assumedBy: new iam.FederatedPrincipal(
        githubActionsOidcProvider.attrArn,
        {
          StringEquals: { 'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com' },
          StringLike: { 'token.actions.githubusercontent.com:sub': 'repo:Opetushallitus/ludos:*' }
        },
        'sts:AssumeRoleWithWebIdentity'
      )
    })

    ludosRepo.grantPullPush(githubActionsPushRole)

    const restrictedCiPermissionsBoundary = new iam.ManagedPolicy(this, 'RestrictedCiPermissionsBoundary', {
      managedPolicyName: RESTRICTED_CI_PERMISSIONS_BOUNDARY_NAME,
      description: 'Maximum permissions allowed for the restricted CI deploy lane.',
      statements: restrictedCiBoundaryStatements(props)
    })

    const restrictedCloudFormationExecutionRole = new iam.Role(this, 'RestrictedCloudFormationExecutionRole', {
      roleName: 'ludos-restricted-ci-cfn-exec-role',
      description:
        'CloudFormation execution role for the restricted CI deploy lane in the utility account. Assumed only by CloudFormation after the restricted CI deploy role is passed to it.',
      assumedBy: new iam.ServicePrincipal('cloudformation.amazonaws.com'),
      permissionsBoundary: restrictedCiPermissionsBoundary
    })

    const bootstrapDeployRole = iam.Role.fromRoleName(
      this,
      'BootstrapDeployRoleEuwest1',
      `cdk-hnb659fds-deploy-role-${props.env!.account!}-${props.env!.region!}`
    )
    restrictedCloudFormationExecutionRole.grantPassRole(bootstrapDeployRole)

    for (const statement of restrictedCiBoundaryStatements(props)) {
      restrictedCloudFormationExecutionRole.addToPolicy(statement)
    }

    const restrictedDeployRole = new iam.Role(this, 'RestrictedCiDeployRole', {
      roleName: 'ludos-restricted-ci-deploy-role',
      description:
        'Restricted deploy role for the CI permission lane in the utility account. Assumed locally only via the AWS Identity Center AdministratorAccess role when simulating GitHub Actions AWS permissions.',
      assumedBy: restrictedCiRoleAssumer,
      permissionsBoundary: restrictedCiPermissionsBoundary
    })

    restrictedDeployRole.addToPolicy(
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
          'iam:PassRole',
          'ssm:GetParameter',
          'ssm:GetParameters',
          'sts:AssumeRole',
          'sts:GetCallerIdentity'
        ],
        resources: ['*']
      })
    )

    restrictedDeployRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['sts:AssumeRole'],
        resources: [
          `arn:aws:iam::${props.env?.account}:role/cdk-hnb659fds-file-publishing-role-${props.env?.account}-${props.env?.region}`,
          `arn:aws:iam::${props.env?.account}:role/cdk-hnb659fds-lookup-role-${props.env?.account}-${props.env?.region}`
        ]
      })
    )

    restrictedDeployRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['iam:PassRole'],
        resources: [restrictedCloudFormationExecutionRole.roleArn]
      })
    )

    const restrictedImageReadRole = new iam.Role(this, 'RestrictedDeployRole', {
      roleName: 'ludos-restricted-ci-image-read-role',
      description:
        'Restricted read role for the CI permission lane. Assumed locally only via the AWS Identity Center AdministratorAccess role when simulating GitHub Actions image reads from the utility account.',
      assumedBy: restrictedCiRoleAssumer,
      permissionsBoundary: restrictedCiPermissionsBoundary
    })

    restrictedImageReadRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['ecr:DescribeImages', 'ecr:ListImages'],
        resources: [ludosRepo.repositoryArn]
      })
    )
  }
}
